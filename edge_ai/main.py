import cv2
import time
import sys
import json
import websocket
import threading
import queue
import urllib.request
from config import ROOM_PREFIX, ROOM_ID_FALLBACK, WS_BACKEND_URL, CAMERA_SOURCE, FALL_COOLDOWN_SECONDS
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

def wake_up_backend():
    """Ping HTTP de Wake-up Render.com truoc khi ket noi WebSocket.
    Render Free Tier spin-down sau 15 phut idle, can ~30-60s de khoi dong lai."""
    # Chuyen doi wss:// -> https:// de ping HTTP
    http_url = WS_BACKEND_URL.replace("wss://", "https://").replace("ws://", "http://")
    # Lay base URL (bo di path /api/ambient/ws/live)
    base_url = http_url.split("/api/")[0] + "/api/ambient/active-rooms"
    print(f"[INFO] Dang wake-up backend tai {base_url}...")
    for attempt in range(3):
        try:
            req = urllib.request.urlopen(base_url, timeout=20)
            if req.status == 200:
                print(f"[OK] Backend da thuc sau {attempt+1} lan thu.")
                return True
        except Exception as e:
            print(f"[RETRY {attempt+1}/3] Backend chua san sang: {e}. Cho 5s...")
            time.sleep(5)
    print("[WARN] Khong wake-up duoc backend, tiep tuc ket noi WebSocket...")
    return False

def connect_ws():
    for attempt in range(5):
        try:
            ws = websocket.create_connection(WS_BACKEND_URL, timeout=60)
            print(f"[OK] WebSocket ket noi thanh cong: {WS_BACKEND_URL}")
            # Khoi tao luong doc du lieu rac (ping, broadcast loopback)
            threading.Thread(target=ws_reader, args=(ws,), daemon=True).start()
            return ws
        except Exception as e:
            print(f"[RETRY {attempt+1}/5] {e}. Thu lai sau 3s...")
            time.sleep(3)
    sys.exit(1)

def register_room(ws: websocket.WebSocket, timeout: float = 15.0) -> str:
    """Gui REGISTER toi server, doi phan hoi ROOM_ASSIGNED. Tra ve room_id.
    
    Timeout mac dinh tang len 15s de xu ly Render.com cold-start cham.
    """
    # Gui yeu cau dang ky room
    ws.send(json.dumps({
        "type": "REGISTER",
        "room_prefix": ROOM_PREFIX,
    }))
    print(f"[INFO] Dang gui yeu cau dang ky room voi prefix '{ROOM_PREFIX}'...")

    # Doi server tra loi trong timeout
    ws.settimeout(timeout)
    try:
        while True:
            msg = ws.recv()
            data = json.loads(msg)
            if data.get("type") == "ROOM_ASSIGNED":
                room_id = data["room_id"]
                print(f"[OK] Da nhan duoc room: {room_id}")
                return room_id
            if data.get("type") == "ROOM_ERROR":
                print(f"[WARN] Server tra loi loi: {data.get('message')}")
                break
            # Bo qua cac message khong lien quan (ping, broadcast, ...)
    except websocket.WebSocketTimeoutException:
        print(f"[WARN] Timeout doi phan hoi dang ky room ({timeout}s)")
    except Exception as e:
        print(f"[WARN] Loi khi nhan phan hoi dang ky: {e}")
    finally:
        ws.settimeout(60)  # Reset timeout

    # Fallback ve ROOM_ID tu .env
    print(f"[INFO] Su dung room fallback: {ROOM_ID_FALLBACK}")
    return ROOM_ID_FALLBACK

def main():
    # Wake-up backend truoc (quan trong voi Render.com Free Tier)
    wake_up_backend()
    
    ws = connect_ws()

    # Dang ky room voi server
    room_id = register_room(ws)

    cam = int(CAMERA_SOURCE) if CAMERA_SOURCE.isdigit() else CAMERA_SOURCE
    cap = cv2.VideoCapture(cam)
    last_alert = 0
    last_stream_time = 0

    # --- Adaptive FPS ---
    # 4 may x 5 FPS x ~8KB = ~160 KB/s upload tong cong -> Render.com Free an toan
    # Khi nga: tang len 10 FPS de nhan vien y te thay canh bao nhanh hon
    FPS_NORMAL = 5          # 5 FPS khi phong on dinh (giam bandwidth 50%)
    FPS_ALERT  = 10         # 10 FPS khi phat hien nga (uu tien phan hoi nhanh)
    INTERVAL_NORMAL = 1.0 / FPS_NORMAL   # 0.200s
    INTERVAL_ALERT  = 1.0 / FPS_ALERT    # 0.100s

    print(f"[OK] Camera dang chay. Room: {room_id}. Nhan Ctrl+C de thoat.")

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue

        bboxes = detect_person_bbox(frame)
        if not bboxes:
            # Phong trong: gui frame nho 320x180 voi FPS thap de tiet kiem bandwidth
            # Khong lo lo rieng tu vi khong co nguoi trong phong
            now = time.time()
            if now - last_stream_time >= INTERVAL_NORMAL:
                try:
                    # Giam resolution khi phong trong: 320x180 thay vi 480x270
                    small_empty = cv2.resize(frame, (320, 180))
                    ws_queue.put_nowait((send_camera_stream, (ws, room_id, small_empty)))
                    last_stream_time = now
                except queue.Full:
                    pass
            continue

        # Buoc 1: Kiem tra xem co ai bi nga khong
        is_falling = False
        all_results = []
        
        for bbox in bboxes:
            landmarks_info = get_landmarks(frame, bbox)
            if landmarks_info is None:
                continue
                
            results, shape = landmarks_info
            features = extract_features(results, shape)
            all_results.append(results)
            
            if features is not None and predict_fall(features):
                is_falling = True

        # Buoc 2: Xu ly rieng tu va hien thi
        if is_falling:
            # KHI NGA: Khung xuong BIEN MAT, nguoi benh HIEN LEN nhung bi lam HOI MO (light blur) de kiem tra chan thuong
            display_frame = anonymize_body(frame, blur_level='light')
            # KHONG VE khung xuong (bo qua buoc ve)
        else:
            # TRANG THAI BINH THUONG: Nguoi benh bi che khuat hoan toan (heavy blur/den), CHI HIEN KHUNG XUONG + Phong canh that
            display_frame = anonymize_body(frame, blur_level='heavy')
            # Ve khung xuong len tren cung
            for results in all_results:
                display_frame = draw_skeleton(display_frame, results)
            
        # Buoc 4: Gui canh bao (Neu can)
        if is_falling:
            now = time.time()
            if now - last_alert >= FALL_COOLDOWN_SECONDS:
                print(f"[ALERT] TE NGA tai phong {room_id}!")
                try:
                    ws_queue.put_nowait((send_fall_alert, (ws, room_id, display_frame.copy())))
                    last_alert = now
                except queue.Full:
                    pass
                    
        # Buoc 5: LIVE STREAMING voi Adaptive FPS
        now = time.time()
        # Khi nga: 10 FPS de capture ro rang tinh trang benh nhan
        # Khi on: 5 FPS de tiet kiem bandwidth (4 may x 5FPS x ~8KB = ~160KB/s)
        stream_interval = INTERVAL_ALERT if is_falling else INTERVAL_NORMAL
        if now - last_stream_time >= stream_interval:
            try:
                # Nhet vao queue. Neu mang cham, queue day -> bo qua frame nay de chong lag
                ws_queue.put_nowait((send_camera_stream, (ws, room_id, display_frame.copy())))
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
