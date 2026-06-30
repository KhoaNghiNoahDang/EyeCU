from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.core.security import require_roles

router = APIRouter()


@router.get("/staff-status", dependencies=[Depends(require_roles(["admin", "ops"]))])
def get_all_staff_status(db: Session = Depends(get_db)):
    staff = db.query(User).filter(User.is_online == True).all()

    return {
        "clinicians_online": len([s for s in staff if s.role == "clinician"]),
        "ops_er_online": len([s for s in staff if s.role == "ops"]),
        "ems_ambulance_online": len([s for s in staff if s.role == "ems"]),
        "details": [{"name": s.name, "role": s.role} for s in staff],
    }


@router.get("/stats", dependencies=[Depends(require_roles(["admin"]))])
def get_dashboard_stats(db: Session = Depends(get_db)):
    active_users = db.query(User).filter(User.is_online == True).count()
    return {
        "active_users": active_users,
        "bandwidth": "4.2 TB",
        "social_feedback": "Positive (85%)",
    }
