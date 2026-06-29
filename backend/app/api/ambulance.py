import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Ambulance
from app.services.dataset_reader import get_mock_json, get_random_image_from_dataset

router = APIRouter()

class ConnectionManager:
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

manager = ConnectionManager()

@router.websocket("/ws/gps")
async def websocket_gps_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            gps_data = json.loads(data)
            
            amb = db.query(Ambulance).filter(Ambulance.id == gps_data.get('ambulance_id')).first()
            if amb:
                amb.current_lat = gps_data.get('lat')
                amb.current_lng = gps_data.get('lng')
                db.commit()
            
            # Broadcast tọa độ mới
            await manager.broadcast({
                "type": "GPS_UPDATE",
                "data": gps_data
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from app.services.vnpt_api import vnpt_client

@router.post("/lpr")
async def simulate_ambulance_gate(img_url: str = "dummy_image_hash_from_addFile"):
    # GỌI VNPT SMARTVISION LPR THẬT qua httpx
    # (Đầu vào img_url phải là hash trả về từ api /addFile của VNPT)
    vision_result = await vnpt_client.call_smartvision_detect_vehicle(img_url)
    
    # Bóc tách biển số từ JSON trả về của VNPT
    plate = "51A-999.11"
    if "object" in vision_result and "license_plate" in vision_result["object"]:
        plate = vision_result["object"]["license_plate"]
        
    return {"status": "Arrived", "plate": plate, "raw_data": vision_result}
