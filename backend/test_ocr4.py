import asyncio
from app.services.vnpt_api import vnpt_client
import json

async def main():
    out = {}
    for f_name in ['donthuoc_2301.pdf', 'donthuoc_1612.pdf']:
        with open(f'../frontend/public/{f_name}', 'rb') as f:
            data = f.read()
        res = await vnpt_client.call_smartreader_ocr(data, 'doc.pdf')
        out[f_name] = res['text']
    with open('ocr_output3.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

asyncio.run(main())
