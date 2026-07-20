import asyncio
from app.services.vnpt_api import vnpt_client
import json

async def main():
    out={}
    for f_name in ['xetnghiem_01_2303.pdf', 'xetnghiem_02_2303.pdf', 'xetnghiem_01_1612.pdf', 'xetnghiem_02_1612.pdf', 'mau_xet_nghiem_1.pdf', 'mau_xet_nghiem_2.pdf']:
        try:
            with open(f'../frontend/public/{f_name}', 'rb') as f: data=f.read()
            res = await vnpt_client.call_smartreader_ocr(data, 'doc.pdf')
            out[f_name] = res['text']
        except Exception as e:
            out[f_name] = str(e)
    with open('ocr_tests.json', 'w', encoding='utf-8') as f: json.dump(out, f, ensure_ascii=False, indent=2)

asyncio.run(main())
