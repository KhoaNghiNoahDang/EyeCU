from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

class AmbientManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

ambient_manager = AmbientManager()

@router.websocket("/ws/live")
async def websocket_ambient_endpoint(websocket: WebSocket):
    await ambient_manager.connect(websocket)
    try:
        while True:
            # Chờ nhận event từ AI worker hoặc PWA
            data = await websocket.receive_json()
            # Broadcast lại cho các dashboard
            await ambient_manager.broadcast(data)
    except WebSocketDisconnect:
        ambient_manager.disconnect(websocket)

async def push_camera_alert(room_code: str, severity: str):
    await ambient_manager.broadcast({
        "type": "CAMERA_EVENT",
        "severity": severity, # "critical", "urgent", "stable"
        "room": room_code,
        "title": "CẢNH BÁO AI CAMERA"
    })
