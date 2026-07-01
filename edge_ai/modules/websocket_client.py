import websocket
import json
import base64
import cv2
import numpy as np
from datetime import datetime, timezone

def encode_frame_base64(frame: np.ndarray, quality: int = 60) -> str:
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

def send_fall_alert(ws: websocket.WebSocket, room_id: str, blurred_frame: np.ndarray):
    payload = {
        "type": "FALL_DETECTED",
        "room_id": room_id,
        "severity": "critical",
        "title": "PHAT HIEN TE NGA",
        "description": f"AI Camera phat hien nguoi nga tai phong {room_id}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "blurred_image_base64": encode_frame_base64(blurred_frame),
    }
    ws.send(json.dumps(payload))

def send_camera_stream(ws: websocket.WebSocket, room_id: str, frame: np.ndarray):
    payload = {
        "type": "CAMERA_STREAM",
        "room_id": room_id,
        "image_base64": encode_frame_base64(frame, quality=40),
    }
    ws.send(json.dumps(payload))
