import sys
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import engine
from app.db.models import Patient, HospitalFee, HospitalFeeItem
import uuid
import datetime

INVOICES_TO_ADD = [
    ("Siêu âm Tim",               300000, "paid",    15),
    ("Chụp X-Quang Phổi",         150000, "paid",     7),
    ("Xét nghiệm sinh hóa máu",   200000, "paid",     2),
    ("Nội soi Dạ dày",            800000, "pending",  0),
]

def get_or_create_record(session, patient_id):
    res = session.execute(text("SELECT id FROM clinical_records WHERE patient_id = :pid"), {"pid": patient_id}).fetchone()
    if res:
        return res[0]
    # Create dummy encounter + record
    record_id   = str(uuid.uuid4())
    encounter_id = str(uuid.uuid4())
    doctor_id = session.execute(text("SELECT id FROM staffs LIMIT 1")).scalar()
    session.execute(text("""
        INSERT INTO encounters (id, patient_id, status, created_at)
        VALUES (:eid, :pid, 'completed', now())
    """), {"eid": encounter_id, "pid": patient_id})
    session.execute(text("""
        INSERT INTO clinical_records (id, patient_id, doctor_id, diagnosis, encounter_id, is_signed, created_at)
        VALUES (:id, :pid, :did, 'Khám định kỳ', :eid, false, now())
    """), {"id": record_id, "pid": patient_id, "did": doctor_id, "eid": encounter_id})
    session.flush()
    return record_id

def add_invoices_for_patient(patient_id, patient_name):
    # Use a brand-new session per patient to avoid connection timeout
    with Session(engine) as session:
        try:
            record_id = get_or_create_record(session, patient_id)
            for fee_name, amount, status, days_ago in INVOICES_TO_ADD:
                paid_at = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=days_ago)) if status == "paid" else None
                fee_id  = str(uuid.uuid4())
                session.execute(text("""
                    INSERT INTO hospital_fees (id, patient_id, record_id, total, status, paid_at)
                    VALUES (:fid, :pid, :rid, :total, :status, :paid_at)
                """), {"fid": fee_id, "pid": patient_id, "rid": record_id,
                       "total": amount, "status": status, "paid_at": paid_at})
                session.execute(text("""
                    INSERT INTO hospital_fee_items (id, fee_id, name, amount)
                    VALUES (:id, :fid, :name, :amt)
                """), {"id": str(uuid.uuid4()), "fid": fee_id, "name": fee_name, "amt": amount})
            session.commit()
            print(f"OK: {patient_name}")
        except Exception as e:
            session.rollback()
            print(f"FAIL: {patient_name} - {e}")

# Fetch all patient IDs first (quick query, short session)
with Session(engine) as session:
    patients = session.execute(text("SELECT id, name FROM patients")).fetchall()

print(f"Processing {len(patients)} patients...")
for p_id, p_name in patients:
    add_invoices_for_patient(str(p_id), p_name)

print("Done!")
