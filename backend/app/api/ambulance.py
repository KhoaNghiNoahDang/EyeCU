import json
import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlmodel import Session as SQLModelSession
from app.db.database import get_db, engine
from app.db.models import Ambulance
from app.services.dataset_reader import get_mock_json, get_random_image_from_dataset

router = APIRouter()

# Dictionary luu tru tam toa do xe: { ambulance_id: {"lat": float, "lng": float} }
ambulance_cache = {}


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
            amb_id = gps_data.get("ambulance_id")

            if amb_id:
                # 1. Cap nhat vao Cache (RAM) - Cuc nhanh, khong dong cham DB
                ambulance_cache[amb_id] = {
                    "lat": gps_data.get("lat"),
                    "lng": gps_data.get("lng"),
                }

                # 2. Broadcast toa do moi ngay lap tuc cho Frontend
                await manager.broadcast({"type": "GPS_UPDATE", "data": gps_data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Background Task: Chay ngam, ghi du lieu tu Cache vao DB theo chu ky 15 giay
async def background_db_updater():
    global ambulance_cache
    while True:
        await asyncio.sleep(15)

        if not ambulance_cache:
            continue

        # Su dung Session(engine) thay vi SessionLocal (khong ton tai trong du an nay)
        with SQLModelSession(engine) as db:
            try:
                # Thay the reference de tranh race condition:
                # Viec ghi cache moi tu WebSocket tiep tuc sang dict moi,
                # trong khi ta xu ly dict cu duoi day
                updates_to_process = ambulance_cache
                ambulance_cache = {}

                # Batch Update: Ghi ca lo du lieu chi voi 1 lan commit duy nhat
                for amb_id, coords in updates_to_process.items():
                    db.query(Ambulance).filter(Ambulance.id == amb_id).update(
                        {"last_lat": coords["lat"], "last_lng": coords["lng"]}
                    )

                db.commit()
                print(f"Batch update thanh cong cho {len(updates_to_process)} xe.")
            except Exception as e:
                db.rollback()
                print(f"Loi batch update: {e}")


from app.services.vnpt_api import vnpt_client


@router.post("/lpr")
async def simulate_ambulance_gate(img_url: str = "dummy_image_hash_from_addFile"):
    # Goi VNPT SMARTVISION LPR that qua httpx
    vision_result = await vnpt_client.call_smartvision_detect_vehicle(img_url)

    plate = "51A-999.11"
    if "object" in vision_result and "license_plate" in vision_result["object"]:
        plate = vision_result["object"]["license_plate"]

    return {"status": "Arrived", "plate": plate, "raw_data": vision_result}