import os
from dotenv import load_dotenv

load_dotenv()

ROOM_PREFIX = os.getenv("ROOM_PREFIX", "P.10")
ROOM_ID_FALLBACK = os.getenv("ROOM_ID", "P.101")
WS_BACKEND_URL = os.getenv("WS_BACKEND_URL", "wss://eyecu.onrender.com/api/ambient/ws/live")
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "0")
FALL_COOLDOWN_SECONDS = int(os.getenv("FALL_COOLDOWN_SECONDS", "10"))
