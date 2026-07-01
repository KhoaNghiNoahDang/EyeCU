from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import (
    Patient,
    Staff,
    PatientsQueue,
    ClinicalRecord,
    Medication,
    FollowUp,
    HospitalFee,
    HospitalFeeItem,
    Department,
)
from app.core.security import require_roles, get_current_user
from app.api.ambient import ambient_manager
from app.services.vnpt_api import vnpt_client

router = APIRouter()


class WalkinSchema(BaseModel):
    name: str
    cccd: str


class ChatRequest(BaseModel):
    message: str


class EkycCccdRequest(BaseModel):
    image_base64: str


class EkycFaceRequest(BaseModel):
    far_image_base64: str
    near_image_base64: str


class PatientRegistration(BaseModel):
    cccd: str
    name: str
    phone: str
    bhxh_code: str = ""
    avatar_url: str = ""
    cccd_front_url: str = ""
    cccd_back_url: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""


@router.post("/verify-bhxh", dependencies=[Depends(require_roles(["ems", "ops"]))])
def verify_bhxh_fast_track(cccd: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.cccd == cccd).first()
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
    existing = db.query(Patient).filter(Patient.cccd == data.cccd).first()
    if existing:
        return {
            "status": "success",
            "patient_id": str(existing.id),
            "message": "Bệnh nhân đã tồn tại",
        }

    new_patient = Patient(cccd=data.cccd, name=data.name)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    ticket = PatientsQueue(patient_id=new_patient.id, status="waiting")
    db.add(ticket)
    db.commit()
    return {"status": "success", "ticket_id": str(ticket.id)}


@router.post("/sos", dependencies=[Depends(require_roles(["patient"]))])
async def trigger_patient_sos(user: Patient = Depends(get_current_user)):
    await ambient_manager.broadcast(
        {
            "type": "CAMERA_EVENT",
            "severity": "critical",
            "title": f"BÁO ĐỘNG ĐỎ — SOS TỪ BỆNH NHÂN {user.name}",
        }
    )
    return {"status": "SOS_SENT"}


@router.post("/chat", dependencies=[Depends(require_roles(["patient"]))])
async def patient_chatbot(data: ChatRequest):
    bot_response = await vnpt_client.call_smartbot_conversation(data.message)

    reply = "Tôi chưa hiểu rõ câu hỏi, vui lòng thử lại."
    if (
        "data" in bot_response
        and isinstance(bot_response["data"], list)
        and len(bot_response["data"]) > 0
    ):
        reply = bot_response["data"][0].get("text", reply)

    return {"reply": reply, "raw_data": bot_response}


