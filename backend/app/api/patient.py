from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import User, PatientsQueue
from app.core.security import require_roles, get_current_user
from app.api.ambient import ambient_manager
from app.services.vnpt_api import vnpt_client
from pydantic import BaseModel
import uuid

router = APIRouter()

class WalkinSchema(BaseModel):
    name: str
    cccd: str

class ChatRequest(BaseModel):
    message: str

@router.post("/verify-bhxh", dependencies=[Depends(require_roles(["ems", "ops"]))])
def verify_bhxh_fast_track(cccd: str, db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.cccd == cccd).first()
    return {
        "status": "success",
        "patient": {"name": patient.name, "age": 62, "gender": "Nam"} if patient else {"name": "Nguyễn Văn A (Mock)"},
        "sync_steps": {"bhxh": "Thành công", "medical_history": "Đồng bộ xong"}
    }

@router.post("/admit-walkin", dependencies=[Depends(require_roles(["ops", "admin"]))])
def admit_walkin(data: WalkinSchema, db: Session = Depends(get_db)):
    # Kiểm tra CCCD đã tồn tại chưa
    existing = db.query(User).filter(User.cccd == data.cccd).first()
    if existing:
        return {"status": "already_exists", "patient_id": str(existing.id), "role": existing.role}

    new_patient = User(role="patient", cccd=data.cccd, name=data.name)
    db.add(new_patient)
    db.commit()

    ticket = AdmissionQueue(patient_id=new_patient.id, status="waiting", priority="urgent")

    ticket = PatientsQueue(
        patient_id=new_patient.id, status="waiting"
    )
    db.add(ticket)
    db.commit()
    return {"status": "success", "ticket_id": str(ticket.id)}

from app.services.vnpt_api import vnpt_client

@router.post("/sos", dependencies=[Depends(require_roles(["patient"]))])
async def trigger_patient_sos(user: User = Depends(get_current_user)):
    await ambient_manager.broadcast({
        "type": "CAMERA_EVENT", 
        "severity": "critical",
        "title": f"BÁO ĐỘNG ĐỎ — SOS TỪ BỆNH NHÂN {user.name}"
    })
    return {"status": "SOS_SENT"}

class ChatRequest(BaseModel):
    message: str

@router.post("/chat", dependencies=[Depends(require_roles(["patient"]))])
async def patient_chatbot(data: ChatRequest):
    # GỌI VNPT SMARTBOT THẬT qua httpx
    bot_response = await vnpt_client.call_smartbot_conversation(data.message)
    
    reply = "Tôi chưa hiểu rõ câu hỏi, vui lòng thử lại."
    if "data" in bot_response and isinstance(bot_response["data"], list) and len(bot_response["data"]) > 0:
        reply = bot_response["data"][0].get("text", reply)
        
    return {"reply": reply, "raw_data": bot_response}

@router.get(
    "/my-profile",
    dependencies=[Depends(require_roles(["patient"]))]
)
def get_my_profile(
    user: User = Depends(get_current_user)
):
    return {
        "id": str(user.id),
        "name": user.name,
        "cccd": user.cccd,
        "bhxh_code": user.bhxh_code,
        "avatar_url": user.avatar_url,
        "emergency_contact_name": user.emergency_contact_name,
        "emergency_contact_phone": user.emergency_contact_phone
    }

@router.get(
    "/my-records",
    dependencies=[Depends(require_roles(["patient"]))]
)
def get_my_records(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ClinicalRecord)
        .filter(ClinicalRecord.patient_id == user.id)
        .all()
    )

    return {
        "records": records
    }

@router.get(
    "/my-medications",
    dependencies=[Depends(require_roles(["patient"]))]
)
def get_my_medications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Lấy tất cả hồ sơ khám
    records = (
        db.query(ClinicalRecord)
        .filter(ClinicalRecord.patient_id == user.id)
        .all()
    )

    record_ids = [record.id for record in records]

    if not record_ids:
        return {
            "patient_id": str(user.id),
            "medications": []
        }

    medications = (
        db.query(Medication)
        .filter(Medication.record_id.in_(record_ids))
        .all()
    )

    return {
        "patient_id": str(user.id),
        "medications": medications
    }
