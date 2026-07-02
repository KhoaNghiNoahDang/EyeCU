from sqlmodel import Session
from app.db.database import engine
from app.db.models import Staff

db = Session(engine)

admin = db.query(Staff).filter(Staff.employee_id == 'ADMIN001').first()
if not admin:
    admin = Staff(
        role='admin',
        cccd='123456789000',
        name='Quản trị viên',
        employee_id='ADMIN001',
        password_hash='password123'
    )
    db.add(admin)

doctor = db.query(Staff).filter(Staff.employee_id == 'DOC001').first()
if not doctor:
    doctor = Staff(
        role='clinician',
        cccd='123456789001',
        name='Bác sĩ Nguyễn Văn A',
        employee_id='DOC001',
        password_hash='password123'
    )
    db.add(doctor)

db.commit()
print("Staff created successfully!")
db.close()
