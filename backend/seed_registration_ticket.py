from app.db.database import get_db
from app.db.models import RegistrationTicket, TicketServiceItem, Patient
import uuid
import random

def seed():
    db = next(get_db())
    patients = db.query(Patient).all()
    if not patients:
        print("No patients found to seed.")
        return

    seeded_count = 0
    for patient in patients:
        existing = db.query(RegistrationTicket).filter(RegistrationTicket.patient_id == patient.id).first()
        if existing:
            continue
        
        # Generate a ticket code - using 8096980 as a base, appending a random digit or just giving 8096980 to the first one
        # Let's just use a random 7 digit number, but ensure one of them gets 8096980 if possible.
        # Actually, let's just use 8096980 + index
        ticket_code = str(8096980 + seeded_count)
        
        ticket = RegistrationTicket(
            patient_id=patient.id,
            ticket_code=ticket_code,
            patient_code=patient.cccd or str(uuid.uuid4())[:10],
            sequence_number=random.randint(1, 50),
            status="active"
        )
        db.add(ticket)
        db.flush()
        
        svc1 = TicketServiceItem(
            ticket_id=ticket.id,
            service_name="Khám Cấp cứu",
            room_location="Khoa Cấp cứu - Phòng A109 - Tầng 1 - nhà A2",
            order_index=1,
            status="pending"
        )
        svc2 = TicketServiceItem(
            ticket_id=ticket.id,
            service_name="Điện tâm đồ (ECG)",
            room_location="Phòng Điện tim - Tầng 1 - nhà A2",
            order_index=2,
            status="pending"
        )
        svc3 = TicketServiceItem(
            ticket_id=ticket.id,
            service_name="Xét nghiệm máu cơ bản",
            room_location="Phòng Lấy máu - Tầng 2 - nhà A1",
            order_index=3,
            status="pending"
        )
        
        db.add_all([svc1, svc2, svc3])
        seeded_count += 1
        
    db.commit()
    print(f"Seeded RegistrationTicket and Items for {seeded_count} patients.")

if __name__ == "__main__":
    seed()
