from app.db.database import get_db
from app.db.models import Patient, FollowUp, Notification
import uuid
import datetime

def seed_data():
    session_gen = get_db()
    session = next(session_gen)
    
    patient = session.query(Patient).first()
    if not patient:
        print("No patient found to seed data.")
        return

    # Seed FollowUp
    fup_exist = session.query(FollowUp).filter(FollowUp.patient_id == patient.id).first()
    if not fup_exist:
        # We need a clinical record first
        from app.db.models import ClinicalRecord, Staff
        staff = session.query(Staff).first()
        if not staff:
            # create a dummy staff
            staff = Staff(
                role="clinician",
                cccd="999999999999",
                name="Bác sĩ Mẫu",
                employee_id="BS001",
                password_hash="hash"
            )
            session.add(staff)
            session.commit()
            session.refresh(staff)
        
        record = ClinicalRecord(
            patient_id=patient.id,
            doctor_id=staff.id,
            symptoms="Đau mắt",
            diagnosis="Viêm kết mạc"
        )
        session.add(record)
        session.commit()
        session.refresh(record)

        fup = FollowUp(
            patient_id=patient.id,
            record_id=record.id,
            date="2026-06-14",
            time="08:00",
            department="Khám bệnh theo yêu cầu",
            note="Mang theo đơn thuốc cũ"
        )
        session.add(fup)
        print("Seeded FollowUp")

    # Seed Notifications
    notif_exist = session.query(Notification).filter(Notification.patient_id == patient.id).first()
    if not notif_exist:
        n1 = Notification(
            patient_id=patient.id,
            title="Lịch hẹn tái khám",
            content=f"Lịch hẹn tái khám của {patient.name} tại Cơ sở Tứ Hiệp sẽ diễn ra vào lúc 08:00 Ngày 14/06/2026. Nhấn vào để đặt khám!",
            type="appointment_reminder"
        )
        n2 = Notification(
            patient_id=patient.id,
            title="Kết quả xét nghiệm",
            content=f"Đã có kết quả xét nghiệm máu của {patient.name}. Vui lòng kiểm tra hồ sơ sức khỏe.",
            type="result"
        )
        # Add a notification for Doctor
        n3 = Notification(
            staff_id=staff.id if 'staff' in locals() else None,
            title="Bệnh nhân mới",
            content=f"Bệnh nhân {patient.name} đã đặt lịch tái khám.",
            type="system"
        )
        session.add_all([n1, n2, n3])
        print("Seeded Notifications")
    
    session.commit()
    print("Seeding completed.")

if __name__ == "__main__":
    seed_data()
