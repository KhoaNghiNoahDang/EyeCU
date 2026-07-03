import asyncio
from app.db.database import engine
from app.api.auth import get_me
from sqlalchemy.orm import Session
from app.db.models import Patient
import os

from dotenv import load_dotenv
load_dotenv()

def test_get_me():
    with Session(engine) as db:
        patient = db.query(Patient).filter(Patient.name == 'PHẠM THẢO NGUYÊN').first()
        res = get_me(current_user=patient, db=db)
        print(res)

test_get_me()
