import json
import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlmodel import Session as SQLModelSession
from app.db.database import get_db, engine
from app.db.models import Ambulance
from app.services.dataset_reader import get_mock_json, get_random_image_from_dataset

router = APIRouter()

# Dictionary luu tru tam toa do xe: { ambulance_id: {lat, lng} }
ambulance_cache = {}


@router.get("/")
def get_ambulances(db: Session = Depends(get_db)):
    ambulances = db.query(Ambulance).all()
    result = []
    for amb in ambulances:
        result.append(
            {
                "id": str(amb.id),
                "plate": amb.plate_number,
                "status": amb.status,
                "driver": amb.driver_name,
                "lat": amb.last_lat,
                "lng": amb.last_lng,
            }
        )
    return result


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
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
                # 1. Cap nhat vao Cache (RAM)
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

        with SQLModelSession(engine) as db:
            try:
                updates_to_process = ambulance_cache
                ambulance_cache = {}

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


from app.api.ambient import ambient_manager
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Ambulance, LprLog

@router.post("/lpr")
async def simulate_ambulance_gate(
    img_url: str = "dummy_image_hash_from_addFile",
    db: Session = Depends(get_db)
):
    vision_result = await vnpt_client.call_smartvision_detect_vehicle(img_url)

    plate = "51A-999.11"
    if "object" in vision_result and "license_plate" in vision_result["object"]:
        plate = vision_result["object"]["license_plate"]

    ambulance = db.query(Ambulance).filter(Ambulance.plate_number == plate).first()
    
    if ambulance:
        lpr_log = LprLog(
            camera_id="cam_gate_01",
            plate_number=plate,
        )
        db.add(lpr_log)
        db.commit()

        await ambient_manager.broadcast({
            "type": "GATE_ARRIVED",
            "data": {
                "plate": plate,
                "ambulance_id": str(ambulance.id),
                "driver": ambulance.driver_name,
            }
        })

    return {"status": "Arrived", "plate": plate, "matched": bool(ambulance), "raw_data": vision_result}
