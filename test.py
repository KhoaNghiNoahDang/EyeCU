import asyncio, sys, json
sys.path.append('c:\\Users\\Admin\\EyeCU\\backend')
from app.services.vnpt_api import _smartbot_headers
import httpx
async def test():
  try:
    payload = {'bot_id': 'hackathon_bot', 'sender_id': 'patient_001', 'text': 'xin chao', 'input_channel': 'livechat', 'session_id': 'patient_001', 'metadata': {'button_variables': []}}
    async with httpx.AsyncClient() as client:
      resp = await client.post('https://assistant-stream.vnpt.vn/v1/conversation', json=payload, headers=_smartbot_headers())
      with open('out.json', 'w', encoding='utf8') as f: json.dump(resp.json(), f, ensure_ascii=False)
  except Exception as e:
    with open('out.json', 'w', encoding='utf8') as f: f.write(str(e))
asyncio.run(test())
