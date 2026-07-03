import asyncio
import base64
from sqlmodel import Session
from app.db.database import engine
from app.db.models import Staff
from app.services.vnpt_api import vnpt_client

async def main():
    with Session(engine) as db:
        staff = db.query(Staff).filter(Staff.name.ilike('%Nguyên%')).first()
        db_b64 = staff.face_base64
        if "," in db_b64:
            db_b64 = db_b64.split(",")[1]
        db_bytes = base64.b64decode(db_b64)
        hash1 = await vnpt_client.upload_file(db_bytes, "face1.jpg")
        
        print("Testing Compare...")
        res = await vnpt_client.call_face_compare(hash1, hash1)
        print("Compare:", res)
        
        print("Testing OCR...")
        res2 = await vnpt_client.call_ekyc_ocr(hash1)
        print("OCR:", res2)

if __name__ == "__main__":
    asyncio.run(main())
