import cv2
import time
import sys
import websocket
from config import ROOM_ID, WS_BACKEND_URL, CAMERA_SOURCE, FALL_COOLDOWN_SECONDS
from modules.vnpt_person_detect import detect_person_bbox
from modules.pose_extractor import get_landmarks, draw_skeleton
from modules.feature_extractor import extract_features
from modules.fall_detector import predict_fall
from modules.blur_body import anonymize_body
from modules.websocket_client import send_fall_alert, send_camera_stream

def connect_ws():
    for attempt in range(5):
        try:
            ws = websocket.create_connection(WS_BACKEND_URL, timeout=10)
            print(f"[OK] WebSocket ket noi thanh cong: {WS_BACKEND_URL}")
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

        for bbox in bboxes:
            landmarks_info = get_landmarks(frame, bbox)
            if landmarks_info is None:
                continue
                
            results, shape = landmarks_info
            features = extract_features(results, shape)
            
            # Luon luon lam mo co the va ve khung xuong tren man hinh
            frame = anonymize_body(frame)
            frame = draw_skeleton(frame, results)
            
            if features is not None and predict_fall(features):
                now = time.time()
                if now - last_alert < FALL_COOLDOWN_SECONDS:
                    continue
                print(f"[ALERT] TE NGA tai phong {ROOM_ID}!")
                try:
                    # Gui frame da lam mo kem khung xuong
                    send_fall_alert(ws, ROOM_ID, frame)
                    last_alert = now
                except Exception as e:
                    print(f"[ERROR] {e}. Ket noi lai...")
                    ws = connect_ws()
                    
            # Live Streaming (10 FPS limit)
            now = time.time()
            if now - last_stream_time >= 0.1:  # 10 FPS
                try:
                    send_camera_stream(ws, ROOM_ID, frame)
                    last_stream_time = now
                except Exception as e:
                    print(f"[ERROR] Stream failed: {e}")
                    ws = connect_ws()
                    
        # Hien thi hinh anh len man hinh de test
        cv2.imshow("EyeCU - Camera Test (Bam Q de thoat)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    ws.close()

if __name__ == "__main__":
    main()
