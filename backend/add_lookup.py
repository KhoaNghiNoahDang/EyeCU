import codecs

with codecs.open('app/api/patient.py', 'r', 'utf-8') as f:
    content = f.read()

new_endpoint = '''@router.get("/lookup")
def lookup_patient(cccd: str, phone: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    patient = db.query(Patient).filter(Patient.cccd == cccd, Patient.phone == phone).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

'''

content = content.replace('router = APIRouter()\n', 'router = APIRouter()\n\n' + new_endpoint)

with codecs.open('app/api/patient.py', 'w', 'utf-8') as f:
    f.write(content)
