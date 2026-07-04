import asyncio
from app.services.vnpt_api import VnptAPIClient
from app.core.config import settings

async def main():
    client = VnptAPIClient()
    text = "Thông tin h? sõ: " + "a" * 2000
    res = await client.call_smartbot_conversation(text)
    print("Result:", res)

asyncio.run(main())
