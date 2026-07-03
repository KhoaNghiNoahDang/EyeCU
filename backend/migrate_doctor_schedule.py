from sqlalchemy import text
from app.db.database import get_db

def run_migration():
    session_gen = get_db()
    session = next(session_gen)
    try:
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS doctor_schedules (
            id UUID PRIMARY KEY,
            doctor_id UUID REFERENCES staffs(id),
            date VARCHAR(20) NOT NULL,
            start_time VARCHAR(10) NOT NULL,
            end_time VARCHAR(10) NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
        """))
        print("DoctorSchedule table created or already exists.")
        
        session.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
        session.rollback()

if __name__ == "__main__":
    run_migration()
