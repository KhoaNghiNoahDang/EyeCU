from sqlalchemy import text
from app.db.database import engine

def add_patient_columns():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN password_hash VARCHAR(255);"))
            print("Column password_hash added to patients successfully!")
        except Exception as e:
            print(f"Error adding password_hash: {e}")
            
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN face_base64 TEXT;"))
            print("Column face_base64 added to patients successfully!")
        except Exception as e:
            print(f"Error adding face_base64: {e}")

if __name__ == "__main__":
    add_patient_columns()
