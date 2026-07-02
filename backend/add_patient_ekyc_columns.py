from sqlalchemy import text
from app.db.database import engine

def add_patient_ekyc_columns():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN dob VARCHAR(20);"))
            print("Column dob added successfully!")
        except Exception as e:
            print(f"Error adding dob: {e}")
            
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN address TEXT;"))
            print("Column address added successfully!")
        except Exception as e:
            print(f"Error adding address: {e}")
            
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN hometown TEXT;"))
            print("Column hometown added successfully!")
        except Exception as e:
            print(f"Error adding hometown: {e}")

if __name__ == "__main__":
    add_patient_ekyc_columns()
