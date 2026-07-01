import asyncio
import httpx
import uuid
from dotenv import load_dotenv
import os

load_dotenv(override=True)

async def test_stt():
    url = "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard"
    token = os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN")
    auth_header = token if token and token.lower().startswith("bearer") else f"Bearer {token}"
    
    headers = {
        "Token-id": os.getenv("VNPT_SMARTVOICE_TOKEN_ID"),
        "Token-key": os.getenv("VNPT_SMARTVOICE_TOKEN_KEY"),
        "Authorization": auth_header,
    }
    dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            url,
            headers=headers,
            files={"audioFile": ("audio.wav", dummy_wav, "audio/wav")},
            data={"clientSession": str(uuid.uuid4())}
        )
        print("Status:", resp.status_code)
        print("Response:", resp.text)

asyncio.run(test_stt())
