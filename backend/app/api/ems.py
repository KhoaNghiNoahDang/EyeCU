from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Ambulance, Patient, Staff, PatientsQueue, LprLog, EmsMission
from app.core.security import require_roles
from app.api.ambient import ambient_manager

router = APIRouter()


from pydantic import BaseModel

class StartMissionRequest(BaseModel):
    plate_number: str
    hospital_id: str

@router.post("/start-mission")
async def start_mission(req: StartMissionRequest, db: Session = Depends(get_db)):
    # Có thể deactive các mission cũ của xe này
    old_missions = db.query(EmsMission).filter(EmsMission.plate_number == req.plate_number, EmsMission.status == "active").all()
    for m in old_missions:
        m.status = "completed"
    
    new_mission = EmsMission(
        plate_number=req.plate_number,
        hospital_id=req.hospital_id,
        status="active"
    )
    db.add(new_mission)
    db.commit()
    db.refresh(new_mission)
    
    return {"status": "success", "mission_id": str(new_mission.id)}

class LprWebhookRequest(BaseModel):
    plate_number: str

@router.post("/lpr-webhook")
async def handle_lpr_webhook(req: LprWebhookRequest, db: Session = Depends(get_db)):
    plate_number = req.plate_number
    active_mission = (
        db.query(EmsMission).filter(
            EmsMission.plate_number == plate_number, 
            EmsMission.status == "active"
        ).first()
    )

    if active_mission:
        active_mission.status = "arrived"
        
        lpr_log = LprLog(
            camera_id=None,
            plate_number=plate_number,
        )
        db.add(lpr_log)
        db.commit()

        await ambient_manager.broadcast(
            {
                "type": "GATE_ARRIVED",
                "data": {
                    "plate": plate_number,
                    "mission_id": str(active_mission.id),
                    "hospital_id": active_mission.hospital_id,
                },
            }
        )
        return {
            "status": "success",
            "message": "Barrier triggered",
            "mission_id": str(active_mission.id),
        }

    return {"status": "ignored", "message": "No active mission for this plate"}


@router.get("/missions/active")
def get_active_missions(hospital_id: str = "", db: Session = Depends(get_db)):
    """Lấy danh sách EmsMission đang active — hiển thị hàng đợi xe cấp cứu tại cổng."""
    query = db.query(EmsMission).filter(EmsMission.status == "active")
    if hospital_id:
        query = query.filter(EmsMission.hospital_id == hospital_id)
    missions = query.order_by(EmsMission.created_at.asc()).all()
    return [
        {
            "id": str(m.id),
            "plate_number": m.plate_number,
            "hospital_id": m.hospital_id,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in missions
    ]


@router.post("/fast-track", dependencies=[Depends(require_roles(["ems", "admin"]))])
async def fast_track_admission(
    cccd: str, ambulance_id: str, db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.cccd == cccd).first()

    patient_data = {
        "name": patient.name if patient else "Benh nhan moi",
        "cccd": cccd,
        "ambulance_id": ambulance_id,
        "bhxh_code": patient.bhxh_code if patient else None,
        "priority": "critical",
        "eta": "10 phut",
    }

    await ambient_manager.broadcast(
        {
            "type": "FAST_TRACK_SYNC",
            "data": patient_data,
        }
    )

    return {"status": "synced", "data": patient_data}


@router.post("/pre-alert", dependencies=[Depends(require_roles(["ems"]))])
async def trigger_pre_alert(ambulance_id: str, condition: str, eta_minutes: int):
    await ambient_manager.broadcast(
        {
            "type": "PRE_ALERT",
            "data": {
                "ambulance_id": ambulance_id,
                "condition": condition,
                "eta": eta_minutes,
                "severity": "critical",
            },
        }
    )

    return {"status": "alert_sent"}


@router.get(
    "/{ambulance_id}/dashboard",
    dependencies=[Depends(require_roles(["ems", "ops", "admin"]))],
)
def get_ems_dashboard(ambulance_id: str, db: Session = Depends(get_db)):
    ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not ambulance:
        raise HTTPException(status_code=404, detail="Khong tim thay xe cuu thuong")

    return {
        "ambulance": {
            "plate": ambulance.plate_number,
            "driver": ambulance.driver_name,
            "status": ambulance.status,
            "last_lat": ambulance.last_lat,
            "last_lng": ambulance.last_lng,
        }
    }

from sqlalchemy import text
import time

@router.get("/dispatch_records")
async def get_dispatch_records(status: str = "active", db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT * FROM dispatch_records WHERE status = :status"), {"status": status}).fetchall()
        return [dict(r._mapping) for r in result]
    except Exception as e:
        print(f"Error fetching dispatch_records: {e}")
        return []

@router.put("/dispatch_records/{plate}/complete")
async def complete_dispatch_record(plate: str, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("UPDATE dispatch_records SET status = 'completed', completed_at = :now WHERE plate = :plate"),
            {"now": int(time.time()*1000), "plate": plate}
        )
        db.commit()
        # notify sockets
        from app.api.ambient import ambient_manager
        import asyncio
        asyncio.create_task(ambient_manager.broadcast({"type": "dispatch_update", "plate": plate, "status": "completed"}))
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Request

@router.post("/dispatch_records/upsert")
async def upsert_dispatch_record(req: Request, db: Session = Depends(get_db)):
    data = await req.json()
    try:
        # Check if exists
        plate = data.get("plate")
        if not plate: return {"status": "error"}
        existing = db.execute(text("SELECT plate FROM dispatch_records WHERE plate = :plate"), {"plate": plate}).fetchone()
        
        # Build query
        keys = list(data.keys())
        if existing:
            set_clause = ", ".join([f"{k} = :{k}" for k in keys if k != "plate"])
            if set_clause:
                db.execute(text(f"UPDATE dispatch_records SET {set_clause} WHERE plate = :plate"), data)
        else:
            cols = ", ".join(keys)
            vals = ", ".join([f":{k}" for k in keys])
            db.execute(text(f"INSERT INTO dispatch_records ({cols}) VALUES ({vals})"), data)
            
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print("Upsert error:", e)
        return {"status": "error", "message": str(e)}

@router.put("/dispatch_records/{plate}")
async def update_dispatch_record(plate: str, req: Request, db: Session = Depends(get_db)):
    data = await req.json()
    try:
        keys = list(data.keys())
        set_clause = ", ".join([f"{k} = :{k}" for k in keys])
        if set_clause:
            data["_plate"] = plate
            db.execute(text(f"UPDATE dispatch_records SET {set_clause} WHERE plate = :_plate"), data)
            db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print("Update error:", e)
        return {"status": "error", "message": str(e)}
