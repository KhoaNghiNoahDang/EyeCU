import json
import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlmodel import Session as SQLModelSession
from app.db.database import get_db, engine
from app.db.models import Ambulance
from app.services.dataset_reader import get_mock_json, get_random_image_from_dataset

router = APIRouter()

<<<<<<< HEAD
=======
# Dictionary luu tru tam toa do xe: { ambulance_id: {"lat": float, "lng": float} }
ambulance_cache = {}

<<<<<<< HEAD
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5

=======
>>>>>>> fa318aac17709536b905938aaec6a80d5b5a185d
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
<<<<<<< HEAD
<<<<<<< HEAD

            amb = (
                db.query(Ambulance)
                .filter(Ambulance.id == gps_data.get("ambulance_id"))
                .first()
            )
            if amb:
                amb.current_lat = gps_data.get("lat")
                amb.current_lng = gps_data.get("lng")
                db.commit()

            # Broadcast tọa độ mới
            await manager.broadcast({"type": "GPS_UPDATE", "data": gps_data})
=======
            amb_id = gps_data.get("ambulance_id")

=======
            amb_id = gps_data.get('ambulance_id')
            
>>>>>>> fa318aac17709536b905938aaec6a80d5b5a185d
            if amb_id:
                # 1. Cap nhat vao Cache (RAM)
                ambulance_cache[amb_id] = {
                    "lat": gps_data.get('lat'),
                    "lng": gps_data.get('lng')
                }
                
                # 2. Broadcast toa do moi ngay lap tuc cho Frontend
<<<<<<< HEAD
                await manager.broadcast({"type": "GPS_UPDATE", "data": gps_data})
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
    except WebSocketDisconnect:
        manager.disconnect(websocket)


<<<<<<< HEAD
=======
# Background Task: Chay ngam, ghi du lieu tu Cache vao DB theo chu ky 15 giay
=======
                await manager.broadcast({
                    "type": "GPS_UPDATE",
                    "data": gps_data
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background Task - Chay ngam ghi du lieu tu Cache vao DB theo chu ky
>>>>>>> fa318aac17709536b905938aaec6a80d5b5a185d
async def background_db_updater():
    global ambulance_cache
    while True:
        await asyncio.sleep(15)  # Ghi file sau moi 15 giay
        
        if not ambulance_cache:
            continue
            
        # Su dung engine de tao Session moi
        with SQLModelSession(engine) as db:
            try:
                # Tranh race condition bang cach thay the doi tuong dict cache moi
                updates_to_process = ambulance_cache
                ambulance_cache = {}
                
                # Thực hiện Batch Update
                for amb_id, coords in updates_to_process.items():
                    db.query(Ambulance).filter(Ambulance.id == amb_id).update(
                        {"current_lat": coords["lat"], "current_lng": coords["lng"]}
                    )
                
                db.commit()
                print(f"Batch update thanh cong cho {len(updates_to_process)} xe.")
            except Exception as e:
                db.rollback()
                print(f"Loi batch update: {e}")
<<<<<<< HEAD


>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
=======
>>>>>>> fa318aac17709536b905938aaec6a80d5b5a185d
from app.services.vnpt_api import vnpt_client

@router.post("/lpr")
async def simulate_ambulance_gate(img_url: str = "dummy_image_hash_from_addFile"):
    vision_result = await vnpt_client.call_smartvision_detect_vehicle(img_url)
<<<<<<< HEAD

<<<<<<< HEAD
    # Bóc tách biển số từ JSON trả về của VNPT
=======
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
=======
    
>>>>>>> fa318aac17709536b905938aaec6a80d5b5a185d
    plate = "51A-999.11"
    if "object" in vision_result and "license_plate" in vision_result["object"]:
        plate = vision_result["object"]["license_plate"]
        
    return {"status": "Arrived", "plate": plate, "raw_data": vision_result}