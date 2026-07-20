import asyncio
from app.services.vnpt_api import vnpt_client, _smartvoice_headers
import httpx

async def main():
    import uuid
    with open("debug_full_audio.wav", "rb") as f:
        data = f.read()
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard",
            headers=_smartvoice_headers(),
            files={"audioFile": ("debug_full_audio.wav", data, "audio/wav")},
            data={"clientSession": str(uuid.uuid4()), "audioFormat": "wav"}
        )
        print(resp.json())

asyncio.run(main())
