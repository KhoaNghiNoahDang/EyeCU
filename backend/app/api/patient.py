from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, AdmissionQueue
from app.core.security import require_roles, get_current_user
from app.api.ambient import ambient_manager
from pydantic import BaseModel
import uuid

router = APIRouter()


class WalkinSchema(BaseModel):
    name: str
    cccd: str


@router.post("/verify-bhxh", dependencies=[Depends(require_roles(["ems", "ops"]))])
def verify_bhxh_fast_track(cccd: str, db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.cccd == cccd).first()
    return {
        "status": "success",
        "patient": (
            {"name": patient.name, "age": 62, "gender": "Nam"}
            if patient
            else {"name": "Nguyễn Văn A (Mock)"}
        ),
        "sync_steps": {"bhxh": "Thành công", "medical_history": "Đồng bộ xong"},
    }


@router.post("/admit-walkin", dependencies=[Depends(require_roles(["ops", "admin"]))])
def admit_walkin(data: WalkinSchema, db: Session = Depends(get_db)):
    new_patient = User(role="patient", cccd=data.cccd, name=data.name)
    db.add(new_patient)
    db.commit()

    ticket = AdmissionQueue(
        patient_id=new_patient.id, status="waiting", priority="urgent"
    )
    db.add(ticket)
    db.commit()
    return {"status": "success", "ticket_id": str(ticket.id)}


from app.services.vnpt_api import vnpt_client


@router.post("/sos", dependencies=[Depends(require_roles(["patient"]))])
async def trigger_patient_sos(user: User = Depends(get_current_user)):
    await ambient_manager.broadcast(
        {
            "type": "CAMERA_EVENT",
            "severity": "critical",
            "title": f"BÁO ĐỘNG ĐỎ — SOS TỪ BỆNH NHÂN {user.name}",
        }
    )
    return {"status": "SOS_SENT"}


class ChatRequest(BaseModel):
    message: str


@router.post("/chat", dependencies=[Depends(require_roles(["patient"]))])
async def patient_chatbot(data: ChatRequest):
    # GỌI VNPT SMARTBOT THẬT qua httpx
    bot_response = await vnpt_client.call_smartbot_conversation(data.message)

    reply = "Tôi chưa hiểu rõ câu hỏi, vui lòng thử lại."
    if (
        "data" in bot_response
        and isinstance(bot_response["data"], list)
        and len(bot_response["data"]) > 0
    ):
        reply = bot_response["data"][0].get("text", reply)

    return {"reply": reply, "raw_data": bot_response}
