import asyncio, sys, json
sys.path.append('c:\\Users\\Admin\\EyeCU\\backend')
from app.services.vnpt_api import vnpt_client
async def test():
  res = await vnpt_client.call_smartbot_conversation('xin chao')
  with open('out.json', 'w', encoding='utf8') as f: json.dump(res, f, ensure_ascii=False)
asyncio.run(test())
