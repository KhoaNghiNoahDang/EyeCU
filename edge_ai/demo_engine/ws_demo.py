import json
import time
import queue
import threading
import websocket
import cv2
import base64
import numpy as np
from datetime import datetime, timezone


def encode_frame_base64(frame, quality=40):
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")


def connect_ws(url, retries=5):
    for attempt in range(retries):
        try:
            ws = websocket.create_connection(url, timeout=60)
            print(f"[WS] Connected: {url}")
            threading.Thread(target=_ws_reader, args=(ws,), daemon=True).start()
            return ws
        except Exception as e:
            print(f"[WS] Retry {attempt+1}/{retries}: {e}")
            time.sleep(3)
    raise ConnectionError("Cannot connect to WebSocket server")


def _ws_reader(ws):
    while True:
        try:
            ws.recv()
        except Exception:
            break


def register_room(ws, prefix, timeout=5.0):
    ws.send(json.dumps({"type": "REGISTER", "room_prefix": prefix}))
    ws.settimeout(timeout)
    try:
        while True:
            msg = ws.recv()
            data = json.loads(msg)
            if data.get("type") == "ROOM_ASSIGNED":
                room_id = data["room_id"]
                print(f"[WS] Room assigned: {room_id}")
                return room_id
            if data.get("type") == "ROOM_ERROR":
                print(f"[WS] Server error: {data.get('message')}")
                return None
    except websocket.WebSocketTimeoutException:
        print(f"[WS] Register timeout ({timeout}s)")
        return None
    except Exception as e:
        print(f"[WS] Register error: {e}")
        return None
    finally:
        ws.settimeout(60)


def send_camera_stream(ws, room_id, frame):
    small = cv2.resize(frame, (480, 270))
    payload = {
        "type": "CAMERA_STREAM",
        "room_id": room_id,
        "image_base64": encode_frame_base64(small, quality=40),
    }
    ws.send(json.dumps(payload))


def send_fall_alert(ws, room_id, frame):
    payload = {
        "type": "FALL_DETECTED",
        "room_id": room_id,
        "severity": "critical",
        "title": "PHAT HIEN TE NGA",
        "description": f"Demo: Phat hien nguoi nga tai phong {room_id}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "blurred_image_base64": encode_frame_base64(frame, quality=60),
    }
    ws.send(json.dumps(payload))


def ws_demo_worker(room_id, prefix, ws_url, frame_queue):
    """Thread worker: ket noi WS, gui frame tu queue."""
    ws = None
    while True:
        try:
            if ws is None:
                ws = connect_ws(ws_url)
                assigned = register_room(ws, prefix)
                if assigned is None:
                    print(f"[WS-{room_id}] Fallback to direct room_id")
                    assigned = room_id
                room_id = assigned

            frame, is_falling = frame_queue.get(timeout=2)
            send_camera_stream(ws, room_id, frame)
            if is_falling:
                print(f"[DEMO] FALL alert sent: {room_id}")
                send_fall_alert(ws, room_id, frame)

        except queue.Empty:
            continue
        except (BrokenPipeError, ConnectionError, OSError) as e:
            print(f"[WS-{room_id}] Connection lost: {e}. Reconnecting...")
            ws = None
            time.sleep(2)
        except Exception as e:
            print(f"[WS-{room_id}] Error: {e}")
            ws = None
            time.sleep(2)
