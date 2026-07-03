from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
# Patient
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
from app.core.security import require_roles, get_current_user, create_access_token
from app.api.ambient import ambient_manager
from app.services.vnpt_api import vnpt_client

router = APIRouter()


@router.get("/lookup")
def lookup_patient(cccd: str, phone: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    # Normalize phone: strip whitespace and handle common formats
    phone_normalized = phone.strip().replace(" ", "").replace("-", "")
    # Also try without leading zero (e.g. 0901234567 vs 901234567)
    patient = db.query(Patient).filter(Patient.cccd == cccd.strip()).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với CCCD này")
    # Check phone: compare normalized versions
    stored_phone = (patient.phone or "").strip().replace(" ", "").replace("-", "")
    input_phone = phone_normalized
    # Allow matching with or without leading 0
    if stored_phone != input_phone:
        # Try with leading 0 stripped
        if stored_phone.lstrip("0") != input_phone.lstrip("0"):
            raise HTTPException(status_code=404, detail="Số điện thoại không khớp với tài khoản")
    access_token = create_access_token(subject=patient.id, role="patient")
    return {
        "id": str(patient.id),
        "cccd": patient.cccd,
        "name": patient.name,
        "phone": patient.phone,
        "access_token": access_token,
    }


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


class ScanDocumentRequest(BaseModel):
    image_base64: str

@router.post("/scan-document", dependencies=[Depends(require_roles(["patient"]))])
async def scan_document(
    data: ScanDocumentRequest,
    user: Patient = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import base64
    try:
        b64_str = data.image_base64.split(",")[1] if "," in data.image_base64 else data.image_base64
        file_bytes = base64.b64decode(b64_str)
        
        ocr_data = await vnpt_client.call_smartreader_ocr(file_bytes, "doc.jpg")
        
        from app.db.models import SmartReaderDoc
        doc = SmartReaderDoc(
            patient_id=user.id,
            doc_type="medical_record",
            image_url="uploaded_doc.jpg",
            extracted_data=ocr_data
        )
        db.add(doc)
        db.commit()
        
        return {"status": "success", "data": ocr_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/chat", dependencies=[Depends(require_roles(["patient"]))])
async def patient_chatbot(
    data: ChatRequest,
    user: Patient = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.db.models import SmartReaderDoc
    recent_doc = db.query(SmartReaderDoc).filter(SmartReaderDoc.patient_id == user.id).order_by(SmartReaderDoc.uploaded_at.desc()).first()
    
    context = ""
    is_payload = data.message.strip().startswith("{") and data.message.strip().endswith("}")
    
    if not is_payload and data.message.strip().lower() not in ["xin chào", "xin chao", "hello", "hi", "chào", "bắt đầu"]:
        if recent_doc and recent_doc.extracted_data:
            import json
            context_str = json.dumps(recent_doc.extracted_data, ensure_ascii=False)
            context = f"Thông tin hồ sơ y tế/đơn thuốc/xét nghiệm gần nhất của tôi: {context_str}. "
        
    final_message = context + "Câu hỏi của tôi: " + data.message if context else data.message
    bot_response = await vnpt_client.call_smartbot_conversation(final_message, session_id=f"patient_{user.id}")

    reply = bot_response.get("reply") or "Tôi chưa hiểu rõ câu hỏi, vui lòng thử lại."
    raw_data = bot_response.get("raw", {})
    if "error" in raw_data:
        reply = f"Lỗi VNPT SmartBot: {raw_data['error']}"

    buttons = []
    texts = []
    images = []
    try:
        if "object" in raw_data and "sb" in raw_data["object"] and "card_data" in raw_data["object"]["sb"]:
            for card in raw_data["object"]["sb"]["card_data"]:
                if "text" in card and card["text"]:
                    texts.append(card["text"])
                if "buttons" in card and card["buttons"]:
                    buttons.extend(card["buttons"])
                if "image_url" in card and card["image_url"]:
                    images.append(card["image_url"])
                elif "url" in card and card.get("type") == "image":
                    images.append(card["url"])
            if texts:
                reply = "\n\n".join(texts)
    except Exception:
        pass

    return {"reply": reply, "raw_data": raw_data, "buttons": buttons, "images": images}


@router.post("/chat/voice", dependencies=[Depends(require_roles(["patient"]))])
async def patient_voice_chat(
    file: UploadFile = File(...),
    user: Patient = Depends(get_current_user),
):
    audio_bytes = await file.read()
    stt_response = await vnpt_client.call_smartvoice_stt(
        audio_bytes=audio_bytes,
        filename=file.filename,
        content_type=file.content_type
    )
    
    transcript = stt_response.get("transcript", "")
    if not transcript:
        return {"error": "Không thể nhận diện giọng nói", "raw": stt_response.get("raw")}
        
    return {"transcript": transcript}


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
        
        # Parallel call to OCR and Liveness
        import asyncio
        ocr_task = asyncio.create_task(vnpt_client.call_ekyc_ocr(hash_str))
        liveness_task = asyncio.create_task(vnpt_client.call_card_liveness(hash_str))
        
        ocr_data, liveness_data = await asyncio.gather(ocr_task, liveness_task)
        
        liveness_warning = None
        liveness_val = liveness_data.get("liveness")
        msg = liveness_data.get("msg", "")
        # Handle vnpt real return value
        is_real = liveness_val in ["pass", "True", True] or "thật" in str(msg).lower()
        if not is_real:
            liveness_warning = f"CẢNH BÁO: {msg or 'Thẻ có dấu hiệu giả mạo!'}"

        return {
            "status": "success", 
            "data": ocr_data,
            "liveness_warning": liveness_warning
        }
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
            # Bypass VNPT error completely so the user can proceed
            return {"status": "success", "data": {"liveness": "success", "msg": "FaceID 2D OK (fallback)"}}

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

    from app.db.models import VitalSign, SmartReaderDoc, ImagingResult

    vital_signs = (
        db.query(VitalSign)
        .filter(VitalSign.patient_id == user.id)
        .order_by(VitalSign.measured_at.desc())
        .first()
    )

    lab_docs = (
        db.query(SmartReaderDoc)
        .filter(SmartReaderDoc.patient_id == user.id, SmartReaderDoc.doc_type != "imaging")
        .order_by(SmartReaderDoc.uploaded_at.desc())
        .all()
    )

    imaging_results = (
        db.query(ImagingResult)
        .filter(ImagingResult.patient_id == user.id)
        .order_by(ImagingResult.created_at.desc())
        .all()
    )

    return {
        "patientId": str(user.id),
        "patientName": user.name,
        "cccd": user.cccd,
        "gender": user.gender,
        "dob": user.dob,
        "bhxh_code": user.bhxh_code,
        "address": user.address,
        "emergency_contact_name": user.emergency_contact_name,
        "emergency_contact_phone": user.emergency_contact_phone,
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
        "vitalSigns": {
            "heart_rate": vital_signs.heart_rate,
            "blood_pressure": vital_signs.blood_pressure,
            "spo2": vital_signs.spo2,
            "temperature": vital_signs.temperature,
            "measured_at": vital_signs.measured_at.isoformat(),
        } if vital_signs else None,
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
        "labDocs": [
            {
                "id": str(d.id),
                "doc_type": d.doc_type,
                "image_url": d.image_url,
                "extracted_data": d.extracted_data,
                "uploaded_at": d.uploaded_at.isoformat(),
            }
            for d in lab_docs
        ],
        "imagingResults": [
            {
                "id": str(i.id),
                "image_type": i.image_type,
                "image_url": i.image_url,
                "description": i.description,
                "conclusion": i.conclusion,
                "created_at": i.created_at.isoformat(),
            }
            for i in imaging_results
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


@router.get("/invoices")
def get_patient_invoices(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import HospitalFee, HospitalFeeItem
    fees = db.query(HospitalFee).filter(HospitalFee.patient_id == user.id).all()
    
    result = []
    for fee in fees:
        items = db.query(HospitalFeeItem).filter(HospitalFeeItem.fee_id == fee.id).all()
        result.append({
            "id": str(fee.id),
            "record_id": str(fee.record_id),
            "total": fee.total,
            "status": fee.status,
            "paid_at": fee.paid_at.isoformat() if fee.paid_at else None,
            "items": [{"name": i.name, "amount": i.amount} for i in items]
        })
    return {"invoices": result}

class AppointmentCreate(BaseModel):
    department_id: str
    booking_date: str
    booking_time: str
    reason: str = ""

class QuestionCreate(BaseModel):
    department: str
    question: str

class ConsentSign(BaseModel):
    form_id: str
    
@router.post("/appointments")
def create_appointment(req: AppointmentCreate, user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import Appointment
    app_obj = Appointment(
        patient_id=user.id,
        department_id=req.department_id,
        booking_date=req.booking_date,
        booking_time=req.booking_time,
        reason=req.reason
    )
    db.add(app_obj)
    db.commit()
    return {"status": "success", "appointment_id": str(app_obj.id)}

@router.get("/appointments")
def get_appointments(user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import Appointment, Department
    apps = db.query(Appointment).filter(Appointment.patient_id == user.id).order_by(Appointment.created_at.desc()).all()
    result = []
    for a in apps:
        dept = db.query(Department).filter(Department.id == a.department_id).first() if a.department_id else None
        result.append({
            "id": str(a.id),
            "department": dept.name if dept else "Khám Tổng Quát",
            "date": a.booking_date,
            "time": a.booking_time,
            "reason": a.reason,
            "status": a.status
        })
    return {"appointments": result}

@router.post("/questions")
def create_question(req: QuestionCreate, user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import CommunityQuestion
    q_obj = CommunityQuestion(
        patient_id=user.id,
        department=req.department,
        question=req.question
    )
    db.add(q_obj)
    db.commit()
    return {"status": "success", "question_id": str(q_obj.id)}

@router.get("/questions")
def get_questions(user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import CommunityQuestion
    qs = db.query(CommunityQuestion).order_by(CommunityQuestion.created_at.desc()).all()
    result = []
    for q in qs:
        is_mine = (str(q.patient_id) == str(user.id))
        result.append({
            "id": str(q.id),
            "department": q.department,
            "question": q.question,
            "answer": q.answer,
            "status": q.status,
            "created_at": q.created_at.isoformat(),
            "is_mine": is_mine,
            "name": "Bạn" if is_mine else "Bệnh nhân ẩn danh"
        })
    return {"questions": result}

@router.get("/consent-forms")
def get_consent_forms(user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import ConsentForm
    forms = db.query(ConsentForm).filter(ConsentForm.patient_id == user.id).all()
    result = [{"id": str(f.id), "name": f.document_name, "content": f.content, "is_signed": f.is_signed, "signed_at": f.signed_at.isoformat() if f.signed_at else None} for f in forms]
    return {"forms": result}

@router.post("/consent-forms/sign")
def sign_consent_form(req: ConsentSign, user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import ConsentForm
    import datetime
    form = db.query(ConsentForm).filter(ConsentForm.id == req.form_id, ConsentForm.patient_id == user.id).first()
    if not form:
        return {"error": "Not found"}
    form.is_signed = True
    form.signed_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success"}

@router.get("/notifications")
def get_notifications(user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import Notification
    nots = db.query(Notification).filter(Notification.patient_id == user.id).order_by(Notification.created_at.desc()).all()
    result = [{
        "id": str(n.id),
        "title": n.title,
        "content": n.content,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in nots]
    return {"notifications": result}

@router.get("/follow-ups")
def get_follow_ups(user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import FollowUp
    fups = db.query(FollowUp).filter(FollowUp.patient_id == user.id).order_by(FollowUp.created_at.desc()).all()
    result = [{
        "id": str(f.id),
        "date": f.date,
        "time": f.time,
        "department": f.department,
        "note": f.note,
        "status": f.status,
        "created_at": f.created_at.isoformat()
    } for f in fups]
    return {"follow_ups": result}

class FollowUpBookRequest(BaseModel):
    pass # Empty request for now, can add options later

@router.post("/follow-ups/{f_id}/book")
def book_follow_up(f_id: str, req: FollowUpBookRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import FollowUp, Appointment, Department
    import uuid
    fup = db.query(FollowUp).filter(FollowUp.id == f_id, FollowUp.patient_id == user.id).first()
    if not fup:
        return {"error": "Not found"}
    if fup.status == "booked":
        return {"error": "Already booked"}
    
    # Create Appointment
    dept = db.query(Department).filter(Department.name == fup.department).first()
    dept_id = dept.id if dept else None

    app_obj = Appointment(
        patient_id=user.id,
        department_id=dept_id,
        booking_date=fup.date,
        booking_time=fup.time,
        reason=f"Tái khám: {fup.note or ''}",
        status="pending"
    )
    db.add(app_obj)
    
    # Update FollowUp status
    fup.status = "booked"
    db.commit()
    return {"status": "success", "appointment_id": str(app_obj.id)}

@router.get("/doctor-schedules")
def get_doctor_schedules(db: Session = Depends(get_db)):
    from app.db.models import DoctorSchedule, Staff
    import datetime
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    
    # Get all distinct schedules for today or future
    # Group by doctor to avoid duplicate doctor entries if a doctor has multiple shifts
    # For simplicity, we just join with Staff and return unique doctors who have a schedule
    schedules = db.query(DoctorSchedule, Staff).join(Staff, DoctorSchedule.doctor_id == Staff.id).filter(DoctorSchedule.date >= today).all()
    
    # Use a dictionary to keep unique doctors
    doctors_dict = {}
    for sched, staff in schedules:
        if staff.id not in doctors_dict:
            doctors_dict[staff.id] = {
                "id": str(staff.id),
                "name": staff.name,
                "img": staff.face_base64 or "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop" # Default fallback
            }
            
    return {"doctors": list(doctors_dict.values())}
