import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine

def upgrade():
    with engine.begin() as conn:
        print("Adding avatar_url...")
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN avatar_url VARCHAR(255)"))
        except Exception as e:
            print("Already exists or error:", e)
            
        print("Adding cccd_front_url...")
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN cccd_front_url VARCHAR(255)"))
        except Exception as e:
            print("Already exists or error:", e)
            
        print("Adding cccd_back_url...")
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN cccd_back_url VARCHAR(255)"))
        except Exception as e:
            print("Already exists or error:", e)

if __name__ == "__main__":
    upgrade()
    print("Columns added successfully!")
