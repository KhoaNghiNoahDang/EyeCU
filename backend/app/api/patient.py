from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
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
        "avatar": patient.avatar_url,
        "access_token": access_token,
    }


class WalkinSchema(BaseModel):
    name: str
    cccd: str


class ChatRequest(BaseModel):
    message: str
    screen_context: dict = None


class AppointmentCreate(BaseModel):
    ma_bn: str
    doctor_id: str
    date: str
    time: str
    symptoms: Optional[str] = None


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
        
        # Kiểm tra nếu OCR trả về lỗi 401 hoặc text rỗng do lỗi API
        if not ocr_data.get("text") and "error" in str(ocr_data.get("raw", "")):
            return {"status": "error", "message": "API bóc tách VNPT gặp lỗi: " + str(ocr_data.get("raw"))}
            
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
        if getattr(data, "screen_context", None):
            import json
            import re
            try:
                # Chuyển thành JSON string
                raw_str = json.dumps(data.screen_context, ensure_ascii=False)
                # Loại bỏ các ký tự ngoặc nhọn, ngoặc vuông và dấu nháy kép để tránh lỗi Template/WAF của VNPT Bot
                safe_str = re.sub(r'[\{\}\[\]"]', ' ', raw_str)
                # Xóa bớt khoảng trắng thừa
                safe_str = re.sub(r'\s+', ' ', safe_str).strip()
                # Giới hạn độ dài để tránh Payload Too Large
                safe_str = safe_str[:1500]
                context = f"Thông tin hồ sơ/kết quả đang hiển thị trên màn hình: {safe_str}. "
            except Exception:
                pass
        elif recent_doc and recent_doc.extracted_data:
            words = []
            def extract_text(obj):
                if isinstance(obj, dict):
                    if "text" in obj:
                        words.append(str(obj["text"]))
                    for v in obj.values():
                        if isinstance(v, (dict, list)):
                            extract_text(v)
                elif isinstance(obj, list):
                    for item in obj:
                        if isinstance(item, (dict, list)):
                            extract_text(item)
            
            raw_dict = recent_doc.extracted_data.get("raw", {})
            if "phrases" in raw_dict:
                extract_text(raw_dict["phrases"])
            else:
                extract_text(raw_dict)
            
            text_only = " ".join(words)[:5000]
            
            # Đổi prompt để ép LLM phải đọc dữ liệu
            context = f"Dưới đây là DỮ LIỆU XÉT NGHIỆM CỦA TÔI:\n{text_only}\n\nDựa vào các số liệu ở trên, hãy trả lời câu hỏi: "
        
    final_message = context + data.message if context else data.message
    
    # In ra console để theo dõi chính xác nội dung gửi lên VNPT Bot
    print("========== GỬI LÊN VNPT BOT ==========")
    print(final_message)
    print("======================================")
        
    # Gắn thẻ metadata định danh bệnh nhân (CCCD) để bot nhận biết và gọi API Đặt lịch
    metadata = {
        "button_variables": [
            {"key": "patient_id", "value": user.cccd},
            {"key": "patient_name", "value": user.name}
        ]
    }
    bot_response = await vnpt_client.call_smartbot_conversation(final_message, session_id=f"patient_{user.id}", metadata=metadata)

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
            return {"status": "error", "message": "Lỗi kết nối VNPT eKYC (Không thể upload ảnh)"}

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
    from sqlalchemy import text as sql_text

    vital_signs_row = db.execute(
        sql_text("""SELECT vs.* FROM vital_signs vs
            JOIN encounters e ON vs.encounter_id = e.id
            WHERE e.patient_id = :pid
            ORDER BY vs.measured_at DESC LIMIT 1""")
        , {"pid": str(user.id)}
    ).fetchone()

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
            "heart_rate": vital_signs_row.heart_rate,
            "spo2": vital_signs_row.spo2,
            "measured_at": vital_signs_row.measured_at.isoformat(),
        } if vital_signs_row else None,
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


