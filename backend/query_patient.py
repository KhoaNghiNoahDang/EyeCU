import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.environ["DATABASE_URL"])
with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name, phone, gender, dob FROM patients;"))
    for row in result:
        print(row)
