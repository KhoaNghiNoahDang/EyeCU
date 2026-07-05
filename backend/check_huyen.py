import sys
from app.db.database import engine
from sqlalchemy.orm import Session
from sqlalchemy import text

with Session(engine) as session:
    res = session.execute(text("SELECT id, name, cccd FROM patients WHERE cccd = '001306013607'")).fetchall()
    print("Found patients by cccd:", res)
    res2 = session.execute(text("SELECT id, name, cccd FROM patients WHERE name ILIKE '%Trinh Khanh Huyen%'")).fetchall()
    print("Found patients no accents:", res2)
