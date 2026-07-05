import sys
from app.db.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.models import HospitalFee, HospitalFeeItem, ClinicalRecord

with Session(engine) as session:
    res = session.execute(text("SELECT id, name, cccd FROM patients WHERE name ILIKE '%huyền%'")).fetchone()
    p_id, p_name, cccd = res
    print(f"Patient: {p_name} (ID: {p_id})")
    
    # Check clinical records
    records = session.execute(text("SELECT id, diagnosis, created_at FROM clinical_records WHERE patient_id = :pid ORDER BY created_at DESC"), {"pid": p_id}).fetchall()
    print("Records:", records)
    
    # Check fees
    fees = session.execute(text("SELECT id, record_id, total, status FROM hospital_fees WHERE patient_id = :pid"), {"pid": p_id}).fetchall()
    print("Fees:", fees)
