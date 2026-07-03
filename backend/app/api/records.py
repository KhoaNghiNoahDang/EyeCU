from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient, ClinicalRecord, Medication
from app.core.security import require_roles
from app.services.dataset_reader import get_mock_json
from app.services.vnpt_api import vnpt_client

router = APIRouter()


@router.get(
    "/{patient_id}",
    dependencies=[Depends(require_roles(["doctor", "clinician", "admin"]))],
)
def get_patient_info(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    records = (
        db.query(ClinicalRecord).filter(ClinicalRecord.patient_id == patient_id).all()
    )

    return {
        "demographics": {"name": patient.name, "cccd": patient.cccd} if patient else {},
        "history": [
            {"date": r.created_at, "diagnosis": r.diagnosis, "notes": r.notes}
            for r in records
        ],
    }


@router.get(
    "/by-cccd/{cccd}",
    dependencies=[Depends(require_roles(["doctor", "clinician", "admin"]))],
)
def get_patient_by_cccd(cccd: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.cccd == cccd).first()
    if not patient:
        return {"status": "error", "message": "Không tìm thấy hồ sơ"}

    records = (
        db.query(ClinicalRecord)
        .filter(ClinicalRecord.patient_id == patient.id)
        .order_by(ClinicalRecord.created_at.desc())
        .all()
    )

    medications = []
    if records:
        medications = (
            db.query(Medication).filter(Medication.record_id == records[0].id).all()
        )

    return {
        "status": "success",
        "data": {
            "cccd": patient.cccd,
            "name": patient.name,
            "gender": patient.gender or "N/A",
            "dob": patient.dob or "N/A",
            "age": 55,
            "address": patient.address or patient.hometown or "N/A",
            "phone": patient.phone or "",
            "bloodType": patient.blood_type or "N/A",
            "blood_type": patient.blood_type or "N/A",
            "insurance": patient.bhxh_code or "",
            "insuranceExpiry": "31/12/2026",
            "emergencyContactName": patient.emergency_contact_name or "",
            "emergencyContactPhone": patient.emergency_contact_phone or "",
            "emergency_contact": {
                "name": patient.emergency_contact_name or "",
                "phone": patient.emergency_contact_phone or "",
                "relation": "Người thân"
            },
            "allergies": [a.strip() for a in patient.allergies.split(",")] if patient.allergies else [],
            "chronicConditions": [c.strip() for c in patient.chronic_conditions.split(",")] if patient.chronic_conditions else [],
            "currentMeds": [
                {"name": m.medicine_name, "dose": m.dosage, "freq": m.instructions}
                for m in medications
            ],
            "previousVisits": [
                {
                    "date": r.created_at.strftime("%d/%m/%Y"),
                    "dept": "Khoa Khám Bệnh",
                    "doctor": "Bác sĩ",
                    "diagnosis": r.diagnosis,
                    "status": "Hoàn tất" if r.is_signed else "Đang khám",
                }
                for r in records
            ],
            "vitalsLast": {
                "bp": "120/80",
                "hr": "75",
                "temp": "37.0",
                "spo2": "98",
                "weight": "65",
            },
            "emergencyContact": {
                "name": patient.emergency_contact_name or "",
                "relation": "Người thân",
                "phone": patient.emergency_contact_phone or "",
            },
        },
    }


@router.post(
    "/ocr", dependencies=[Depends(require_roles(["doctor", "clinician", "admin"]))]
)
async def extract_medical_record(file: UploadFile = File(...)):
    # Lý tưởng nhất: Đẩy file lên VNPT để lấy hash_string trước qua /addFile
    # Ở đây giả lập hash trả về:
    hash_string = "dummy_hash_for_now"

    # GỌI VNPT eKYC OCR THẬT qua httpx
    extracted_json = await vnpt_client.call_ekyc_ocr(hash_string)
    return {"data": extracted_json}
