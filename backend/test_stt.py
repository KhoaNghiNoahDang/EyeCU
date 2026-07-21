import asyncio
import httpx
from app.services.vnpt_api import vnpt_client

async def main():
    # create a dummy wav file (1 sec silence)
    import wave
    with wave.open("dummy.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b'\x00' * 32000)
    
    with open("dummy.wav", "rb") as f:
        wav_bytes = f.read()

    res = await vnpt_client.call_smartvoice_stt(wav_bytes)
    print("STT Result:", res)

asyncio.run(main())
