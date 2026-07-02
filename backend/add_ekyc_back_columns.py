from sqlalchemy import text
from app.db.database import engine

def add_patient_ekyc_back_columns():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN issue_date VARCHAR(20);"))
            print("Column issue_date added successfully!")
        except Exception as e:
            print(f"Error adding issue_date: {e}")
            
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN issue_place TEXT;"))
            print("Column issue_place added successfully!")
        except Exception as e:
            print(f"Error adding issue_place: {e}")
            
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN valid_until VARCHAR(20);"))
            print("Column valid_until added successfully!")
        except Exception as e:
            print(f"Error adding valid_until: {e}")

        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN characteristics TEXT;"))
            print("Column characteristics added successfully!")
        except Exception as e:
            print(f"Error adding characteristics: {e}")

if __name__ == "__main__":
    add_patient_ekyc_back_columns()
