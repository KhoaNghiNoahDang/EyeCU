import cv2
import json
import time
import queue
import threading
import websocket
from ultralytics import YOLO
import supervision as sv
import numpy as np
import base64

# --- Configuration ---
CAMERA_SOURCE = 0 # Use 0 for webcam
WS_BACKEND_URL = "ws://localhost:8000/api/crowd/ws/live"
CROWD_THRESHOLD = 5 # Alert if more than 5 people
CAMERA_ID = "cam_01"
CAMERA_NAME = "Sảnh chờ Khoa Nội tiết"

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
            ws = websocket.create_connection(WS_BACKEND_URL, timeout=60)
            print(f"[OK] WebSocket ket noi thanh cong: {WS_BACKEND_URL}")
            # Khoi tao luong doc du lieu rac de tranh tran bo nho dem
            threading.Thread(target=ws_reader, args=(ws,), daemon=True).start()
            return ws
        except Exception as e:
            print(f"[RETRY {attempt+1}/5] WebSocket ket noi that bai. Thu lai sau 2s...")
            time.sleep(2)
    print("[WARN] Khong the ket noi den Backend. Chay offline mode.")
    return None

def encode_frame_base64(frame: np.ndarray, quality: int = 60) -> str:
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

def send_telemetry(ws, count, alert, frame):
    if ws is None:
        return
    try:
        # We can also send the frame if we want, but for now just telemetry
        data = {
            "type": "CROWD_TELEMETRY",
            "camera_id": CAMERA_ID,
            "camera_name": CAMERA_NAME,
            "count": count,
            "alert": alert
        }
        if frame is not None:
            small_frame = cv2.resize(frame, (640, 480))
            data["image_base64"] = encode_frame_base64(small_frame, quality=40)
        ws.send(json.dumps(data))
    except Exception as e:
        print(f"[WS SEND ERROR] {e}")

def main():
    print("[INFO] Loading YOLO11 model...")
    model = YOLO("yolo11s.pt")
    
    # Initialize BoT-SORT Tracker
    tracker = sv.ByteTrack()

    # Setup Zone
    # For a webcam, we'll define a polygon covering the whole screen
    polygon = np.array([
        [0, 0],
        [640, 0],
        [640, 480],
        [0, 480]
    ])
    zone = sv.PolygonZone(polygon=polygon)
    
    # Annotators
    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    ws = connect_ws()

    cap = cv2.VideoCapture(CAMERA_SOURCE)
    # Set resolution to 640x480
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    last_send = 0
    
    print("[INFO] Starting Crowd Analytics Pipeline...")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Inference
        results = model(frame, classes=[0], conf=0.6, iou=0.45, verbose=False)[0] # class 0 is person
        detections = sv.Detections.from_ultralytics(results)
        
        # Tracking
        detections = tracker.update_with_detections(detections)

        # Trigger Zone
        zone.trigger(detections=detections)
        count_in_zone = zone.current_count
        
        is_crowded = count_in_zone >= CROWD_THRESHOLD

        # Annotate
        labels = [
            f"#{tracker_id}"
            for tracker_id in detections.tracker_id
        ]
        
        annotated_frame = box_annotator.annotate(scene=frame, detections=detections)
        annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)
        
        # Draw Polygon manually to avoid numpy 2.0 cross product issue in supervision
        cv2.polylines(annotated_frame, [polygon], isClosed=True, color=(0, 0, 255), thickness=2)

        # Add UI Text
        cv2.putText(annotated_frame, f"People in Zone: {count_in_zone}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        if is_crowded:
            cv2.putText(annotated_frame, "ALERT: OVERCROWDED!", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        # Send Telemetry via WS at 5 FPS
        now = time.time()
        if now - last_send >= 0.2:
            try:
                ws_queue.put_nowait((send_telemetry, (ws, int(count_in_zone), is_crowded, annotated_frame.copy())))
                last_send = now
            except queue.Full:
                pass

        cv2.imshow("Crowd AI Analytics", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    if ws:
        ws.close()

if __name__ == "__main__":
    main()
