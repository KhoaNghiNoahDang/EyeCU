import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("backend/.env")
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    res = conn.execute(text("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'clinical_records' AND column_name = 'encounter_id'"))
    row = res.fetchone()
    print(f"encounter_id is_nullable: {row[0] if row else 'Column not found'}")
