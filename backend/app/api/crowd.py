from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

router = APIRouter()

class CrowdConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.latest_telemetry: Dict = {"count": 0, "alert": False}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send latest state immediately upon connection
        await websocket.send_json(self.latest_telemetry)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        self.latest_telemetry = data
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except:
                pass

manager = CrowdConnectionManager()

@router.websocket("/ws/live")
async def websocket_crowd_endpoint(websocket: WebSocket):
    """
    Endpoint for both the Edge AI (to send telemetry) 
    and the Frontend Dashboard (to receive telemetry).
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "CROWD_TELEMETRY":
                # Broadcast the telemetry to all connected clients (e.g. Frontend)
                payload = {
                    "camera_id": data.get("camera_id", "cam_default"),
                    "camera_name": data.get("camera_name", "Camera"),
                    "count": data.get("count", 0),
                    "alert": data.get("alert", False)
                }
                if "image_base64" in data:
                    payload["image_base64"] = data["image_base64"]
                await manager.broadcast(payload)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/status")
def get_crowd_status():
    """Fallback REST API to get latest crowd telemetry"""
    return manager.latest_telemetry
