import asyncio
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
        # Test Compare face
        resp1 = await client.post(
            "https://api.idg.vnpt.vn/ai/v1/web/face/compare",
            json={"img_front": h, "img_face": h, "client_session": "testsession", "token": "testtoken"},
            headers={
                "Token-id": EKYC_TOKEN_ID,
                "Token-key": EKYC_TOKEN_KEY,
                "Authorization": f"{EKYC_ACCESS_TOKEN}",
            }
        )
        print("Compare:", resp1.status_code)
        try:
            print("Compare JSON:", resp1.json())
        except Exception as e:
            print(e)

        # Test Liveness 3D with EKYC Token
        resp2 = await client.post(
            "https://api.idg.vnpt.vn/ai/v1/web/face/liveness-3d",
            json={"far_img": h, "near_img": h, "client_session": "testsession", "token": "testtoken"},
            headers={
                "Token-id": EKYC_TOKEN_ID,
                "Token-key": EKYC_TOKEN_KEY,
                "Authorization": f"{EKYC_ACCESS_TOKEN}",
            }
        )
        print("Liveness 3D:", resp2.status_code)
        try:
            print("Liveness 3D JSON:", resp2.json())
        except Exception as e:
            print(e)

asyncio.run(test())
