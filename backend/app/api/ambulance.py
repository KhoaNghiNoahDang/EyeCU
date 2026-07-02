import json
import asyncio
import base64
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlmodel import Session as SQLModelSession
from app.db.database import get_db, engine
from app.db.models import Ambulance, LprLog, EmsMission
from app.services.dataset_reader import get_mock_json, get_random_image_from_dataset
from app.services.vnpt_api import vnpt_client
from app.api.ambient import ambient_manager

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


# ── Endpoint cũ: nhận URL/hash ảnh từ camera AI ──────────────────────────
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


# ── Endpoint mới: Nhận ảnh upload từ camera điện thoại/webcam ────────────
@router.post("/lpr/camera")
async def lpr_from_camera(
    image: UploadFile = File(...),
    hospital_id: str = Form(default=""),
    camera_id: str = Form(default="cam_mobile_gate"),
    plate_hint: str = Form(default=""),  # Demo mode: truyền biển số trực tiếp để bypass VNPT
    db: Session = Depends(get_db),
):
    """
    Nhận ảnh biển số chụp từ camera điện thoại/webcam.
    Hỗ trợ 3 chế độ:
    - plate_hint != "" : Demo mode - bypass VNPT, dùng biển số được cung cấp trực tiếp
    - VNPT thành công : Dùng kết quả SmartVision
    - VNPT thất bại  : Thử đọc biển số từ tên file ảnh (vd: '51F-123.45.jpg')
    """
    try:
        def normalize_plate(p: str) -> str:
            return p.upper().replace(" ", "").replace("-", "").replace(".", "")

        def extract_plate_from_filename(filename: str) -> str | None:
            """Thử đọc biển số từ tên file. VD: '51F-123.45.jpg' -> '51F-12345'"""
            import re
            import os
            name = os.path.splitext(filename or "")[0]
            # Nhận dạng mẫu biển số VN: 2 số + chữ cái + dấu gạch ngang + số
            match = re.search(r'(\d{2}[A-Za-z]\d?[-\s.]?\d{3,4}[.\-]?\d{0,2})', name)
            if match:
                return match.group(1)
            return None

        plate: str | None = None
        all_detected_plates: list[str] = []  # Tất cả biển số đọc được từ ảnh
        vision_result: dict = {}

        # ── Chế độ 1: Demo mode - plate_hint được cung cấp trực tiếp ─────
        if plate_hint.strip():
            plate = plate_hint.strip()
            all_detected_plates = [plate]
            vision_result = {"plate": plate, "plates": [plate], "mode": "demo_hint", "raw": {}}

        else:
            # ── Chế độ 2: Gọi VNPT SmartVision ──────────────────────────
            image_bytes = await image.read()
            filename = image.filename or "lpr_gate.jpg"

            img_hash = await vnpt_client.upload_file(image_bytes, filename)
            if img_hash:
                cdn_url = await vnpt_client.get_cdn_url(img_hash)
                if cdn_url:
                    vision_result = await vnpt_client.call_smartvision_detect_vehicle(cdn_url)
                    # Lấy TẤT CẢ biển số đọc được (danh sách mới)
                    all_detected_plates = vision_result.get("plates", [])
                    # Backward compat: nếu không có "plates", dùng "plate" đơn lẻ
                    if not all_detected_plates:
                        best = vision_result.get("plate", "")
                        if best and best not in ("Không rõ", "không rõ", ""):
                            all_detected_plates = [best]
                    # plate = biển tốt nhất (để hiển thị)
                    if all_detected_plates:
                        plate = all_detected_plates[0]

            # ── Chế độ 3: VNPT lỗi → thử đọc biển số từ tên file ────────
            if not all_detected_plates:
                plate_from_file = extract_plate_from_filename(image.filename or "")
                if plate_from_file:
                    plate = plate_from_file
                    all_detected_plates = [plate_from_file]
                    vision_result = {
                        "plate": plate,
                        "plates": [plate],
                        "mode": "filename_fallback",
                        "raw": vision_result,
                    }

        if not all_detected_plates:
            return {
                "matched": False,
                "plate": None,
                "plates": [],
                "open_gate": False,
                "error": "Không đọc được biển số. Hãy thử ảnh rõ hơn hoặc dùng chế độ demo.",
                "raw": vision_result,
            }

        import difflib

        # ── So sánh TẤT CẢ biển số trong ảnh với EmsMission đang active ───
        normalized_all = [normalize_plate(p) for p in all_detected_plates]
        query = db.query(EmsMission).filter(EmsMission.status == "active")
        if hospital_id:
            query = query.filter(EmsMission.hospital_id == hospital_id)
        active_missions = query.all()

        matched_mission = None
        matched_plate = None  # biển số nào trong ảnh khớp với cấp cứu
        for mission in active_missions:
            if mission.plate_number:
                norm_mission = normalize_plate(mission.plate_number)
                for i, norm_scan in enumerate(normalized_all):
                    is_match = False
                    # Khớp chính xác hoặc chuỗi con (VD: 29A02116 nằm trong 29A021168)
                    if norm_mission == norm_scan or norm_mission in norm_scan or norm_scan in norm_mission:
                        is_match = True
                    else:
                        # Khớp tương đối, cho phép sai lệch nhỏ (OCR lỗi 1 kí tự)
                        ratio = difflib.SequenceMatcher(None, norm_mission, norm_scan).ratio()
                        if ratio >= 0.85:
                            is_match = True

                    if is_match:
                        matched_mission = mission
                        matched_plate = all_detected_plates[i]
                        break
            if matched_mission:
                break

        open_gate = matched_mission is not None

        # ── Ghi log + Broadcast nếu khớp ─────────────────────────────────
        if open_gate:
            # camera_id từ frontend là string, không phải UUID → set None
            lpr_log = LprLog(
                camera_id=None,
                plate_number=matched_plate or plate,  # biển số khớp cấp cứu
                confidence=99,
            )
            db.add(lpr_log)
            matched_mission.status = "arrived"
            db.commit()

            await ambient_manager.broadcast({
                "type": "GATE_OPEN",
                "data": {
                    "plate": matched_plate or plate,
                    "hospital_id": matched_mission.hospital_id,
                    "mission_id": str(matched_mission.id),
                    "camera_id": camera_id,
                },
            })

        return {
            "matched": open_gate,
            "plate": matched_plate if open_gate else plate,  # ưu tiên biển khớp
            "plates": all_detected_plates,                    # TẤT CẢ biển số trong ảnh
            "open_gate": open_gate,
            "raw": vision_result,
        }


    except Exception as exc:
        # Đảm bảo luôn trả về JSON — tránh "Failed to fetch" ở browser
        return {
            "matched": False,
            "plate": None,
            "open_gate": False,
            "error": f"Lỗi server: {str(exc)}",
        }

