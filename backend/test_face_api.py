import asyncio
import base64
import httpx
from app.core.config import settings

async def get_token():
    return {
        "Token-id": settings.VNPT_EKYC_TOKEN_ID,
        "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
        "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
    }

async def main():
    print(f"Token-id: {settings.VNPT_EKYC_TOKEN_ID}")
    
    # We will just hit an API that doesn't need images, or upload a dummy image
    # and hit the OCR API to see if token works.
    with open("app/main.py", "rb") as f:
        pass # Not an image
