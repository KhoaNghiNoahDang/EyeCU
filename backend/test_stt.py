import asyncio
from app.services.vnpt_api import vnpt_client

async def main():
    with open("test_audio.wav", "rb") as f:
        data = f.read()
    res = await vnpt_client.call_smartvoice_stt(data, "test.wav", "audio/wav")
    print(res)

asyncio.run(main())