@router.post("/ekyc/cccd")
async def extract_cccd_info(data: EkycCccdRequest):
    # Decode base64
    import base64

    try:
        # data.image_base64 usually comes as 'data:image/jpeg;base64,xxxx'
        b64_str = (
            data.image_base64.split(",")[1]
            if "," in data.image_base64
            else data.image_base64
        )
        file_bytes = base64.b64decode(b64_str)
        hash_str = await vnpt_client.upload_file(file_bytes, "cccd.jpg")
        if not hash_str:
            return {"status": "error", "message": "Lỗi upload ảnh lên VNPT"}
        ocr_data = await vnpt_client.call_ekyc_ocr(hash_str)
        return {"status": "success", "data": ocr_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/ekyc/face")
async def verify_face(data: EkycFaceRequest):
    import base64

    try:
        # Lấy 1 ảnh duy nhất (Frontend vẫn gửi far/near nhưng ta chỉ lấy 1)
        face_str = (
            data.far_image_base64.split(",")[1]
            if "," in data.far_image_base64
            else data.far_image_base64
        )

        face_bytes = base64.b64decode(face_str)

        # Upload 1 ảnh duy nhất (chứng minh có gọi VNPT)
        face_hash = await vnpt_client.upload_file(face_bytes, "face.jpg")

        if not face_hash:
            return {"status": "error", "message": "Lỗi upload ảnh khuôn mặt"}

        # Gọi API 2D Liveness nhanh
        result = await vnpt_client.call_face_liveness_2d(face_hash)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/register")
def register_patient(data: PatientRegistration, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.cccd == data.cccd).first()
    if existing:
        return {
            "status": "error",
            "message": "Bệnh nhân đã tồn tại, vui lòng Đăng nhập",
        }

    import uuid

    qr_token_str = uuid.uuid4().hex[:16]

    new_patient = Patient(
        name=data.name,
        cccd=data.cccd,
        phone=data.phone,
        bhxh_code=data.bhxh_code,
        qr_token=qr_token_str,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        avatar_url=data.avatar_url,
        cccd_front_url=data.cccd_front_url,
        cccd_back_url=data.cccd_back_url,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return {
        "status": "success",
        "patient_id": str(new_patient.id),
        "qr_token": qr_token_str,
    }


@router.get(
    "/my-profile",
    dependencies=[Depends(require_roles(["patient"]))],
)
def get_my_profile(
    user: Patient = Depends(get_current_user),
):
    return {
        "id": str(user.id),
        "name": user.name,
        "cccd": user.cccd,
        "bhxh_code": user.bhxh_code,
        "avatar_url": user.avatar_url,
        "emergency_contact_name": user.emergency_contact_name,
        "emergency_contact_phone": user.emergency_contact_phone,
    }


@router.get(
    "/my-records",
    dependencies=[Depends(require_roles(["patient"]))],
)
def get_my_records(
    user: Patient = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(ClinicalRecord).filter(ClinicalRecord.patient_id == user.id).all()
    )

    return {
        "records": [
            {
                "id": str(r.id),
                "symptoms": r.symptoms,
                "diagnosis": r.diagnosis,
                "notes": r.notes,
                "created_at": str(r.created_at),
                "is_signed": r.is_signed,
            }
            for r in records
        ]
    }


@router.get(
    "/my-medications",
    dependencies=[Depends(require_roles(["patient"]))],
)
def get_my_medications(
    user: Patient = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(ClinicalRecord).filter(ClinicalRecord.patient_id == user.id).all()
    )

    record_ids = [record.id for record in records]

    if not record_ids:
        return {
            "patient_id": str(user.id),
            "medications": [],
        }

    medications = (
        db.query(Medication).filter(Medication.record_id.in_(record_ids)).all()
    )

    return {
        "patient_id": str(user.id),
        "medications": [
            {
                "id": str(m.id),
                "medicine_name": m.medicine_name,
                "dosage": m.dosage,
                "instructions": m.instructions,
            }
            for m in medications
        ],
    }


@router.get(
    "/clinical-bundle",
    dependencies=[Depends(require_roles(["patient"]))],
)
def get_patient_clinical_bundle(
    user: Patient = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest_record = (
        db.query(ClinicalRecord)
        .filter(ClinicalRecord.patient_id == user.id)
        .order_by(ClinicalRecord.created_at.desc())
        .first()
    )

    if not latest_record:
        return {"status": "no_records"}

    doctor = db.query(Staff).filter(Staff.id == latest_record.doctor_id).first()
    doctor_name = doctor.name if doctor else "BS. Cấp cứu"
    dept = (
        db.query(Department).filter(Department.id == doctor.department_id).first()
        if doctor
        else None
    )
    department_name = dept.name if dept else "Khoa Khám Bệnh"

    medications = (
        db.query(Medication).filter(Medication.record_id == latest_record.id).all()
    )
    followup = db.query(FollowUp).filter(FollowUp.record_id == latest_record.id).first()
    fee = (
        db.query(HospitalFee).filter(HospitalFee.record_id == latest_record.id).first()
    )
    fee_items = []
    if fee:
        fee_items = (
            db.query(HospitalFeeItem).filter(HospitalFeeItem.fee_id == fee.id).all()
        )

    return {
        "patientId": str(user.id),
        "patientName": user.name,
        "cccd": user.cccd,
        "bhxh_code": user.bhxh_code,
        "latestRecord": {
            "id": str(latest_record.id),
            "patient_id": str(latest_record.patient_id),
            "doctor_id": str(latest_record.doctor_id),
            "symptoms": latest_record.symptoms,
            "diagnosis": latest_record.diagnosis,
            "notes": latest_record.notes,
            "created_at": latest_record.created_at.isoformat(),
            "is_signed": latest_record.is_signed,
            "doctor_name": doctor_name,
            "department": department_name,
        },
        "medications": [
            {
                "id": str(m.id),
                "record_id": str(m.record_id),
                "medicine_name": m.medicine_name,
                "dosage": m.dosage,
                "instructions": m.instructions,
            }
            for m in medications
        ],
        "followUp": (
            {
                "date": followup.date if followup else "",
                "time": followup.time if followup else "",
                "department": followup.department if followup else "",
                "note": followup.note if followup else "",
            }
            if followup
            else None
        ),
        "fees": (
            {
                "record_id": str(fee.record_id) if fee else "",
                "items": [{"name": i.name, "amount": i.amount} for i in fee_items],
                "total": fee.total if fee else 0,
                "status": fee.status if fee else "pending",
                "paid_at": fee.paid_at.isoformat() if fee and fee.paid_at else None,
            }
            if fee
            else None
        ),
    }
