import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found!")
    exit(1)

engine = create_engine(db_url)

commands = [
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(10);",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob VARCHAR(20);",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS hometown TEXT;",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS issue_date VARCHAR(20);",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS issue_place TEXT;",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS valid_until VARCHAR(20);",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS characteristics TEXT;",
    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);",
]

for cmd in commands:
    with engine.begin() as conn:
        try:
            conn.execute(text(cmd))
            print(f"Executed: {cmd}")
        except Exception as e:
            print(f"Error on {cmd}: {e}")

