import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db, engine
from app.db.models import Incident, SystemLog
import time

router = APIRouter()


<<<<<<< HEAD
class AmbientManager:
=======
class ConnectionManager:
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
    def __init__(self):
        # Danh sach cac ket noi WebSocket dang mo
        self.active_connections: List[WebSocket] = []

        # Interface san sang cho Redis:
        # Khi scale len nhieu server, chi can doi use_redis = True
        # va viet logic redis.publish thay the broadcast ben duoi
        self.use_redis = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Bat task Ping/Pong rieng cho tung socket ngay khi connect
        asyncio.create_task(self.keep_alive(websocket))

    def disconnect(self, websocket: WebSocket):
        # Kiem tra truoc khi remove de tranh ValueError neu socket da bi xoa
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def keep_alive(self, websocket: WebSocket):
        """
        Co che Ping/Pong moi 20 giay.
        Ngan Render/Nginx tu dong cat ket noi idle sau 30 giay.
        """
        try:
            while websocket in self.active_connections:
                await websocket.send_json({"type": "ping"})
                await asyncio.sleep(20)
        except Exception:
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """
        Pub/Sub Interface:
        - use_redis = False (hien tai): In-memory broadcast
        - use_redis = True (sau nay): Redis publish len eyecu_channel
        """
        if self.use_redis:
            # TODO: redis.publish("eyecu_channel", json.dumps(message))
            pass
        else:
            if not self.active_connections:
                return

            # Thu thap cac ket noi bi loi trong luc broadcast (mat song, ve dien...)
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            # Don dep cac ket noi da chet de tranh memory leak
            for conn in disconnected:
                self.disconnect(conn)


# Khoi tao Global Manager - dung chung cho ca he thong
ambient_manager = ConnectionManager()

<<<<<<< HEAD

ambient_manager = AmbientManager()
=======
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5


@router.websocket("/ws/live")
async def websocket_ambient_endpoint(websocket: WebSocket):
    await ambient_manager.connect(websocket)
    try:
        while True:
            # Cho nhan event tu AI worker hoac PWA
            data = await websocket.receive_json()
            # Broadcast lai cho cac dashboard
            await ambient_manager.broadcast(data)
    except WebSocketDisconnect:
        ambient_manager.disconnect(websocket)


async def push_camera_alert(room_code: str, severity: str):
    await ambient_manager.broadcast(
        {
            "type": "CAMERA_EVENT",
            "severity": severity,  # "critical", "urgent", "stable"
            "room": room_code,
<<<<<<< HEAD
            "title": "CẢNH BÁO AI CAMERA",
        }
    )
=======
            "title": "CANH BAO AI CAMERA",
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
    Webhook / API cho cac thiet bi AI Camera ben ngoai goi vao de kich hoat bao dong (Fall Alert).
    1. Ghi log vao database (bang incidents)
    2. Broadcast canh bao realtime qua WebSocket den toan vien
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

    # Ban canh bao realtime qua WebSocket (OpsDashboardView / EmsView)
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
# GIAI PHAP THROTTLING / BATCH UPDATE LOG
# ==========================================
system_log_buffer = []


def enqueue_system_log(log_type: str, description: str, device_id=None):
    """
    Day log vao buffer thay vi ghi DB ngay lap tuc.
    Giai quyet bai toan Throttling khi co qua nhieu request (VD: OCR, eKYC)
    """
    system_log_buffer.append(
        {
            "log_type": log_type,
            "description": description,
            "device_id": device_id,
            "timestamp": time.time(),
        }
    )


async def background_log_flusher():
    """
    Background Task: Flush buffer vao DB moi 10 giay.
    Su dung Session doc lap de dam bao an toan thread.
    """
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
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
