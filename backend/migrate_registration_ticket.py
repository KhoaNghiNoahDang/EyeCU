from sqlmodel import SQLModel
from sqlalchemy import text
from app.db.database import engine
from app.db.models import RegistrationTicket, TicketServiceItem

def migrate():
    # Only create the new tables
    RegistrationTicket.__table__.create(engine, checkfirst=True)
    TicketServiceItem.__table__.create(engine, checkfirst=True)
    print("Migrated RegistrationTicket and TicketServiceItem tables successfully.")

if __name__ == "__main__":
    migrate()
