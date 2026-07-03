import asyncio
import base64
import httpx
from sqlmodel import Session
from app.db.database import engine
from app.db.models import Staff
from app.services.vnpt_api import vnpt_client
from app.core.config import settings

async def main():
    with Session(engine) as db:
        staff = db.query(Staff).filter(Staff.name.ilike('%Nguyên%')).first()
        db_b64 = staff.face_base64
        if "," in db_b64:
            db_b64 = db_b64.split(",")[1]
        db_bytes = base64.b64decode(db_b64)
        hash1 = await vnpt_client.upload_file(db_bytes, "face1.jpg")
        
        payload = {"img": hash1, "client_session": "eyecu-face-2d"}
        
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(
                "https://api.idg.vnpt.vn/ai/v4/web/standard/face/liveness",
                json=payload,
                headers={
                    "Token-id": settings.VNPT_EKYC_TOKEN_ID,
                    "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
                    "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
                },
            )
            print("Status V4 Liveness:", resp.status_code)
            print("Response:", resp.text)

if __name__ == "__main__":
    asyncio.run(main())
