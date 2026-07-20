import asyncio
from app.services.vnpt_api import vnpt_client

async def main():
    for f_name in ['donthuoc_2301.pdf', 'donthuoc_1612.pdf']:
        with open(f'../frontend/public/{f_name}', 'rb') as f:
            data = f.read()
        res = await vnpt_client.call_smartreader_ocr(data, 'doc.pdf')
        print(f"--- {f_name} ---")
        print(res['text'])

asyncio.run(main())
