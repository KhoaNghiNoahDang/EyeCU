import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")
if db_url:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS chronic_conditions VARCHAR;"))
        conn.commit()
    print("Column added successfully.")
else:
    print("DATABASE_URL not found.")
