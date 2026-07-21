"""Test VNPT SmartVision LPR - su dung anh ambulance thuc te"""
import asyncio, httpx, sys, json, base64, os, urllib.request, io
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
except Exception:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    for line in open(env_path, encoding="utf-8").readlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"'))

VNPT_EKYC_TOKEN_ID     = os.getenv("VNPT_EKYC_TOKEN_ID", "")
VNPT_EKYC_TOKEN_KEY    = os.getenv("VNPT_EKYC_TOKEN_KEY", "")
VNPT_EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN", "")
VNPT_SV_TOKEN_ID       = os.getenv("VNPT_SMARTVISION_TOKEN_ID", "")
VNPT_SV_TOKEN_KEY      = os.getenv("VNPT_SMARTVISION_TOKEN_KEY", "")
VNPT_SV_ACCESS_TOKEN   = os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN", "")

sv_token = VNPT_SV_ACCESS_TOKEN
if sv_token and not sv_token.lower().startswith("bearer"):
    sv_token = "Bearer " + sv_token

EKYC_H = {
    "Token-id": VNPT_EKYC_TOKEN_ID,
    "Token-key": VNPT_EKYC_TOKEN_KEY,
    "Authorization": VNPT_EKYC_ACCESS_TOKEN,
}
SV_H = {
    "Token-id": VNPT_SV_TOKEN_ID,
    "Token-key": VNPT_SV_TOKEN_KEY,
    "Authorization": sv_token,
    "Content-Type": "application/json",
}


def decode_vnpt(data: dict) -> dict:
    """VNPT wraps response in dataBase64 - decode it"""
    if "dataBase64" in data:
        try:
            inner = json.loads(base64.b64decode(data["dataBase64"]).decode("utf-8"))
            return inner
        except Exception:
            pass
    return data


def generate_ambulance_jpeg():
    """Tao file JPEG don gian 320x100 co chu text bien so (PNG/JPEG hop le)"""
    # Su dung mot file JPEG 1x1 pixel hop le nhat - chi de test upload
    # JPEG 100x100 pixel den (generated minimal)
    jpeg_100x100 = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
        b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
        b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\x87'
        b'\xff\xc0\x00\x0b\x08\x00d\x00d\x01\x01\x11\x00\xff\xc4\x00\x1f'
        b'\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00'
        b'\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4'
        b'\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04'
        b'\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa'
        b'\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br'
        b'\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJ'
        b'STUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a'
        b'\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7'
        b'\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4'
        b'\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda'
        b'\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5'
        b'\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb'
        b'\xd2\x8a(\x03\xff\xd9'
    )
    return jpeg_100x100


async def full_pipeline_test(img_bytes: bytes, label: str):
    print(f"\n{'='*55}")
    print(f"  TEST: {label}")
    print(f"  Image size: {len(img_bytes)} bytes")
    print(f"{'='*55}")

    # Step 1: Upload
    print("\n[BUOC 1] Upload file...")
    file_hash = None
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            "https://api.idg.vnpt.vn/file-service/v1/addFile",
            headers={k: v for k, v in EKYC_H.items()},
            files={"file": ("plate.jpg", img_bytes, "image/jpeg")},
            data={"title": "plate.jpg", "description": "EyeCU LPR test"},
        )
        print(f"  HTTP {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            file_hash = data.get("object", {}).get("hash")
            print(f"  Hash: {file_hash}")
        else:
            print(f"  FAIL: {r.text[:200]}")
            return

    if not file_hash:
        print("  [FAIL] No hash")
        return

    # Step 2: CDN URL
    print("\n[BUOC 2] Lay CDN URL...")
    cdn_url = None
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://api.idg.vnpt.vn/proxy-service/url-file",
            params={"hash": file_hash},
            headers=SV_H,
        )
        print(f"  HTTP {r.status_code}")
        data = r.json()
        obj = data.get("object")
        if isinstance(obj, str) and obj.startswith("http"):
            cdn_url = obj
        elif isinstance(obj, dict):
            cdn_url = obj.get("url") or obj.get("fileUrl")
        print(f"  CDN URL: {cdn_url}")

    if not cdn_url:
        print("  [FAIL] No CDN URL")
        return

    # Step 3: detect-vehicle FULL DUMP
    print("\n[BUOC 3] detect-vehicle...")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
            json={"data": cdn_url},
            headers=SV_H,
        )
        print(f"  HTTP {r.status_code}")
        print(f"  FULL Response ({len(r.text)} chars):")
        print(f"  {r.text[:800]}")
        
        try:
            raw = r.json()
            keys = list(raw.keys())
            print(f"\n  Top-level keys: {keys}")
            
            # Phuong an A: co dataBase64
            if "dataBase64" in raw:
                print("\n  [!] Phat hien dataBase64 wrapper - dang giai ma...")
                inner = decode_vnpt(raw)
                print(f"  Decoded: {json.dumps(inner)[:400]}")
                obj = inner.get("object", {})
                msg = obj.get("message", {})
                info = msg.get("info", {}) if isinstance(msg, dict) else {}
                lpr = info.get("lpr", [])
                status = obj.get("status", inner.get("message", "?"))
                print(f"  Status: {status}")
                print(f"  LPR list: {lpr}")
            
            # Phuong an B: direct object
            elif "object" in raw:
                print("\n  Direct response voi 'object' key:")
                obj = raw.get("object", {})
                print(f"  object keys: {list(obj.keys()) if isinstance(obj, dict) else type(obj)}")
                msg = obj.get("message", {}) if isinstance(obj, dict) else {}
                info = msg.get("info", {}) if isinstance(msg, dict) else {}
                lpr = info.get("lpr", [])
                print(f"  LPR: {lpr}")
                print(f"  Full object: {json.dumps(obj)[:400]}")
            
            else:
                print(f"  [WARN] Unknown structure: {json.dumps(raw)[:400]}")
        except Exception as ex:
            print(f"  JSON error: {ex}")


async def main():
    print("=== VNPT SmartVision LPR Deep Diagnostic ===\n")
    
    # Test 1: JPEG co ban
    img1 = generate_ambulance_jpeg()
    await full_pipeline_test(img1, "JPEG 100x100 co ban")
    
    # Test 2: Thu download anh bien so xe cap cuu tu URL cong khai
    print("\n\n=== Thu download anh xe cap cuu thuc... ===")
    img2 = None
    test_urls = [
        "https://static.wixstatic.com/media/f4f7e3_5f5f5f5f.jpg",
        "https://i.imgur.com/KtqHKRK.jpg",  # sample plate
    ]
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
        for url in test_urls:
            try:
                r = await c.get(url)
                if r.status_code == 200 and len(r.content) > 1000:
                    img2 = r.content
                    print(f"  [OK] Tai duoc anh tu {url}: {len(img2)} bytes")
                    break
            except Exception:
                pass
    
    if img2:
        await full_pipeline_test(img2, "Anh bien so tu internet")

    # Test 3: Backend truc tiep voi anh
    print(f"\n\n{'='*55}")
    print("  TEST BACKEND ENDPOINT truc tiep")
    print(f"{'='*55}")
    img_test = generate_ambulance_jpeg()
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            "https://eyecu.onrender.com/api/ambulance/lpr/camera",
            files={"image": ("test.jpg", img_test, "image/jpeg")},
        )
        print(f"  Backend HTTP {r.status_code}")
        data = r.json()
        print(f"  plate: {data.get('plate')}")
        print(f"  error: {data.get('error')}")
        print(f"  raw: {json.dumps(data.get('raw', {}))[:400]}")

asyncio.run(main())