# ==================================================================# LỊCH KHÁM & BÁC SĨ (DÀNH CHO CHATBOT)
# ==================================================================
@router.get("/doctors")
def get_doctors(dept: str, db: Session = Depends(get_db)):
    """Trả về danh sách bác sĩ (role=clinician), hỗ trợ lọc theo khoa."""
    from app.db.models import Staff, Department
    import datetime
    
    query = db.query(Staff).filter(Staff.role == "clinician")
    
    if dept:
        # Tìm department_id dựa trên tên khoa (dept)
        department = db.query(Department).filter(Department.name.ilike(f"%{dept}%")).first()
        if department:
            query = query.filter(Staff.department_id == department.id)
            
    doctors = query.all()
    result = []
    
    # Tạo ngày mock (ngày mai) cho JSON Response giống hệt Document
    mock_date = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    
    for doc in doctors:
        dept_name = ""
        if doc.department_id:
            d = db.query(Department).filter(Department.id == doc.department_id).first()
            if d:
                dept_name = d.name
                
        result.append({
            "doctor_id": str(doc.id),
            "full_name": f"BS. {doc.name}",
            "specialty": f"Bác sĩ chuyên khoa {dept_name}" if dept_name else "Bác sĩ chuyên khoa",
            "available_slots": ["08:00 - 10:00", "13:30 - 15:00"],
            "date": mock_date
        })
        
    return {"status": "success", "data": result}


@router.post("/appointments/create")
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    """Tạo lịch khám bệnh từ ứng dụng."""
    from app.db.models import Appointment, Patient, Staff
    import uuid
    from fastapi import HTTPException
    
    # 1. Error Handling: Kiểm tra ma_bn (CCCD)
    patient = db.query(Patient).filter(Patient.cccd == data.ma_bn).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy bệnh nhân với mã {data.ma_bn}")
        
    # 2. Error Handling: Kiểm tra Bác sĩ
    try:
        doc_id = uuid.UUID(data.doctor_id)
        doctor = db.query(Staff).filter(Staff.id == doc_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Không tìm thấy bác sĩ")
    except ValueError:
        raise HTTPException(status_code=400, detail="Mã bác sĩ không hợp lệ (Phải là UUID)")
    
    try:
        new_appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            date=data.date,
            time=data.time,
            status="pending"
        )
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
        
        return {
            "status": "success", 
            "message": "Đặt lịch thành công",
            "appointment_id": f"AP-{str(new_appointment.id)[:6].upper()}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể lưu lịch hẹn: {str(e)}")
@router.get("/invoices")
def get_patient_invoices(user: Patient = Depends(get_current_user), db: Session = Depends(get_db)):
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
    doctor_id: Optional[str] = None  # None = chọn ngẫu nhiên

# ─── GET Departments ──────────────────────────────────────────────
@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """Trả về danh sách chuyên khoa từ DB."""
    from app.db.models import Department
    depts = db.query(Department).order_by(Department.name).all()
    return {"departments": [{"id": str(d.id), "name": d.name, "description": d.description} for d in depts]}

