from app.db.database import get_db
from app.db.models import RegistrationTicket, TicketServiceItem, Patient
import uuid

def seed():
    db = next(get_db())
    # Find some patients to seed tickets for
    patient = db.query(Patient).first()
    if not patient:
        print("No patients found to seed.")
        return

    # Check if a ticket already exists
    existing = db.query(RegistrationTicket).filter(RegistrationTicket.patient_id == patient.id).first()
    if existing:
        print("Ticket already exists, skipping seed.")
        return
    
    # Create a registration ticket
    ticket = RegistrationTicket(
        patient_id=patient.id,
        ticket_code="80969800",
        patient_code="2303006123",
        sequence_number=18,
        status="active"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Create services for the ticket
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
    db.commit()
    print(f"Seeded RegistrationTicket and Items for patient {patient.name}")

if __name__ == "__main__":
    seed()
