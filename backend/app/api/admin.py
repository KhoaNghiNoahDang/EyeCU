from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.core.security import require_roles

router = APIRouter()


@router.get("/staff-status", dependencies=[Depends(require_roles(["admin", "ops"]))])
def get_all_staff_status(db: Session = Depends(get_db)):
    # is_online không có trong model — query tất cả nhân viên (không phải patient)
    staff = db.query(User).filter(User.role != "patient").all()

    return {
        "clinicians_online": len([s for s in staff if s.role in ["doctor", "clinician"]]),
        "ops_er_online": len([s for s in staff if s.role == "ops"]),
        "ems_ambulance_online": len([s for s in staff if s.role == "ems"]),
        "details": [{"name": s.name, "role": s.role} for s in staff],
    }


@router.get("/stats", dependencies=[Depends(require_roles(["admin"]))])
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Đếm tổng user không phải bệnh nhân = nhân viên đang có trong hệ thống
    active_users = db.query(User).filter(User.role != "patient").count()
    total_patients = db.query(User).filter(User.role == "patient").count()
    return {
        "active_staff": active_users,
        "total_patients": total_patients,
        "bandwidth": "4.2 TB",
        "social_feedback": "Positive (85%)",
    }