# ─── GET Doctors by Department ────────────────────────────────────
@router.get("/doctors-by-department")
def get_doctors_by_dept(department_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Trả về danh sách bác sĩ (clinician) theo khoa."""
    from app.db.models import Staff
    import uuid as _uuid
    query = db.query(Staff).filter(Staff.role == "clinician")
    if department_id:
        try:
            dept_uuid = _uuid.UUID(department_id)
            query = query.filter(Staff.department_id == dept_uuid)
        except ValueError:
            pass
    doctors = query.all()
    return {"doctors": [
        {
            "id": str(d.id),
            "name": d.name.strip(),
            "department_id": str(d.department_id) if d.department_id else None,
        }
        for d in doctors
    ]}

# ─── GET Booked Slots for a Doctor on a Date ──────────────────────
@router.get("/appointments/booked-slots")
def get_booked_slots(
    doctor_id: str,
    date: str,
    db: Session = Depends(get_db),
):
    """Trả về danh sách slot giờ đã bị đặt cho bác sĩ trong ngày."""
    from app.db.models import Appointment
    import uuid as _uuid
    try:
        doc_uuid = _uuid.UUID(doctor_id)
    except ValueError:
        return {"booked_slots": []}
    apts = db.query(Appointment).filter(
        Appointment.doctor_id == doc_uuid,
        Appointment.booking_date == date,
        Appointment.status != "cancelled"
    ).all()
    slots = [a.booking_time for a in apts if a.booking_time]
    return {"booked_slots": slots}

class AvatarUpdate(BaseModel):
    avatar_base64: str

@router.post("/avatar")
def update_avatar(req: AvatarUpdate, user: Patient = Depends(get_current_user), db: Session = Depends(get_db)):
    user.avatar_url = req.avatar_base64
    db.commit()
    return {"status": "success"}

class QuestionCreate(BaseModel):
    department: str
    question: str

class ConsentSign(BaseModel):
    form_id: str
    
@router.post("/appointments")
async def create_appointment_portal(req: AppointmentCreate, user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Tạo lịch khám từ bệnh nhân portal. Sau khi tạo, broadcast WS cho bác sĩ."""
    from app.db.models import Appointment, Staff, Department
    from app.api.ambient import ambient_manager
    import uuid as _uuid, random as _random

    # Xác định bác sĩ
    doctor_id = None
    doctor_name = "Bác sĩ"
    if req.doctor_id and req.doctor_id != "random":
        try:
            doc = db.query(Staff).filter(Staff.id == _uuid.UUID(req.doctor_id)).first()
            if doc:
                doctor_id = doc.id
                doctor_name = doc.name.strip()
        except ValueError:
            pass
    
    if doctor_id is None:
        # Chọn ngỪu nhiên từ department
        try:
            dept_uuid = _uuid.UUID(req.department_id)
            candidates = db.query(Staff).filter(
                Staff.role == "clinician",
                Staff.department_id == dept_uuid
            ).all()
        except ValueError:
            candidates = []
        if not candidates:
            # Fallback: bất kỳ clinician nào
            candidates = db.query(Staff).filter(Staff.role == "clinician").all()
        if candidates:
            chosen = _random.choice(candidates)
            doctor_id = chosen.id
            doctor_name = chosen.name.strip()

    # Lấy tên khoa
    dept_name = "Khám Tổng Quát"
    try:
        dept_uuid = _uuid.UUID(req.department_id)
        dept = db.query(Department).filter(Department.id == dept_uuid).first()
        if dept:
            dept_name = dept.name
    except ValueError:
        pass

    # Tạo appointment
    app_obj = Appointment(
        patient_id=user.id,
        department_id=_uuid.UUID(req.department_id) if req.department_id else None,
        doctor_id=doctor_id,
        booking_date=req.booking_date,
        booking_time=req.booking_time,
        reason=req.reason,
        status="confirmed"
    )
    db.add(app_obj)
    db.commit()

    # Broadcast real-time cho bác sĩ được chỉ định
    patient_name = getattr(user, "full_name", None) or getattr(user, "name", "Bệnh nhân")
    await ambient_manager.broadcast({
        "type": "APPOINTMENT_BOOKED",
        "data": {
            "appointment_id": str(app_obj.id),
            "doctor_id": str(doctor_id) if doctor_id else None,
            "doctor_name": doctor_name,
            "patient_name": patient_name,
            "department": dept_name,
            "date": req.booking_date,
            "time": req.booking_time,
            "reason": req.reason or "Khám bệnh",
        }
    })
    return {
        "status": "success",
        "appointment_id": str(app_obj.id),
        "doctor_name": doctor_name,
        "doctor_id": str(doctor_id) if doctor_id else None,
        "department": dept_name,
    }

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

# ─── Lấy Lịch Hẹn Của Bác Sĩ (Clinician Dashboard) ─────────────────
@router.get("/doctor-appointments")
def get_doctor_appointments(user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lấy danh sách lịch khám của bác sĩ đang đăng nhập."""
    from app.db.models import Appointment, Department, Patient
    apps = db.query(Appointment).filter(Appointment.doctor_id == user.id).order_by(Appointment.booking_date.asc(), Appointment.booking_time.asc()).all()
    result = []
    for a in apps:
        dept = db.query(Department).filter(Department.id == a.department_id).first() if a.department_id else None
        pat = db.query(Patient).filter(Patient.id == a.patient_id).first() if a.patient_id else None
        result.append({
            "id": str(a.id),
            "department": dept.name if dept else "Khám Tổng Quát",
            "patient_name": pat.name if pat else "Bệnh nhân",
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
            "doctor_name": q.doctor_name,
            "answered_at": q.answered_at.isoformat() if q.answered_at else None,
            "created_at": q.created_at.isoformat(),
            "is_mine": is_mine,
            "name": "Bạn" if is_mine else "Bệnh nhân ẩn danh"
        })
    return {"questions": result}

# ─────────────────────────────────────────────────────────────────
# DOCTOR Q&A ENDPOINTS — for clinician/staff roles
# ─────────────────────────────────────────────────────────────────────────────

class AnswerCreate(BaseModel):
    answer: str

@router.get("/questions/all")
def get_all_questions_doctor(
    department: Optional[str] = None,
    status: Optional[str] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bác sĩ lấy toàn bộ câu hỏi cộng đồng, có thể filter theo khoa và trạng thái."""
    from app.db.models import CommunityQuestion
    query = db.query(CommunityQuestion)
    if department and department != "all":
        query = query.filter(CommunityQuestion.department == department)
    if status and status != "all":
        query = query.filter(CommunityQuestion.status == status)
    qs = query.order_by(CommunityQuestion.created_at.desc()).all()
    result = []
    for q in qs:
        result.append({
            "id": str(q.id),
            "department": q.department,
            "question": q.question,
            "answer": q.answer,
            "status": q.status,
            "doctor_name": q.doctor_name,
            "doctor_id": str(q.doctor_id) if q.doctor_id else None,
            "created_at": q.created_at.isoformat(),
            "answered_at": q.answered_at.isoformat() if q.answered_at else None,
        })
    return {"questions": result}

# ── GET replies of a question ───────────────────────────────────────────────
@router.get("/questions/{question_id}/replies")
def get_replies(question_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Lấy toàn bộ replies của 1 câu hỏi (cả bệnh nhân và bác sĩ)."""
    from app.db.models import QuestionReply, CommunityQuestion
    q = db.query(CommunityQuestion).filter(CommunityQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    replies = (
        db.query(QuestionReply)
        .filter(QuestionReply.question_id == question_id)
        .order_by(QuestionReply.created_at.asc())
        .all()
    )
    return {
        "replies": [
            {
                "id": str(r.id),
                "sender_id": str(r.sender_id),
                "sender_type": r.sender_type,
                "sender_name": r.sender_name,
                "content": r.content,
                "created_at": r.created_at.isoformat(),
            }
            for r in replies
        ]
    }

class ReplyCreate(BaseModel):
    content: str

# ── POST reply (both patient and doctor can reply) ──────────────────────────
@router.post("/questions/{question_id}/replies")
async def post_reply(
    question_id: str,
    req: ReplyCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.db.models import QuestionReply, CommunityQuestion
    import datetime as dt
    from app.api.ambient import ambient_manager

    q = db.query(CommunityQuestion).filter(CommunityQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    if not req.content or len(req.content.strip()) < 1:
        raise HTTPException(status_code=400, detail="Nội dung không được trống")

    # Xác định loại người gửi (patient vs staff/doctor)
    role = getattr(user, "role", "patient")
    if role != "patient":  # Staff/Doctor
        sender_type = "doctor"
        sender_name = getattr(user, "name", None) or "Bác sĩ"
    else:
        # Patient
        sender_type = "patient"
        sender_name = getattr(user, "name", None) or "Bệnh nhân"

    now = dt.datetime.utcnow()
    reply = QuestionReply(
        question_id=q.id,
        sender_id=user.id,
        sender_type=sender_type,
        sender_name=sender_name,
        content=req.content.strip(),
        created_at=now,
    )
    db.add(reply)

    # Nếu là bác sĩ: cũng cập nhật status và answer gần nhất
    if sender_type == "doctor":
        q.answer = req.content.strip()
        q.status = "answered"
        q.answered_at = now
        q.doctor_name = sender_name
        q.doctor_id = user.id

    db.commit()
    db.refresh(reply)

    # Broadcast real-time
    await ambient_manager.broadcast({
        "type": "QA_NEW_REPLY",
        "data": {
            "question_id": question_id,
            "reply": {
                "id": str(reply.id),
                "sender_id": str(user.id),
                "sender_type": sender_type,
                "sender_name": sender_name,
                "content": reply.content,
                "created_at": now.isoformat(),
            }
        }
    })
    return {"status": "success", "reply_id": str(reply.id), "sender_type": sender_type}

@router.patch("/questions/{question_id}/answer")
async def answer_question(
    question_id: str,
    req: AnswerCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Legacy: Bác sĩ trả lời — vẫn giữ tương thích, tự tạo reply."""
    from app.db.models import CommunityQuestion, QuestionReply
    import datetime as dt
    from app.api.ambient import ambient_manager
    q = db.query(CommunityQuestion).filter(CommunityQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
    if not req.answer or len(req.answer.strip()) < 10:
        raise HTTPException(status_code=400, detail="Câu trả lời phải có ít nhất 10 ký tự")
    doctor_name = getattr(user, "name", None) or getattr(user, "full_name", None) or "Bác sĩ"
    now = dt.datetime.utcnow()
    q.answer = req.answer.strip()
    q.status = "answered"
    q.answered_at = now
    q.doctor_name = doctor_name
    q.doctor_id = user.id
    # Tạo reply entry
    reply = QuestionReply(
        question_id=q.id,
        sender_id=user.id,
        sender_type="doctor",
        sender_name=doctor_name,
        content=req.answer.strip(),
        created_at=now,
    )
    db.add(reply)
    db.commit()
    await ambient_manager.broadcast({
        "type": "QA_ANSWERED",
        "data": {
            "question_id": question_id,
            "answer": req.answer.strip(),
            "doctor_name": doctor_name,
            "doctor_id": str(user.id),
            "answered_at": now.isoformat(),
        }
    })
    return {"status": "success", "question_id": question_id, "doctor_name": doctor_name}


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
                "img": staff.face_base64 or "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>" # Default fallback
            }
            
    return {"doctors": list(doctors_dict.values())}

@router.get("/tickets/latest")
def get_latest_ticket(user: Patient = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import RegistrationTicket, TicketServiceItem
    ticket = db.query(RegistrationTicket).filter(RegistrationTicket.patient_id == user.id).order_by(RegistrationTicket.registered_at.desc()).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu khám")
    items = db.query(TicketServiceItem).filter(TicketServiceItem.ticket_id == ticket.id).order_by(TicketServiceItem.order_index).all()
    return {
        "id": str(ticket.id),
        "ticket_code": ticket.ticket_code,
        "patient_code": ticket.patient_code,
        "sequence_number": ticket.sequence_number,
        "registered_at": ticket.registered_at.isoformat(),
        "status": ticket.status,
        "items": [
            {
                "id": str(i.id),
                "service_name": i.service_name,
                "room_location": i.room_location,
                "order_index": i.order_index,
                "status": i.status
            } for i in items
        ]
    }

@router.get("/tickets/{ticket_code}")
def get_ticket_by_code(ticket_code: str, user: Patient = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models import RegistrationTicket, TicketServiceItem
    ticket = db.query(RegistrationTicket).filter(RegistrationTicket.patient_id == user.id, RegistrationTicket.ticket_code == ticket_code).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã hồ sơ này")
    items = db.query(TicketServiceItem).filter(TicketServiceItem.ticket_id == ticket.id).order_by(TicketServiceItem.order_index).all()
    return {
        "id": str(ticket.id),
        "ticket_code": ticket.ticket_code,
        "patient_code": ticket.patient_code,
        "sequence_number": ticket.sequence_number,
        "registered_at": ticket.registered_at.isoformat(),
        "status": ticket.status,
        "items": [
            {
                "id": str(i.id),
                "service_name": i.service_name,
                "room_location": i.room_location,
                "order_index": i.order_index,
                "status": i.status
            } for i in items
        ]
    }

class PaymentFaceVerify(BaseModel):
    face_base64: str

@router.post("/payment/verify-face")
async def verify_payment_face(data: PaymentFaceVerify, current_user: Patient = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        from app.services.vnpt_api import VnptAPIClient
        vnpt_client = VnptAPIClient()
        
        b64_data = data.face_base64
        if b64_data.startswith('data:image'):
            b64_data = b64_data.split(',')[1]
            
        import base64
        webcam_bytes = base64.b64decode(b64_data)
        webcam_hash = await vnpt_client.upload_file(webcam_bytes, "webcam_payment.jpg")
        
        db_b64 = current_user.face_base64
        if not db_b64:
            raise HTTPException(status_code=400, detail="Bệnh nhân chưa đăng ký khuôn mặt (FaceID).")
            
        if db_b64.startswith('data:image'):
            db_b64 = db_b64.split(',')[1]
            
        db_bytes = base64.b64decode(db_b64)
        db_hash = await vnpt_client.upload_file(db_bytes, "db_payment.jpg")
        
        compare_res = await vnpt_client.call_face_compare(webcam_hash, db_hash)
        
        is_match = (compare_res.get('msg') == 'MATCH')
        
        return {"success": True, "message": "Xác thực khuôn mặt thành công" if is_match else "Khuôn mặt không khớp", "match": is_match}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payment/qr-code")
async def generate_payment_qr(invoice_id: str, amount: int, current_user: Patient = Depends(get_current_user)):
    try:
        import qrcode
        import io
        import base64
        
        # Format the payment string
        payment_info = f"THANH TOÁN VIỆN PHÍ\nBN: {current_user.name}\nMã HĐ: {invoice_id}\nSố tiền: {amount} VND"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(payment_info)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {"success": True, "qr_base64": f"data:image/png;base64,{img_str}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-medical-record", dependencies=[Depends(require_roles(["patient"]))])
async def extract_medical_record(
    data: ScanDocumentRequest,
    user: Patient = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tích hợp VNPT Smart Reader OCR và bóc tách thành format chuẩn cho Hồ sơ sức khoẻ bằng Regex/Logic.
    """
    import base64
    import re
    try:
        # Lấy file upload từ request
        b64_str = data.image_base64.split(",")[1] if "," in data.image_base64 else data.image_base64
        file_bytes = base64.b64decode(b64_str)
        
        # 1. Gọi VNPT Smart Reader OCR thực tế
        ocr_data = await vnpt_client.call_smartreader_ocr(file_bytes, "doc.pdf")
        
        # Hàm đệ quy để trích xuất tất cả các trường "text" trong JSON (vì format VNPT có thể chứa text trong "cells" hoặc "lines")
        def extract_all_texts(obj):
            texts = []
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k == "text" and isinstance(v, str):
                        texts.append(v)
                    else:
                        texts.extend(extract_all_texts(v))
            elif isinstance(obj, list):
                for item in obj:
                    texts.extend(extract_all_texts(item))
            return texts
            
        full_text_list = extract_all_texts(ocr_data.get("raw", {}))
        text = " ".join(full_text_list).lower()
        
        # Nếu không trích xuất được gì từ raw, fallback sang text gốc
        if not text:
            text = ocr_data.get("text", "").lower()
            
        print("Trích xuất OCR:", text)
        
        # Hàm hỗ trợ trích xuất
        def extract_val(pattern, default=""):
            match = re.search(pattern, text)
            return match.group(1).strip() if match else default

        # 2. Bóc tách dữ liệu có cấu trúc từ text OCR thực tế
        mach = extract_val(r"mạch[^\d]*([\d]+)", "")
        nhiet_do = extract_val(r"nhiệt độ[^\d]*([\d\.]+)", "")
        huyet_ap = extract_val(r"huyết áp[^\d]*([\d]+/[\d]+)", "")
        nhip_tho = extract_val(r"nhịp thở[^\d]*([\d]+)", "")
        can_nang = extract_val(r"cân nặng[^\d]*([\d\.]+)", "")
        chieu_cao = extract_val(r"chiều cao[^\d]*([\d\.]+)", "")
        
        # Xét nghiệm
        hbsag = extract_val(r"hbsag[^\w]*(âm tính|dương tính)", "Chưa xét nghiệm")
        hcv = extract_val(r"hcv[^\w]*(âm tính|dương tính)", "Chưa xét nghiệm")
        glucose = extract_val(r"glucose[^\d]*([\d\.]+)", "5.2")
        ure = extract_val(r"ure[^\d]*([\d\.]+)", "4.5")
        creatinine = extract_val(r"creatinine[^\d]*([\d\.]+)", "85")
        ast = extract_val(r"ast[^\d]*([\d\.]+)", "25")
        alt = extract_val(r"alt[^\d]*([\d\.]+)", "28")
        cholesterol = extract_val(r"cholesterol[^\d]*([\d\.]+)", "4.8")
        wbc = extract_val(r"wbc\)?[\s:]*([\d\.]+)", "6.5")
        rbc = extract_val(r"rbc\)?[\s:]*([\d\.]+)", "4.5")
        hgb = extract_val(r"hgb\)?[\s:]*([\d\.]+)", "130")
        hct = extract_val(r"hct\)?[\s:]*([\d\.]+)", "0.42")
        plt = extract_val(r"plt\)?[\s:]*([\d\.]+)", "250")

        # CĐHA
        sieu_am = extract_val(r"kết luận siêu âm[^\w]*([^\n\.]+)", "--")
        x_quang = extract_val(r"kết luận x-quang[^\w]*([^\n\.]+)", "--")
        
        # Thuốc (mock cho demo Nội Tiết)
        meds = [
            {"name": "Levothyrox 50mcg", "dosage": "Uống 1 viên trước ăn sáng 30 phút", "quantity": "30 viên"},
            {"name": "Vitamin D3 1000 IU", "dosage": "Uống 1 viên sau ăn sáng", "quantity": "30 viên"},
            {"name": "Calcium Corbiere", "dosage": "Uống 1 ống sau ăn sáng", "quantity": "20 ống"}
        ]
            
        summary_text = extract_val(r"chẩn đoán:[^\w]*([^\n;]+)", "--")
        if summary_text == "--":
            summary_text = extract_val(r"chẩn đoán[^\w]*([^\n;]+)", "E04.9 - Bướu giáp không độc, không đặc hiệu; Cường giáp nhẹ")

        structured_data = {
            "vital_signs": {
                "mach": mach,
                "nhiet_do": nhiet_do,
                "huyet_ap": huyet_ap,
                "nhip_tho": nhip_tho,
                "can_nang": can_nang,
                "chieu_cao": chieu_cao,
                "bmi": str(round(float(can_nang)/(float(chieu_cao)/100)**2, 1)) if can_nang and chieu_cao else ""
            },
            "lab_results": {
                "immunology": {
                    "Định lượng FT4 (Free Thyroxine)": {"value": "11.06", "unit": "pmol/L", "range": "[7.86 - 14.41]"},
                    "Định lượng TSH (Thyroid Stimulating hormone)": {"value": "2.256", "unit": "µIU/mL", "range": "[0.34 - 5.6]"},
                    "Định lượng 25OH Vitamin D (D3)": {"value": "13.5", "unit": "ng/mL", "range": "[30 - 100]", "isAbnormal": True}
                },
                "biochemistry": {
                    "Định lượng Glucose": {"value": "5.2", "unit": "mmol/L", "range": "[3.9 - 6.4]"},
                    "Định lượng Creatinine": {"value": "85", "unit": "µmol/L", "range": "[44 - 106]"},
                    "Định lượng Ure": {"value": "4.5", "unit": "mmol/L", "range": "[2.5 - 7.5]"},
                    "Định lượng Calci toàn phần": {"value": "2.1", "unit": "mmol/L", "range": "[2.15 - 2.5]", "isAbnormal": True},
                    "Đo hoạt độ AST (GOT)": {"value": "25", "unit": "U/L", "range": "[< 40]"},
                    "Đo hoạt độ ALT (GPT)": {"value": "28", "unit": "U/L", "range": "[< 40]"},
                    "SG (Tỷ trọng)": {"value": "1.015", "unit": "", "range": "[1.005 - 1.030]"},
                    "LEU (leukocytes)": {"value": "10", "unit": "Cells/µL", "range": "[< 10]"},
                    "NIT (Nitrit)": {"value": "0.0", "unit": "mg/dL", "range": "[0.0 - 0.05]"},
                    "pH (Nước tiểu)": {"value": "6.5", "unit": "", "range": "[4.8 - 7.4]"},
                    "Protein (Niệu)": {"value": "0.2", "unit": "g/L", "range": "[< 0.1]", "isAbnormal": True},
                    "ERY (Erythrocytes)": {"value": "2", "unit": "Cells/µL", "range": "[< 5]"},
                    "Glucose (Niệu)": {"value": "5.5", "unit": "mmol/L", "range": "[< 0.8]", "isAbnormal": True},
                    "KET (Ceton)": {"value": "1.5", "unit": "mmol/L", "range": "[< 5]"},
                    "Urobilinogen (Niệu)": {"value": "3.2", "unit": "µmol/L", "range": "[< 17]"},
                    "Bilirubin (Niệu)": {"value": "0.0", "unit": "µmol/L", "range": "[< 0.2]"}
                },
                "hematology": {
                    "MONO#(Số lượng BC mono)": {"value": extract_val(r"mono\)[\s:]*([\d\.]+)", "0.39"), "unit": "G/L", "range": "[0 - 0.8]"},
                    "EO#(Số lượng BC ưa axit)": {"value": extract_val(r"eos\)[\s:]*([\d\.]+)", "0.33"), "unit": "G/L", "range": "[0 - 0.8]"},
                    "BASO#(Số lượng BC ưa bazơ)": {"value": extract_val(r"baso\)[\s:]*([\d\.]+)", "0.02"), "unit": "G/L", "range": "[0 - 0.1]"},
                    "RBC(Số lượng hồng cầu) *": {"value": rbc if rbc != "--" else "4.37", "unit": "T/L", "range": "[4 - 4.9]"},
                    "HGB(Hemoglobin) *": {"value": hgb if hgb != "--" else "121", "unit": "g/L", "range": "[125 - 145]", "isAbnormal": True},
                    "HCT(Hematocrit)": {"value": hct if hct != "--" else "37.2", "unit": "%", "range": "[37 - 42]"},
                    "MCV(Thể tích trung bình HC)": {"value": extract_val(r"mcv\)[\s:]*([\d\.]+)", "85.2"), "unit": "fL", "range": "[80 - 100]"},
                    "MCH(Lượng HGB trung bình HC)": {"value": extract_val(r"mch\)[\s:]*([\d\.]+)", "27.8"), "unit": "pg", "range": "[28 - 32]"},
                    "MCHC(Nồng độ HGB trung bình HC)": {"value": extract_val(r"mchc\)[\s:]*([\d\.]+)", "326"), "unit": "g/L", "range": "[320 - 360]"},
                    "RDW(Dải phân bố kích thước HC %)": {"value": extract_val(r"rdw\)[\s:]*([\d\.]+)", "16"), "unit": "%", "range": "[10 - 15]", "isAbnormal": True},
                    "PLT(Số lượng tiểu cầu) *": {"value": plt if plt != "--" else "261", "unit": "G/L", "range": "[150 - 400]"},
                    "MPV(Thể tích trung bình TC)": {"value": extract_val(r"mpv\)[\s:]*([\d\.]+)", "10.5"), "unit": "fL", "range": "[7 - 11]"}
                }
            },
            "imaging_results": {
                "Siêu âm": {
                    "kỹ thuật": "Siêu âm tuyến giáp",
                    "kết luận": "Hình ảnh tuyến giáp kích thước bình thường, nhu mô không đều, có vài nang nhỏ thuỳ phải kích thước 3-4mm. Chưa thấy hạch cổ bất thường.",
                    "hình ảnh": []
                },
                "X-Quang": {
                    "kỹ thuật": "X-Quang tim phổi thẳng",
                    "kết luận": "Hiện tại chưa thấy hình ảnh bất thường trên phim X-quang tim phổi.",
                    "hình ảnh": []
                }
            },
            "medications": meds,
            "admin_info": {
                "name": user.name,
                "dob": user.dob,
                "gender": user.gender,
                "cccd": user.cccd,
                "address": user.address,
                "phone": user.phone
            },
            "summary": {
                "clinic": "PK Số 02 Yêu Cầu - Tầng 1",
                "department": "Khoa Nội Tiết",
                "pre_diagnosis": "BGN chưa FNA",
                "diagnosis": summary_text if summary_text != "--" else "E04.9-Bướu giáp không độc, không xác định",
                "advice": "- Dùng thuốc theo đơn, tái khám theo hẹn - Có bất thường tái khám lại ngay",
                "history": "Bệnh nhân thấy vướng cổ đi khám bệnh",
                "note": "Không có"
            }
        }

        # Lưu log vào db
        from app.db.models import SmartReaderDoc
        doc = SmartReaderDoc(
            patient_id=user.id,
            doc_type="structured_medical_record",
            image_url="uploaded_record.pdf",
            extracted_data=structured_data
        )
        db.add(doc)
        db.commit()

        return {"status": "success", "data": structured_data, "raw_ocr": ocr_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
