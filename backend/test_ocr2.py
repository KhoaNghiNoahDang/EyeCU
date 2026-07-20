import asyncio
from app.services.vnpt_api import vnpt_client

async def main():
    with open('../frontend/public/donthuoc_2303.pdf', 'rb') as f:
        data = f.read()
    res = await vnpt_client.call_smartreader_ocr(data, 'doc.pdf')
    with open('ocr_output.txt', 'w', encoding='utf-8') as f:
        f.write(res['text'])

asyncio.run(main())
