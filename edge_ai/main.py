import cv2
import time
import sys
import websocket
import threading
import queue
from config import ROOM_ID, WS_BACKEND_URL, CAMERA_SOURCE, FALL_COOLDOWN_SECONDS
from modules.vnpt_person_detect import detect_person_bbox
from modules.pose_extractor import get_landmarks, draw_skeleton
from modules.feature_extractor import extract_features
from modules.fall_detector import predict_fall
from modules.blur_body import anonymize_body
from modules.websocket_client import send_fall_alert, send_camera_stream

# Hang doi de gui anh qua mang ma khong block Camera (chong lag 100%)
ws_queue = queue.Queue(maxsize=3)

def ws_worker():
    while True:
        try:
            func, args = ws_queue.get()
            func(*args)
        except Exception as e:
            print(f"[WS WORKER ERROR] {e}")

threading.Thread(target=ws_worker, daemon=True).start()

def ws_reader(ws):
    """Lien tuc doc du lieu tu server de khong bi day bo nho dem (buffer overflow)."""
    while True:
        try:
            ws.recv()
        except:
            break

def connect_ws():
    for attempt in range(5):
        try:
            ws = websocket.create_connection(WS_BACKEND_URL, timeout=10)
            print(f"[OK] WebSocket ket noi thanh cong: {WS_BACKEND_URL}")
            # Khoi tao luong doc du lieu rac (ping, broadcast loopback)
            threading.Thread(target=ws_reader, args=(ws,), daemon=True).start()
            return ws
        except Exception as e:
            print(f"[RETRY {attempt+1}/5] {e}. Thu lai sau 3s...")
            time.sleep(3)
    sys.exit(1)

def main():
    ws = connect_ws()
    cam = int(CAMERA_SOURCE) if CAMERA_SOURCE.isdigit() else CAMERA_SOURCE
    cap = cv2.VideoCapture(cam)
    last_alert = 0
    last_stream_time = 0

    print(f"[OK] Camera dang chay. Room: {ROOM_ID}. Nhan Ctrl+C de thoat.")

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue

        bboxes = detect_person_bbox(frame)
        if not bboxes:
            continue

        import numpy as np
        # Nguoi dung muon giu phong canh that, khong dung nen den nua
        display_frame = frame.copy()

        for bbox in bboxes:
            landmarks_info = get_landmarks(frame, bbox)
            if landmarks_info is None:
                continue
                
            results, shape = landmarks_info
            features = extract_features(results, shape)
            
            # 1. TRANG THAI BINH THUONG: Chi ve khung xuong tren nen den (Privacy tuyet doi, cuc nhe)
            display_frame = draw_skeleton(display_frame, results)
            
            # 2. KIEM TRA TE NGA
            if features is not None and predict_fall(features):
                now = time.time()
                if now - last_alert >= FALL_COOLDOWN_SECONDS:
                    print(f"[ALERT] TE NGA tai phong {ROOM_ID}!")
                    
                    # CHI lam mo anh vao khoanh khac bi nga (tiet kiem 99% CPU)
                    alert_frame = anonymize_body(frame)
                    alert_frame = draw_skeleton(alert_frame, results)
                    
                    try:
                        ws_queue.put_nowait((send_fall_alert, (ws, ROOM_ID, alert_frame.copy())))
                        last_alert = now
                    except queue.Full:
                        pass
                    
        # 3. LIVE STREAMING (Chi gui khung xuong tren nen den)
        now = time.time()
        if now - last_stream_time >= 0.1:  # 10 FPS
            try:
                # Nhet vao queue. Neu mang cham, queue day -> bo qua frame nay de chong lag
                ws_queue.put_nowait((send_camera_stream, (ws, ROOM_ID, display_frame.copy())))
                last_stream_time = now
            except queue.Full:
                pass
                    
        # Hien thi hinh anh len man hinh de test
        # cv2.imshow("EyeCU - Camera Test (Bam Q de thoat)", display_frame)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break

    cap.release()
    # cv2.destroyAllWindows()
    ws.close()

if __name__ == "__main__":
    main()
