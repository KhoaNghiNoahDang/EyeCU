"""
Script tạo dữ liệu mẫu (Seed Data) cho EyeCU.
Chạy 1 lần duy nhất sau khi khởi động:
  python seed_data.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.db.models import User, Ambulance, Department, MedicalRecord, AdmissionQueue, RoomInfrastructure
import uuid

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    if db.query(User).count() > 0:
        print("✅ Dữ liệu mẫu đã tồn tại. Bỏ qua.")
        return

    # ── 1. KHOA PHÒNG ─────────────────────────────────────────────────
    depts = [
        Department(id="ER",     name="Khoa Cấp Cứu",    total_beds=20, occupied_beds=14),
        Department(id="ICU",    name="Hồi Sức Tích Cực", total_beds=10, occupied_beds=7),
        Department(id="CARDIO", name="Khoa Tim Mạch",    total_beds=15, occupied_beds=9),
        Department(id="IT",     name="Công nghệ thông tin", total_beds=0, occupied_beds=0),
        Department(id="EMS",    name="Xe 115",           total_beds=0,  occupied_beds=0),
        Department(id="NOI",    name="Khoa Nội",         total_beds=25, occupied_beds=18),
    ]
    db.add_all(depts)
    db.flush()

    # ── 2. NGƯỜI DÙNG ─────────────────────────────────────────────────
    users = [
        User(id=uuid.uuid4(), role="admin",     cccd="000000000001",
             name="Admin Hệ thống",        bhxh_code="BH001", department_id="IT",  is_online=True),
        User(id=uuid.uuid4(), role="clinician", cccd="000000000002",
             name="BS. Nguyễn Văn Ngữ",    bhxh_code="BH002", department_id="ER",  is_online=True),
        User(id=uuid.uuid4(), role="clinician", cccd="000000000003",
             name="BS. Trần Thị Mai",       bhxh_code="BH003", department_id="ICU", is_online=False),
        User(id=uuid.uuid4(), role="ems",       cccd="000000000004",
             name="Bác sĩ EMS Lê Văn Hùng", bhxh_code="BH004", department_id="EMS", is_online=True),
        User(id=uuid.uuid4(), role="patient",   cccd="012345678901",
             name="Nguyễn Văn A",           bhxh_code="BH100", department_id="NOI", is_online=True),
        User(id=uuid.uuid4(), role="patient",   cccd="098765432100",
             name="Trần Thị Bình",          bhxh_code="BH101", department_id="NOI", is_online=False),
    ]
    db.add_all(users)
    db.flush()

    # ── 3. XE CẤP CỨU ─────────────────────────────────────────────────
    ambulances = [
        Ambulance(id=uuid.uuid4(), plate_number="51A-999.11",
                  status="critical", current_lat=10.7769, current_lng=106.7009),
        Ambulance(id=uuid.uuid4(), plate_number="51A-888.22",
                  status="standby",  current_lat=10.7800, current_lng=106.6950),
    ]
    db.add_all(ambulances)

    # ── 4. HẠ TẦNG PHÒNG ─────────────────────────────────────────────
    rooms = [
        RoomInfrastructure(room_code="P.101", department_id="ER",
                           ventilator_status="Sẵn sàng", defibrillator_status="Đầy pin"),
        RoomInfrastructure(room_code="P.102", department_id="ER",
                           ventilator_status="Đang dùng", defibrillator_status="Đang sạc"),
    ]
    db.add_all(rooms)

    # ── 5. HỒ SƠ Y TẾ MẪU ───────────────────────────────────────────
    patient_a = next(u for u in users if u.cccd == "012345678901")
    records = [
        MedicalRecord(
            id=uuid.uuid4(),
            patient_id=patient_a.id,
            extracted_data={
                "Glucose":     {"value": "7.8", "unit": "mmol/L", "ref": "< 6.4", "status": "high"},
                "Cholesterol": {"value": "5.9", "unit": "mmol/L", "ref": "< 5.2", "status": "warn"},
                "Creatinine":  {"value": "92",  "unit": "µmol/L", "ref": "< 110", "status": "ok"},
                "HbA1c":       {"value": "6.8", "unit": "%",      "ref": "< 6.5", "status": "warn"},
            },
            soape_note=(
                "S: Bệnh nhân than đau đầu, chóng mặt.\n"
                "O: HA 160/100 mmHg, mạch 88l/p, nhịp thở 18l/p.\n"
                "A: Tăng huyết áp vô căn độ II.\n"
                "P: Amlodipine 5mg sáng, tái khám sau 2 tuần.\n"
                "E: Bệnh nhân hiểu và đồng ý điều trị."
            ),
        )
    ]
    db.add_all(records)

    # ── 6. HÀNG CHỜ MẪU ─────────────────────────────────────────────
    queue = [AdmissionQueue(id=uuid.uuid4(), patient_id=patient_a.id,
                            priority="critical", status="waiting")]
    db.add_all(queue)

    db.commit()

    print("✅ Seed Data thành công!\n")
    print("="*48)
    print("📋  TÀI KHOẢN THỬ NGHIỆM (dùng CCCD để login)")
    print("="*48)
    print("  Role       | Tên                    | CCCD")
    print("-"*48)
    print("  admin      | Admin Hệ thống          | 000000000001")
    print("  clinician  | BS. Nguyễn Văn Ngữ     | 000000000002")
    print("  clinician  | BS. Trần Thị Mai        | 000000000003")
    print("  ems        | Bác sĩ EMS Lê Văn Hùng | 000000000004")
    print("  patient    | Nguyễn Văn A            | 012345678901")
    print("  patient    | Trần Thị Bình           | 098765432100")
    print("="*48)
    print("🚑  XE CẤP CỨU: 51A-999.11 (critical)  |  51A-888.22 (standby)")
    print("🏥  Swagger UI: http://localhost:8000/docs")
    print("="*48)

if __name__ == "__main__":
    seed()
    db.close()
