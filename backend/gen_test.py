# gen_test_tokens.py
from app.core.security import create_access_token

def generate_tokens():
    print("=== MÃ JWT TOKENS ĐỂ TEST PHÂN QUYỀN ===")
    
    # 1. Tạo token cho Admin
    admin_token = create_access_token(subject="CCCD_ADMIN_123", role="admin")
    print(f"\n🔑 ADMIN TOKEN:\nBearer {admin_token}")
    
    # 2. Tạo token cho Bác sĩ
    doctor_token = create_access_token(subject="CCCD_DOCTOR_456", role="doctor")
    print(f"\n🔑 DOCTOR TOKEN:\nBearer {doctor_token}")
    
    # 3. Tạo token cho Bệnh nhân
    patient_token = create_access_token(subject="CCCD_PATIENT_789", role="patient")
    print(f"\n🔑 PATIENT TOKEN:\nBearer {patient_token}")

if __name__ == "__main__":
    generate_tokens()