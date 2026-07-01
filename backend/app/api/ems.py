from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, EmsMission, RoomInfrastructure
from app.core.security import require_roles
from app.api.ambient import ambient_manager

router = APIRouter()


@router.get(
    "/{ambulance_id}/dashboard",
    dependencies=[Depends(require_roles(["ems", "ops", "admin"]))],
)
def get_ems_dashboard(ambulance_id: str, db: Session = Depends(get_db)):
    mission = db.query(EmsMission).filter_by(ambulance_id=ambulance_id).first()
    team_info = []
    if mission and mission.assigned_staff_ids:
        team_info = db.query(User).filter(User.id.in_(mission.assigned_staff_ids)).all()

    infra = db.query(RoomInfrastructure).filter_by(department_id="ER").first()

    return {
        "team": [{"name": u.name, "role": u.role} for u in team_info],
        "infra": {
            "ventilator": infra.ventilator_status if infra else "Unknown",
            "defibrillator": infra.defibrillator_status if infra else "Unknown",
        },
    }


@router.post("/pre-alert", dependencies=[Depends(require_roles(["ems"]))])
async def send_pre_alert(alert_type: str, ambulance_id: str):
    await ambient_manager.broadcast(
        {
            "type": "PRE_ALERT",
            "ambulance": ambulance_id,
            "condition": alert_type,
            "severity": "critical",
        }
    )
    return {"status": "alert_sent_to_hospital"}
