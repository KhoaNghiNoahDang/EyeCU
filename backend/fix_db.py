import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
if not url:
    print("No DATABASE_URL found.")
    exit(1)

engine = create_engine(url)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS date VARCHAR(50);"))
    conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS time VARCHAR(50);"))
    conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_date VARCHAR(20);"))
    conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_time VARCHAR(20);"))
    conn.commit()
    print("Database updated!")
