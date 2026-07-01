from sqlmodel import Session
from app.db.database import engine
from app.db.models import Patient
try:
  with Session(engine) as db:
    new_p = Patient(name='test_err', cccd='888888888888', phone='1', bhxh_code='', qr_token='1', emergency_contact_name='', emergency_contact_phone='', avatar_url='', cccd_front_url='', cccd_back_url='')
    db.add(new_p)
    db.commit()
    print("SUCCESS")
except Exception as e:
  print("ERROR:", e)
