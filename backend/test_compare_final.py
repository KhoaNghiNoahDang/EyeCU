import asyncio
import base64
import httpx
from sqlmodel import Session
from app.db.database import engine
from app.db.models import Staff
from app.services.vnpt_api import vnpt_client
from app.core.config import settings
import uuid

async def main():
    with Session(engine) as db:
        staff = db.query(Staff).filter(Staff.name.ilike('%Nguyên%')).first()
        db_b64 = staff.face_base64
        if "," in db_b64:
            db_b64 = db_b64.split(",")[1]
        db_bytes = base64.b64decode(db_b64)
        hash1 = await vnpt_client.upload_file(db_bytes, "face1.jpg")
        
        # Payload with 'token' included!
        payload = {
            "token": str(uuid.uuid4()), # or just empty string
            "client_session": "WEB_macos_safari_1.0_1234_1581429032",
            "img_front": hash1,
            "img_face": hash1,
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.idg.vnpt.vn/ai/v1/web/face/compare", # Using Web URL just in case
                json=payload,
                headers={
                    "Token-id": settings.VNPT_EKYC_TOKEN_ID,
                    "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
                    "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
                    "mac-address": "TEST1"
                },
            )
            print("Status Compare with token in body:", resp.status_code)
            print("Response Compare:", resp.text)

if __name__ == "__main__":
    asyncio.run(main())
