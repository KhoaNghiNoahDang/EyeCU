from app.db.database import get_db
from app.db.models import Staff, DoctorSchedule
import uuid

def seed_data():
    session_gen = get_db()
    session = next(session_gen)
    
    # Create or find some doctors
    staff1 = session.query(Staff).filter(Staff.cccd == "000000000001").first()
    if not staff1:
        staff1 = Staff(
            role="clinician",
            cccd="000000000001",
            name="TS.BS Lâm Mỹ Hạnh",
            employee_id="BS_001",
            password_hash="hash"
        )
        session.add(staff1)
    
    staff2 = session.query(Staff).filter(Staff.cccd == "000000000002").first()
    if not staff2:
        staff2 = Staff(
            role="clinician",
            cccd="000000000002",
            name="TS.BS Lê Quang Toàn",
            employee_id="BS_002",
            password_hash="hash"
        )
        session.add(staff2)
        
    session.commit()
    session.refresh(staff1)
    session.refresh(staff2)

    # Seed DoctorSchedule
    sched_exist = session.query(DoctorSchedule).first()
    if not sched_exist:
        # We need a clinical record first
        import datetime
        today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        ds1 = DoctorSchedule(
            doctor_id=staff1.id,
            date=today,
            start_time="08:00",
            end_time="12:00"
        )
        ds2 = DoctorSchedule(
            doctor_id=staff2.id,
            date=today,
            start_time="13:30",
            end_time="17:00"
        )
        session.add_all([ds1, ds2])
        print("Seeded DoctorSchedules")
    
    session.commit()
    print("Seeding completed.")

if __name__ == "__main__":
    seed_data()
