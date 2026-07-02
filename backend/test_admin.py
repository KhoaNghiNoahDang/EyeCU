from sqlmodel import Session, select
from app.db.database import engine
from app.db.models import Staff

def test():
    with Session(engine) as session:
        user = session.exec(select(Staff).where(Staff.employee_id == "ADMIN001")).first()
        if user:
            print(f"Found: {user.employee_id}, role: {user.role}, name: {user.name}")
        else:
            print("ADMIN001 NOT FOUND IN DATABASE!")
            
        all_staff = session.exec(select(Staff)).all()
        print("All staff in DB:")
        for s in all_staff:
            print(f"- {s.employee_id} ({s.name})")

if __name__ == "__main__":
    test()
