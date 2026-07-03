import asyncio
import base64
import httpx
from sqlmodel import Session
from app.db.database import engine
from app.db.models import Staff
from app.core.config import settings

async def main():
    with Session(engine) as db:
        staff = db.query(Staff).filter(Staff.name.ilike('%Nguyên%')).first()
        db_b64 = staff.face_base64
        if "," in db_b64:
            db_b64 = db_b64.split(",")[1]
        
        payload = {
            "img_front": db_b64,
            "img_face": db_b64,
            "client_session": "eyecu-face-compare",
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.idg.vnpt.vn/ai/v1/face/compare",
                json=payload,
                headers={
                    "Token-id": settings.VNPT_EKYC_TOKEN_ID,
                    "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
                    "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
                },
            )
            print("Status Compare Base64:", resp.status_code)
            print("Response Compare:", resp.text)

if __name__ == "__main__":
    asyncio.run(main())
