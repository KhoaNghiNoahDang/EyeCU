from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import datetime

from app.db.database import get_db
from app.db.models import FunctionalRoom, ExaminationService, ClinicalRecord, Staff, Patient
from app.core.security import get_current_user

router = APIRouter()

class ServiceCreateReq(BaseModel):
    record_id: str
    room_ids: List[str]
    soape_data: Optional[dict] = None

@router.get("/rooms")
def get_rooms(db: Session = Depends(get_db)):
    rooms = db.query(FunctionalRoom).all()
    return {"rooms": rooms}

@router.get("/records/{record_id}")
def get_services(record_id: str, db: Session = Depends(get_db)):
    services = db.query(ExaminationService, FunctionalRoom).join(
        FunctionalRoom, ExaminationService.room_id == FunctionalRoom.id
    ).filter(ExaminationService.record_id == record_id).all()
    
    result = []
    for srv, room in services:
        result.append({
            "id": str(srv.id),
            "record_id": srv.record_id,
            "status": srv.status,
            "assigned_at": srv.assigned_at.isoformat() if srv.assigned_at else None,
            "completed_at": srv.completed_at.isoformat() if srv.completed_at else None,
            "room_name": room.name,
            "room_type": room.room_type,
            "floor": room.floor,
            "room_number": room.room_number
        })
    return {"services": result}


from fastapi import Request

@router.post("/assign")
def assign_services(req: ServiceCreateReq, request: Request, db: Session = Depends(get_db)):
    service_record_id = req.record_id
    if hasattr(req, "soape_data") and req.soape_data:
        try:
            doc_id = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    from jose import jwt
                    from app.core.config import settings
                    token_payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                    doc_id_str = token_payload.get("sub")
                    if doc_id_str:
                        import uuid
                        doc_id = str(uuid.UUID(doc_id_str))
                except Exception as e:
                    import logging
                    logging.warning(f"Could not parse token for doc_id: {e}")
                    
            if not doc_id:
                default_doctor = db.query(Staff).filter(Staff.role == "doctor").first()
                doc_id = default_doctor.id if default_doctor else None
            
            import uuid
            patient_uuid = uuid.UUID(req.record_id)
            encounter_uuid = str(uuid.uuid4())
            
            # Dummy encounter to satisfy foreign key
            from sqlalchemy import text
            try:
                db.execute(text("INSERT INTO encounters (id, patient_id) VALUES (:id, :pid)"), {"id": encounter_uuid, "pid": str(patient_uuid)})
                db.commit()
            except Exception as e:
                db.rollback()
                import logging
                logging.warning(f"Could not insert dummy encounter: {e}")

            soape = req.soape_data
            symptoms = soape.get("subjective", "")
            diagnosis = soape.get("assessment", "")
            notes = (
                f"Khám lâm sàng (O): {soape.get('objective', '')}\n"
                f"Xử trí (P): {soape.get('plan', '')}\n"
                f"Đánh giá lại (E): {soape.get('evaluation', '')}"
            )
            
            cr = ClinicalRecord(
                patient_id=patient_uuid,
                doctor_id=doc_id,
                symptoms=symptoms,
                diagnosis=diagnosis,
                notes=notes,
                is_signed=True,
                encounter_id=encounter_uuid
            )
            db.add(cr)
            db.commit()
            db.refresh(cr)
            service_record_id = str(cr.id)
        except Exception as e:
            import logging
            logging.error(f"Failed to create ClinicalRecord: {e}")

    for r_id in req.room_ids:
        srv = ExaminationService(
            record_id=service_record_id,
            room_id=r_id,
            status="pending"
        )
        db.add(srv)
    db.commit()
    return {"status": "success", "record_id": service_record_id}


@router.post("/{service_id}/complete")
def complete_service(service_id: str, db: Session = Depends(get_db)):
    srv = db.query(ExaminationService).filter(ExaminationService.id == service_id).first()
    if not srv:
        raise HTTPException(status_code=404, detail="Service not found")
    srv.status = "completed"
    srv.completed_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success"}


@router.get("/pending")
def get_pending_services(db: Session = Depends(get_db)):
    services = (
        db.query(ExaminationService, FunctionalRoom)
        .join(FunctionalRoom, ExaminationService.room_id == FunctionalRoom.id)
        .filter(ExaminationService.status == "pending")
        .order_by(ExaminationService.assigned_at.asc())
        .all()
    )

    # Cache ClinicalRecord and Patient lookups
    import uuid as _uuid
    cr_cache: dict = {}
    pt_cache: dict = {}

    result = []
    for srv, room in services:
        patient_name = "—"
        diagnosis = ""
        record_id_str = srv.record_id or ""
        
        # Try to resolve patient name via ClinicalRecord
        if record_id_str and record_id_str not in cr_cache:
            try:
                cr_uuid = _uuid.UUID(record_id_str)
                cr = db.query(ClinicalRecord).filter(ClinicalRecord.id == cr_uuid).first()
                cr_cache[record_id_str] = cr
            except Exception:
                cr_cache[record_id_str] = None
        
        cr = cr_cache.get(record_id_str)
        if cr:
            diagnosis = cr.diagnosis or ""
            pt_id_str = str(cr.patient_id) if cr.patient_id else None
            if pt_id_str and pt_id_str not in pt_cache:
                try:
                    pt = db.query(Patient).filter(Patient.id == cr.patient_id).first()
                    pt_cache[pt_id_str] = pt
                except Exception:
                    pt_cache[pt_id_str] = None
            pt = pt_cache.get(pt_id_str)
            if pt:
                patient_name = pt.name

        result.append({
            "id": str(srv.id),
            "record_id": record_id_str,
            "status": srv.status,
            "assigned_at": srv.assigned_at.isoformat() if srv.assigned_at else None,
            "room_name": room.name,
            "room_type": room.room_type,
            "floor": room.floor,
            "room_number": room.room_number,
            "patient_name": patient_name,
            "diagnosis": diagnosis
        })
    return {"services": result}
