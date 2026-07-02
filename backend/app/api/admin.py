from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.db.models import (
    Staff,
    Patient,
    Department,
    Device,
    Ambulance,
    PatientsQueue,
    SystemLog,
    LprLog,
    ClinicalRecord,
)
from app.core.security import require_roles

router = APIRouter()
#

@router.get("/staff-status", dependencies=[Depends(require_roles(["admin", "ops"]))])
def get_all_staff_status(db: Session = Depends(get_db)):
    # is_online không có trong model — query tất cả nhân viên
    staff = db.query(Staff).all()

    return {
        "clinicians_online": len(
            [s for s in staff if s.role in ["doctor", "clinician"]]
        ),
        "ops_er_online": len([s for s in staff if s.role == "ops"]),
        "ems_ambulance_online": len([s for s in staff if s.role == "ems"]),
        "details": [{"name": s.name, "role": s.role} for s in staff],
    }


@router.get("/stats", dependencies=[Depends(require_roles(["admin"]))])
def get_dashboard_stats(db: Session = Depends(get_db)):
    active_users = db.query(Staff).count()
    depts = db.query(Department).count()
    devices = db.query(Device).count()
    devices_online = db.query(Device).filter(Device.status == "active").count()
    ambulances = db.query(Ambulance).count()
    amb_dispatched = (
        db.query(Ambulance).filter(Ambulance.status == "dispatched").count()
    )
    amb_returning = db.query(Ambulance).filter(Ambulance.status == "returning").count()
    queue = db.query(PatientsQueue).count()
    q_waiting = (
        db.query(PatientsQueue).filter(PatientsQueue.status == "waiting").count()
    )
    q_treatment = (
        db.query(PatientsQueue).filter(PatientsQueue.status == "in_treatment").count()
    )
    sys_logs = db.query(SystemLog).filter(SystemLog.is_alert == True).count()
    lpr_logs = db.query(LprLog).count()
    records = db.query(ClinicalRecord).count()

    return [
        {
            "label": "Users",
            "value": str(active_users),
            "sub": "admin · clinician · ops · ems",
            "color": "#0A9BAD",
        },
        {
            "label": "Departments",
            "value": str(depts),
            "sub": "Khoa phòng hoạt động",
            "color": "#7C3AED",
        },
        {
            "label": "Devices (IoT)",
            "value": str(devices),
            "sub": f"{devices_online} online · {devices - devices_online} offline",
            "color": "#2563EB",
        },
        {
            "label": "Ambulances",
            "value": str(ambulances),
            "sub": f"{amb_dispatched} dispatched · {amb_returning} returning",
            "color": "#EA580C",
        },
        {
            "label": "Patients Queue",
            "value": str(queue),
            "sub": f"{q_waiting} waiting · {q_treatment} in_treatment",
            "color": "#DC2626",
        },
        {
            "label": "System Logs",
            "value": str(sys_logs),
            "sub": "Cảnh báo chưa xử lý",
            "color": "#DC2626",
        },
        {
            "label": "LPR Logs",
            "value": str(lpr_logs),
            "sub": "Lượt quét biển số",
            "color": "#D97706",
        },
        {
            "label": "Medical Books",
            "value": str(records),
            "sub": "Hồ sơ bệnh án",
            "color": "#16A34A",
        },
        {
            "label": "WebAuthn Creds",
            "value": "0",
            "sub": "Passkeys đã đăng ký",
            "color": "#0891B2",
        },
    ]

from pydantic import BaseModel
from typing import Optional

class StaffCreate(BaseModel):
    name: str
    role: str
    cccd: str
    employee_id: str
    department_id: Optional[str] = None
    password: str

@router.post("/staffs", dependencies=[Depends(require_roles(["admin"]))])
def create_staff(data: StaffCreate, db: Session = Depends(get_db)):
    import uuid

    # Validate dept if given
    dept_id = None
    if data.department_id:
        try:
            # check if department_id is a valid UUID
            uuid.UUID(data.department_id)
            dept = db.query(Department).filter(Department.id == data.department_id).first()
            if dept:
                dept_id = dept.id
        except ValueError:
            pass

    new_staff = Staff(
        name=data.name,
        role=data.role,
        cccd=data.cccd,
        employee_id=data.employee_id,
        password_hash=data.password,
        department_id=dept_id
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return {"status": "success", "id": str(new_staff.id)}


@router.get("/tables/{table_name}", dependencies=[Depends(require_roles(["admin"]))])
def get_table_data(table_name: str, db: Session = Depends(get_db)):
    # Validate table name to prevent SQL injection
    allowed_tables = [
        "patients",
        "staffs",
        "departments",
        "ambulances",
        "devices",
        "patients_queue",
        "clinical_records",
        "medications",
        "vital_signs",
        "smart_reader_docs",
        "follow_ups",
        "hospital_fees",
        "hospital_fee_items",
        "system_logs",
        "lpr_logs",
        "incidents",
        "encounters",
        "shifts",
    ]
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail="Invalid table name")

    query = text(f"SELECT * FROM {table_name}")
    result = db.execute(query)
    columns = result.keys()

    data = []
    for row in result:
        row_dict = {}
        for idx, col in enumerate(columns):
            val = row[idx]
            # Convert UUID or datetime to string for JSON serialization
            if val is not None:
                row_dict[col] = str(val)
            else:
                row_dict[col] = None
        data.append(row_dict)

    return data
