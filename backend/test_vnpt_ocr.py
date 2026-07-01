import asyncio
import base64
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

EKYC_TOKEN_ID = os.getenv("VNPT_EKYC_TOKEN_ID")
EKYC_TOKEN_KEY = os.getenv("VNPT_EKYC_TOKEN_KEY")
EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN")

async def test():
    h = "idg20260701-557ec0e9-60cd-48c5-e063-63199f0a1ae3/IDG01_d3a94fd0-755e-11f1-a8d2-f75385b5732f"
    
    async with httpx.AsyncClient() as client:
        # Test OCR ID WITH Authorization
        resp2 = await client.post(
            "https://api.idg.vnpt.vn/ai/v1/web/ocr/id",
            json={"img_front": h, "step_id": 0, "type": 7, "client_session": "test_ocr", "token": ""},
            headers={
                "Token-id": EKYC_TOKEN_ID,
                "Token-key": EKYC_TOKEN_KEY,
                "Authorization": f"{EKYC_ACCESS_TOKEN}",
                "mac-address": "WEB-001",
                "Content-Type": "application/json"
            }
        )
        print("OCR with Auth and Payload:", resp2.status_code, resp2.text[:200])

asyncio.run(test())
