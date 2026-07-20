import sys
import os

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session
from app.db.database import engine
from app.db.models import Staff, Patient
from app.core.security import get_password_hash

def main():
    db = Session(engine)
    try:
        # Update Staff
        print("Đang kiểm tra mật khẩu Staff...")
        staffs = db.query(Staff).all()
        staff_updated = 0
        for staff in staffs:
            if staff.password_hash and not staff.password_hash.startswith("$2"):
                # It's a plain text password, we need to hash it
                pwd = staff.password_hash
                if len(pwd.encode('utf-8')) > 72:
                    pwd = pwd.encode('utf-8')[:72].decode('utf-8', 'ignore')
                staff.password_hash = get_password_hash(pwd)
                staff_updated += 1
        
        # Update Patient
        print("Đang kiểm tra mật khẩu Patient...")
        patients = db.query(Patient).all()
        patient_updated = 0
        for patient in patients:
            if patient.password_hash and not patient.password_hash.startswith("$2"):
                # It's a plain text password, we need to hash it
                pwd = patient.password_hash
                if len(pwd.encode('utf-8')) > 72:
                    pwd = pwd.encode('utf-8')[:72].decode('utf-8', 'ignore')
                patient.password_hash = get_password_hash(pwd)
                patient_updated += 1
                
        if staff_updated > 0 or patient_updated > 0:
            db.commit()
            print(f"Thành công! Đã mã hóa mật khẩu cho {staff_updated} nhân viên và {patient_updated} bệnh nhân cũ.")
        else:
            print("Không có mật khẩu thô nào cần mã hóa.")
            
    except Exception as e:
        print(f"Lỗi: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
