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
        # Test Face Matching 1:1
        resp2 = await client.post(
            "https://api.idg.vnpt.vn/ai/v1/web/face/compare",
            json={"img_front": h, "img_face": h},
            headers={
                "Token-id": EKYC_TOKEN_ID,
                "Token-key": EKYC_TOKEN_KEY,
                "Authorization": f"Bearer {EKYC_ACCESS_TOKEN}",
            }
        )
        print("Compare:", resp2.status_code, resp2.text)
        
        # Test Face Liveness 2D
        resp3 = await client.post(
            "https://api.idg.vnpt.vn/ai/v1/web/face/liveness",
            json={"img": h, "client_session": "test1"},
            headers={
                "Token-id": EKYC_TOKEN_ID,
                "Token-key": EKYC_TOKEN_KEY,
                "Authorization": f"Bearer {EKYC_ACCESS_TOKEN}",
            }
        )
        print("Liveness 2D:", resp3.status_code, resp3.text)

asyncio.run(test())
