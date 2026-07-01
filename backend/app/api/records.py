from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, MedicalRecord
from app.core.security import require_roles
from app.services.dataset_reader import get_mock_json
from app.services.vnpt_api import vnpt_client

router = APIRouter()


@router.get("/{patient_id}", dependencies=[Depends(require_roles(["clinician"]))])
def get_patient_info(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.id == patient_id).first()
    records = (
        db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).all()
    )

    return {
        "demographics": {"name": patient.name, "cccd": patient.cccd} if patient else {},
        "history": [{"date": r.created_at, "soape": r.soape_note} for r in records],
    }


@router.post("/ocr", dependencies=[Depends(require_roles(["clinician"]))])
async def extract_medical_record(file: UploadFile = File(...)):
    # Lý tưởng nhất: Đẩy file lên VNPT để lấy hash_string trước qua /addFile
    # Ở đây giả lập hash trả về:
    hash_string = "dummy_hash_for_now"

    # GỌI VNPT eKYC OCR THẬT qua httpx
    extracted_json = await vnpt_client.call_ekyc_ocr(hash_string)
    return {"data": extracted_json}
