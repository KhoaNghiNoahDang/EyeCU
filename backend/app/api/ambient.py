import asyncio
import sys
import subprocess
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db, engine
from app.db.models import Incident, SystemLog
import time
#
router = APIRouter()


@router.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    from app.db.models import Device

    devices = db.query(Device).all()
    result = []
    for d in devices:
        result.append(
            {
                "id": str(d.id),
                "name": d.name,
                "type": d.device_type,
                "location": d.location,
                "status": d.status,
            }
        )
    return result


@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(10).all()
    result = []
    for inc in incidents:
        result.append(
            {
                "id": str(inc.id),
                "room": inc.room_code,
                "severity": inc.severity,
                "description": inc.description,
                "status": inc.status,
                "time": inc.created_at.isoformat(),
            }
        )
    return result


class ConnectionManager:
    def __init__(self):
        # Danh sach cac ket noi WebSocket dang mo
        self.active_connections: List[WebSocket] = []
        self.use_redis = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        asyncio.create_task(self.keep_alive(websocket))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def keep_alive(self, websocket: WebSocket):
        """Ping/Pong moi 20 giay de ngan Render/Nginx cat ket noi idle."""
        try:
            while websocket in self.active_connections:
                await websocket.send_json({"type": "ping"})
                await asyncio.sleep(20)
        except Exception:
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """In-memory broadcast den tat ca dashboard dang mo."""
        if not self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


# Khoi tao Global Manager - dung chung cho ca he thong
ambient_manager = ConnectionManager()


@router.websocket("/ws/live")
async def websocket_ambient_endpoint(websocket: WebSocket):
    await ambient_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "FALL_DETECTED":
                try:
                    with Session(engine) as session:
                        incident = Incident(
                            room_code=data.get("room_id", "Unknown"),
                            severity=data.get("severity", "critical"),
                            description=data.get("description", "AI Camera: Phat hien te nga"),
                            status="pending",
                        )
                        session.add(incident)
                        session.commit()
                except Exception as e:
                    print(f"[Ambient WS] Error saving incident to DB: {e}")

            await ambient_manager.broadcast(data)
    except WebSocketDisconnect:
        ambient_manager.disconnect(websocket)
    except Exception as e:
        print(f"[Ambient WS] Unexpected error: {e}")
        ambient_manager.disconnect(websocket)


async def push_camera_alert(room_code: str, severity: str):
    await ambient_manager.broadcast(
        {
            "type": "CAMERA_EVENT",
            "severity": severity,
            "room": room_code,
            "title": "CẢNH BÁO AI CAMERA",
        }
    )


class IncidentPayload(BaseModel):
    room_code: str
    severity: str
    description: str


@router.post("/incident")
async def receive_incident_alert(
    payload: IncidentPayload, db: Session = Depends(get_db)
):
    """
    Webhook cho cac thiet bi AI Camera goi vao de kich hoat bao dong.
    1. Ghi log vao database (bang incidents)
    2. Broadcast canh bao realtime qua WebSocket
    """
    incident = Incident(
        room_code=payload.room_code,
        severity=payload.severity,
        description=payload.description,
        status="pending",
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    await ambient_manager.broadcast(
        {
            "type": "INCIDENT_ALERT",
            "data": {
                "id": str(incident.id),
                "room": incident.room_code,
                "severity": incident.severity,
                "description": incident.description,
                "title": "CẢNH BÁO AI CAMERA",
            },
        }
    )

    return {
        "status": "success",
        "message": "Alert processed and broadcasted",
        "incident_id": str(incident.id),
    }


# ==========================================
# THROTTLING / BATCH UPDATE LOG
# ==========================================
system_log_buffer = []


def enqueue_system_log(log_type: str, description: str, device_id=None):
    """Day log vao buffer thay vi ghi DB ngay lap tuc."""
    system_log_buffer.append(
        {
            "log_type": log_type,
            "description": description,
            "device_id": device_id,
            "timestamp": time.time(),
        }
    )


async def background_log_flusher():
    """Background Task: Flush buffer vao DB moi 10 giay."""
    global system_log_buffer
    while True:
        await asyncio.sleep(10)
        if not system_log_buffer:
            continue

        logs_to_process = system_log_buffer
        system_log_buffer = []

        with Session(engine) as db:
            try:
                db_logs = [
                    SystemLog(
                        log_type=item["log_type"],
                        description=item["description"],
                        device_id=item["device_id"],
                    )
                    for item in logs_to_process
                ]
                db.add_all(db_logs)
                db.commit()
                print(f"[Ambient] Batched {len(logs_to_process)} system logs to DB.")
            except Exception as e:
                db.rollback()
                print(f"[Ambient] Error flushing logs: {e}")

# ==========================================
# EDGE AI PROCESS MANAGEMENT
# ==========================================
edge_ai_process = None

def install_requirements(edge_ai_dir: str):
    req_file = os.path.join(edge_ai_dir, "requirements_edge.txt")
    if os.path.exists(req_file):
        print(f"[Ambient] Checking/installing edge AI requirements from {req_file}...")
        try:
            import cv2
            import mediapipe
            import websocket
            import sklearn
            import joblib
            print("[Ambient] All Edge AI modules already installed!")
        except ImportError:
            print("[Ambient] Missing Edge AI modules. Running pip install...")
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", req_file],
                check=True
            )

@router.post("/start-edge-ai")
def start_edge_ai():
    global edge_ai_process
    try:
        if edge_ai_process is not None and edge_ai_process.poll() is None:
            return {"status": "already_running"}
        
        edge_ai_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../edge_ai"))
        
        try:
            install_requirements(edge_ai_dir)
        except Exception as e:
            print(f"[Ambient] Failed to install requirements: {e}")
            return {"status": "error", "message": f"Failed to install requirements: {e}"}

        print(f"[Ambient] Starting main.py in {edge_ai_dir}...")
        env = os.environ.copy()
        env["ROOM_ID"] = "Unknown"
        
        # Determine correct python executable
        python_exe = sys.executable
        if "uvicorn" in python_exe or "gunicorn" in python_exe:
            python_exe = os.path.join(os.path.dirname(sys.executable), "python")
            if not os.path.exists(python_exe):
                python_exe = "python3"

        import platform
        if platform.system() == "Darwin" and env.get("CAMERA_SOURCE", "0") == "0":
            print("[Ambient] MacOS detected. Launching in Terminal to allow Camera access.")
            apple_script = f'''
            tell application "Terminal"
                activate
                do script "export ROOM_ID=Unknown && cd {edge_ai_dir} && {python_exe} main.py"
            end tell
            '''
            edge_ai_process = subprocess.Popen(["osascript", "-e", apple_script])
        else:
            log_file = open(os.path.join(edge_ai_dir, "edge_ai.log"), "w")
            edge_ai_process = subprocess.Popen(
                [python_exe, "-u", "main.py"],
                cwd=edge_ai_dir,
                env=env,
                stdout=log_file,
                stderr=subprocess.STDOUT
            )
        return {"status": "started", "executable": python_exe}
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        return {"status": "error", "message": str(e), "traceback": err_msg}

@router.post("/stop-edge-ai")
def stop_edge_ai():
    global edge_ai_process
    if edge_ai_process is not None and edge_ai_process.poll() is None:
        edge_ai_process.terminate()
        edge_ai_process.wait()
        edge_ai_process = None
        return {"status": "stopped"}
    return {"status": "not_running"}
