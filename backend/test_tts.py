import asyncio
import os
from app.services.vnpt_api import vnpt_client
from dotenv import load_dotenv

load_dotenv()

async def main():
    try:
        data = await vnpt_client.call_smartvoice_tts(
            "Đây là giọng đọc thử nghiệm",
            voice_model="books",
            voice_region="female_north_ngochoa"
        )
        print("Success! Audio length:", len(data))
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
