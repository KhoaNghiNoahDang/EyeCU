from sqlalchemy import text
from app.db.database import engine

def add_column():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE staffs ADD COLUMN face_base64 TEXT;"))
            print("Column face_base64 added to staffs successfully!")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
