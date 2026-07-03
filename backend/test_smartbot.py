import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("VNPT_SMARTBOT_ACCESS_TOKEN", "")
TOKEN_ID = os.getenv("VNPT_SMARTBOT_TOKEN_ID", "")
TOKEN_KEY = os.getenv("VNPT_SMARTBOT_TOKEN_KEY", "")

async def test_bot():
    payload = {
        "bot_id": "hackathon_bot",
        "sender_id": "test_patient",
        "text": "Xin chào",
        "input_channel": "livechat",
        "session_id": "test_patient",
        "metadata": {
            "button_variables": {
                "patient_id": "123",
                "patient_name": "Test"
            }
        }
    }
    
    auth_header = TOKEN if TOKEN.lower().startswith("bearer") else f"Bearer {TOKEN}"
    headers = {
        "Token-id": TOKEN_ID,
        "Token-key": TOKEN_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json",
    }
    
    print("Testing with DICT metadata...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://assistant-stream.vnpt.vn/v1/conversation", json=payload, headers=headers)
            print("Status code:", resp.status_code)
            print("Response:", resp.text)
    except Exception as e:
        print("Exception:", str(e))
        
    print("\nTesting with LIST metadata...")
    payload["metadata"] = {"button_variables": []}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://assistant-stream.vnpt.vn/v1/conversation", json=payload, headers=headers)
            print("Status code:", resp.status_code)
            print("Response:", resp.text)
    except Exception as e:
        print("Exception:", str(e))

asyncio.run(test_bot())
