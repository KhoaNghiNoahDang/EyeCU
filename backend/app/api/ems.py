from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Ambulance, Patient, Staff, PatientsQueue, LprLog
from app.core.security import require_roles
from app.api.ambient import ambient_manager

router = APIRouter()


@router.post("/lpr-webhook")
async def handle_lpr_webhook(plate_number: str, db: Session = Depends(get_db)):
    ambulance = (
        db.query(Ambulance).filter(Ambulance.plate_number == plate_number).first()
    )

    if ambulance:
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
                    "ambulance_id": str(ambulance.id),
                    "driver": ambulance.driver_name,
                },
            }
        )
        return {
            "status": "success",
            "message": "Barrier triggered",
            "ambulance_id": str(ambulance.id),
        }

    return {"status": "ignored", "message": "Unauthorized plate"}


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
