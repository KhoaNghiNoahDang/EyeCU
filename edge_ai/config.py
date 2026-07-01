import os
from dotenv import load_dotenv

load_dotenv()

ROOM_ID = os.getenv("ROOM_ID", "P.101")
WS_BACKEND_URL = os.getenv("WS_BACKEND_URL", "ws://localhost:8000/api/ambient/ws/live")
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "0")
FALL_COOLDOWN_SECONDS = int(os.getenv("FALL_COOLDOWN_SECONDS", "10"))
