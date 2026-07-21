"""Debug: Xem raw error chi tiet tu VNPT cho 1 anh dataset thuc te"""
import asyncio, httpx, sys, json, os, base64
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / "backend" / ".env")
except Exception:
    pass

from PIL import Image
import io

VNPT_EKYC_TOKEN_ID     = os.getenv("VNPT_EKYC_TOKEN_ID", "")
VNPT_EKYC_TOKEN_KEY    = os.getenv("VNPT_EKYC_TOKEN_KEY", "")
VNPT_EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN", "")
VNPT_SV_TOKEN_ID       = os.getenv("VNPT_SMARTVISION_TOKEN_ID", "")
VNPT_SV_TOKEN_KEY      = os.getenv("VNPT_SMARTVISION_TOKEN_KEY", "")
VNPT_SV_ACCESS_TOKEN   = os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN", "")

sv_token = VNPT_SV_ACCESS_TOKEN
if sv_token and not sv_token.lower().startswith("bearer"):
    sv_token = "Bearer " + sv_token

SV_H = {
    "Token-id": VNPT_SV_TOKEN_ID,
    "Token-key": VNPT_SV_TOKEN_KEY,
    "Authorization": sv_token,
    "Content-Type": "application/json",
}

def crop_plate(img_path, box):
    img = Image.open(img_path).convert("RGB")
    iw, ih = img.size
    cx, cy, w, h = box
    x1 = max(0, int((cx - w/2)*iw) - 5)
    y1 = max(0, int((cy - h/2)*ih) - 5)
    x2 = min(iw, int((cx + w/2)*iw) + 5)
    y2 = min(ih, int((cy + h/2)*ih) + 5)
    crop = img.crop((x1, y1, x2, y2))
    buf = io.BytesIO()
    crop.save(buf, "JPEG", quality=95)
    print(f"  Original: {iw}x{ih}, Crop: {crop.size[0]}x{crop.size[1]}")
    return buf.getvalue()

async def debug_one():
    # Lay 1 anh mau tu dataset
    img_path = Path(r".\dataset_raw\vn_license_plate\valid\images\clip10_new_1.jpg")
    label_path = Path(r".\dataset_raw\vn_license_plate\valid\labels\clip10_new_1.txt")
    
    print(f"Image: {img_path}")
    print(f"Label exists: {label_path.exists()}")
    
    # Doc box
    box = None
    if label_path.exists():
        for line in label_path.read_text().strip().splitlines():
            parts = line.strip().split()
            if len(parts) >= 5:
                box = tuple(float(x) for x in parts[1:5])
                print(f"Box (cx,cy,w,h): {box}")
                break
    
    # Crop
    if box:
        img_bytes = crop_plate(img_path, box)
    else:
        img_bytes = img_path.read_bytes()
    
    print(f"Image bytes to send: {len(img_bytes)} bytes")
    
    # Upload
    print("\n[1] Upload...")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            "https://api.idg.vnpt.vn/file-service/v1/addFile",
            headers={"Token-id": VNPT_EKYC_TOKEN_ID, "Token-key": VNPT_EKYC_TOKEN_KEY, "Authorization": VNPT_EKYC_ACCESS_TOKEN},
            files={"file": ("plate.jpg", img_bytes, "image/jpeg")},
            data={"title": "plate.jpg", "description": "debug"},
        )
        print(f"  HTTP {r.status_code}: {r.text[:200]}")
        file_hash = r.json().get("object", {}).get("hash") if r.status_code == 200 else None

    if not file_hash:
        print("  [FAIL] No hash")
        return

    # CDN URL
    print("\n[2] CDN URL...")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://api.idg.vnpt.vn/proxy-service/url-file", params={"hash": file_hash}, headers=SV_H)
        print(f"  HTTP {r.status_code}: {r.text[:200]}")
        obj = r.json().get("object")
        cdn_url = obj if isinstance(obj, str) and obj.startswith("http") else None

    if not cdn_url:
        print("  [FAIL] No CDN URL")
        return

    # detect-vehicle
    print("\n[3] detect-vehicle FULL RESPONSE...")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
            json={"data": cdn_url},
            headers=SV_H,
        )
        print(f"  HTTP {r.status_code}")
        raw = r.json()
        
        # Decode dataBase64
        if "dataBase64" in raw:
            inner = json.loads(base64.b64decode(raw["dataBase64"]).decode("utf-8"))
            print(f"  Decoded inner: {json.dumps(inner)[:500]}")
            obj = inner.get("object", {})
            status = obj.get("status")
            msg = obj.get("message", {})
            info = msg.get("info", {}) if isinstance(msg, dict) else {}
            print(f"  Status: {status}")
            print(f"  LPR: {info.get('lpr', [])}")
            print(f"  Full message keys: {list(msg.keys()) if isinstance(msg, dict) else msg}")
        else:
            print(f"  Raw: {json.dumps(raw)[:500]}")

    # Also test via backend endpoint to see exact error
    print("\n[4] Test qua Backend endpoint...")
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            "https://eyecu.onrender.com/api/ambulance/lpr/camera",
            files={"image": ("plate.jpg", img_bytes, "image/jpeg")},
        )
        print(f"  HTTP {r.status_code}")
        data = r.json()
        print(f"  error: {data.get('error')}")
        print(f"  plate: {data.get('plate')}")
        print(f"  raw.mode: {data.get('raw', {}).get('mode', 'N/A')}")

asyncio.run(debug_one())
