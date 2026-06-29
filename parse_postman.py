import json, glob, sys

sys.stdout.reconfigure(encoding='utf-8')

for file in glob.glob('backend/mock_data/*.json'):
    print(f'\n--- {file} ---')
    try:
        with open(file, encoding='utf-8') as f:
            data = json.load(f)
            for item in data.get('item', []):
                def process_item(i):
                    req = i.get('request', {})
                    if not req: return
                    url = req.get('url', {}).get('raw', '') if isinstance(req.get('url'), dict) else req.get('url', '')
                    headers = req.get('header', [])
                    print(f"[{i.get('name')}] {req.get('method')} {url}")
                    for h in headers:
                        print(f"  H: {h.get('key')} = {h.get('value')}")
                if 'item' in item:
                    for subitem in item['item']: process_item(subitem)
                else: process_item(item)
    except Exception as e:
        print('Error:', e)
