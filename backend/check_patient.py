import sys
from app.db.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text

with Session(engine) as session:
    cccd = '037306006598'
    res = session.execute(text("SELECT id, name FROM patients WHERE cccd = :cccd"), {"cccd": cccd}).fetchone()
    if not res:
        print(f"Không tìm thấy CCCD {cccd}")
        sys.exit(0)
    
    p_id, p_name = res
    print(f"Tìm thấy: {p_name} (ID: {p_id})")
    
    fees = session.execute(text("SELECT id, total, status FROM hospital_fees WHERE patient_id = :pid"), {"pid": p_id}).fetchall()
    print(f"Hóa đơn của {p_name}:", fees)
    
    records = session.execute(text("SELECT id FROM clinical_records WHERE patient_id = :pid"), {"pid": p_id}).fetchall()
    print(f"Hồ sơ khám của {p_name}:", records)
