"""
Script tạo dữ liệu mẫu (Seed Data) cho EyeCU.
Chạy 1 lần duy nhất sau khi khởi động:
  python seed_data.py
"""

import sys, os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session
from app.db.database import engine, Base
from app.db.models import (
    User,
    Ambulance,
    Department,
    ClinicalRecord,
    PatientsQueue,
    Medication,
    HospitalFee,
    HospitalFeeItem,
    FollowUp,
)
import uuid

Base.metadata.create_all(bind=engine)
db = Session(engine)


def seed():
    if db.query(User).count() == 0:
        seed_users_and_records(db)
    
    if db.query(HospitalFee).count() == 0:
        seed_fees_and_followups(db)
    
    print(" Seed Data thành công!\n")
    db.commit()

def seed_users_and_records(db):

    # ── 1. KHOA PHÒNG ─────────────────────────────────────────────────
    depts = [
        Department(id="ER", name="Khoa Cấp Cứu", total_beds=20, occupied_beds=14),
        Department(id="ICU", name="Hồi Sức Tích Cực", total_beds=10, occupied_beds=7),
        Department(id="CARDIO", name="Khoa Tim Mạch", total_beds=15, occupied_beds=9),
        Department(id="IT", name="Công nghệ thông tin", total_beds=0, occupied_beds=0),
        Department(id="EMS", name="Xe 115", total_beds=0, occupied_beds=0),
        Department(id="NOI", name="Khoa Nội", total_beds=25, occupied_beds=18),
    ]
    db.add_all(depts)
    db.flush()

    # ── 2. NGƯỜI DÙNG ─────────────────────────────────────────────────
    users = [
        User(
            id=uuid.uuid4(),
            role="admin",
            cccd="000000000001",
            name="Admin Hệ thống",
            bhxh_code="BH001",
            department_id="IT",
            is_online=True,
        ),
        User(
            id=uuid.uuid4(),
            role="clinician",
            cccd="000000000002",
            name="BS. Nguyễn Văn Ngữ",
            bhxh_code="BH002",
            department_id="ER",
            is_online=True,
        ),
        User(
            id=uuid.uuid4(),
            role="clinician",
            cccd="000000000003",
            name="BS. Trần Thị Mai",
            bhxh_code="BH003",
            department_id="ICU",
            is_online=False,
        ),
        User(
            id=uuid.uuid4(),
            role="ems",
            cccd="000000000004",
            name="Bác sĩ EMS Lê Văn Hùng",
            bhxh_code="BH004",
            department_id="EMS",
            is_online=True,
        ),
        User(
            id=uuid.uuid4(),
            role="patient",
            cccd="012345678901",
            name="Nguyễn Văn A",
            bhxh_code="BH100",
            department_id="NOI",
            is_online=True,
        ),
        User(
            id=uuid.uuid4(),
            role="patient",
            cccd="098765432100",
            name="Trần Thị Bình",
            bhxh_code="BH101",
            department_id="NOI",
            is_online=False,
        ),
    ]
    db.add_all(users)
    db.flush()

    # ── 3. XE CẤP CỨU ─────────────────────────────────────────────────
    ambulances = [
        Ambulance(
            id=uuid.uuid4(),
            plate_number="51A-999.11",
            status="critical",
            current_lat=10.7769,
            current_lng=106.7009,
        ),
        Ambulance(
            id=uuid.uuid4(),
            plate_number="51A-888.22",
            status="standby",
            current_lat=10.7800,
            current_lng=106.6950,
        ),
    ]
    db.add_all(ambulances)

    # RoomInfrastructure has been removed from models

    # ── 5. HỒ SƠ Y TẾ MẪU ───────────────────────────────────────────
    patient_a = next(u for u in users if u.cccd == "012345678901")
    doctor_1 = next(u for u in users if u.cccd == "000000000002")
    records = [
        ClinicalRecord(
            id=uuid.uuid4(),
            patient_id=patient_a.id,
            doctor_id=doctor_1.id,
            symptoms="Đau đầu, chóng mặt khi đứng dậy; huyết áp cao buổi sáng",
            diagnosis="Tăng huyết áp vô căn độ II",
            notes="Tái khám sau 7 ngày",
            is_signed=True,
        )
    ]
    db.add_all(queue)
    db.flush()

def seed_fees_and_followups(db):
    patient_a = db.query(User).filter(User.cccd == "012345678901").first()
    if not patient_a: return
    record_a = db.query(ClinicalRecord).filter(ClinicalRecord.patient_id == patient_a.id).first()
    if not record_a: return

    # -- 5.1 MEDICATIONS --
    meds = [
        Medication(
            record_id=record_a.id,
            medicine_name="Amlodipin",
            dosage="5mg — 1 viên/sáng",
            instructions="Uống sau ăn sáng, không ngưng thuốc đột ngột"
        ),
        Medication(
            record_id=record_a.id,
            medicine_name="Metformin",
            dosage="850mg — 2 viên/ngày",
            instructions="1 viên sáng, 1 viên tối sau ăn"
        ),
        Medication(
            record_id=record_a.id,
            medicine_name="Atorvastatin",
            dosage="20mg — 1 viên/tối",
            instructions="Uống trước khi ngủ"
        )
    ]
    db.add_all(meds)

    # -- 5.2 FOLLOW UP --
    followup = FollowUp(
        patient_id=patient_a.id,
        record_id=record_a.id,
        date="02/07/2026",
        time="09:00",
        department="Phòng khám số 3 — Khoa Nội",
        note="Tái khám sau 7 ngày · Đo HA tại nhà 3 lần/ngày · Mang kết quả xét nghiệm"
    )
    db.add(followup)

    # -- 5.3 HOSPITAL FEES --
    fee = HospitalFee(
        patient_id=patient_a.id,
        record_id=record_a.id,
        total=655000,
        status="paid"
    )
    db.add(fee)
    db.flush()

    fee_items = [
        HospitalFeeItem(fee_id=fee.id, name="Khám bệnh", amount=150000),
        HospitalFeeItem(fee_id=fee.id, name="Xét nghiệm sinh hóa", amount=320000),
        HospitalFeeItem(fee_id=fee.id, name="Thuốc theo đơn", amount=185000)
    ]
    db.add_all(fee_items)
    db.flush()

    db.commit()

    print(" Seed Data thành công!\n")
    print("=" * 48)
    print("  TÀI KHOẢN THỬ NGHIỆM (dùng CCCD để login)")
    print("=" * 48)
    print("  Role       | Tên                    | CCCD")
    print("-" * 48)
    print("  admin      | Admin Hệ thống          | 000000000001")
    print("  clinician  | BS. Nguyễn Văn Ngữ     | 000000000002")
    print("  clinician  | BS. Trần Thị Mai        | 000000000003")
    print("  ems        | Bác sĩ EMS Lê Văn Hùng | 000000000004")
    print("  patient    | Nguyễn Văn A            | 012345678901")
    print("  patient    | Trần Thị Bình           | 098765432100")
    print("=" * 48)
    print("  XE CẤP CỨU: 51A-999.11 (critical)  |  51A-888.22 (standby)")
    print("  Swagger UI: http://localhost:8000/docs")
    print("=" * 48)


if __name__ == "__main__":
    seed()
    db.close()
