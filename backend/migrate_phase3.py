from sqlalchemy import text
from app.db.database import get_db

def run_migration():
    session_gen = get_db()
    session = next(session_gen)
    try:
        # 1. Create notifications table
        session.execute(text("""
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY,
            patient_id UUID REFERENCES patients(id),
            staff_id UUID REFERENCES staffs(id),
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            is_read BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
        """))
        print("Notifications table created or already exists.")

        # 2. Add doctor_id to appointments
        try:
            session.execute(text("""
            ALTER TABLE appointments ADD COLUMN doctor_id UUID REFERENCES staffs(id);
            """))
            print("Added doctor_id to appointments.")
        except Exception as e:
            if 'already exists' in str(e) or 'DuplicateColumn' in str(e):
                print("doctor_id already exists in appointments.")
            else:
                # Ignore other errors like column already exists
                print(f"Failed to add doctor_id (might exist): {e}")

        # 3. Add status to follow_ups
        try:
            session.execute(text("""
            ALTER TABLE follow_ups ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
            """))
            print("Added status to follow_ups.")
        except Exception as e:
            print(f"Failed to add status (might exist): {e}")

        session.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
        session.rollback()

if __name__ == "__main__":
    run_migration()
