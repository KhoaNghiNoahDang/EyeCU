import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("backend/.env")
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name FROM staffs"))
    for row in result:
        print(row)
