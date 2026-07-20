import websocket
import json
import base64
import cv2
import numpy as np
from datetime import datetime, timezone

_stream_frame_count = 0

def encode_frame_base64(frame: np.ndarray, quality: int = 60) -> str:
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

def send_fall_alert(ws: websocket.WebSocket, room_id: str, blurred_frame: np.ndarray,
                    fall_prob: float = 0.0, audio_prob: float = 0.0):
    payload = {
        "type": "FALL_DETECTED",
        "room_id": room_id,
        "severity": "critical",
        "title": "PHAT HIEN TE NGA",
        "description": f"AI Camera phat hien nguoi nga tai phong {room_id}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "blurred_image_base64": encode_frame_base64(blurred_frame),
        "fall_prob": round(fall_prob * 100, 1),    # % xac suat nga tu model (0-100)
        "audio_prob": round(audio_prob * 100, 1),  # % cuong do am thanh (0-100)
    }
    ws.send(json.dumps(payload))

def send_camera_stream(ws: websocket.WebSocket, room_id: str, frame: np.ndarray):
    global _stream_frame_count
    # Resize frame de giam thieu bang thong mang (Chi can gui 480x270)
    small_frame = cv2.resize(frame, (480, 270))
    payload = {
        "type": "CAMERA_STREAM",
        "room_id": room_id,
        "image_base64": encode_frame_base64(small_frame, quality=40),
    }
    ws.send(json.dumps(payload))
    _stream_frame_count += 1
    # In log moi 30 frame (~3 giay) de xac nhan stream dang hoat dong
    if _stream_frame_count % 30 == 0:
        print(f"[STREAM] Da gui {_stream_frame_count} frame toi room {room_id}")

def send_iv_alert(ws: websocket.WebSocket, room_id: str, display_frame: np.ndarray, percentage: float):
    payload = {
        "type": "INCIDENT_ALERT",
        "data": {
            "room": room_id,
            "severity": "warning",
            "title": "CẢNH BÁO TRUYỀN DỊCH",
            "description": f"Mực nước bình truyền dịch còn {percentage:.1f}%",
        }
    }
    ws.send(json.dumps(payload))
