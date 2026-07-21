"""Debug: Hien thi full VNPT response va fix logic parse LPR rong"""
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

SV_H = {"Token-id": VNPT_SV_TOKEN_ID, "Token-key": VNPT_SV_TOKEN_KEY, "Authorization": sv_token, "Content-Type": "application/json"}

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
    return buf.getvalue(), crop.size

async def test(img_path, label_path, tag):
    print(f"\n{'='*55}\n  {tag}\n{'='*55}")
    box = None
    if label_path.exists():
        for line in label_path.read_text().strip().splitlines():
            parts = line.strip().split()
            if len(parts) >= 5:
                box = tuple(float(x) for x in parts[1:5])
                break

    if box:
        img_bytes, size = crop_plate(img_path, box)
        print(f"  Crop size: {size[0]}x{size[1]} px")
    else:
        img_bytes = img_path.read_bytes()
        print(f"  Full image: {len(img_bytes)} bytes")

    # Upload
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://api.idg.vnpt.vn/file-service/v1/addFile",
            headers={"Token-id": VNPT_EKYC_TOKEN_ID, "Token-key": VNPT_EKYC_TOKEN_KEY, "Authorization": VNPT_EKYC_ACCESS_TOKEN},
            files={"file": ("plate.jpg", img_bytes, "image/jpeg")},
            data={"title": "plate.jpg", "description": "debug"})
        file_hash = r.json().get("object", {}).get("hash") if r.status_code == 200 else None

    if not file_hash: print("  UPLOAD FAIL"); return

    # CDN
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://api.idg.vnpt.vn/proxy-service/url-file", params={"hash": file_hash}, headers=SV_H)
        obj = r.json().get("object")
        cdn_url = obj if isinstance(obj, str) and obj.startswith("http") else None

    if not cdn_url: print("  CDN FAIL"); return

    # detect-vehicle
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post("https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
            json={"data": cdn_url}, headers=SV_H)
        raw = r.json()
        if "dataBase64" in raw:
            inner = json.loads(base64.b64decode(raw["dataBase64"]).decode("utf-8"))
        else:
            inner = raw
        
        obj = inner.get("object", {})
        status = obj.get("status", "OK")
        msg = obj.get("message", {})
        info = msg.get("info", {}) if isinstance(msg, dict) else {}
        
        print(f"  API Status: {status}")
        print(f"  vehicle_probs: {info.get('vehicle_probs', [])[:3]}")
        print(f"  lpr raw: {info.get('lpr', [])}")
        print(f"  lp_probs: {info.get('lp_probs', [])[:3]}")
        print(f"  lp_coords: {info.get('lp_coords', [])[:2]}")
        
        # Hien thi tat ca keys trong info
        print(f"  info keys: {list(info.keys())}")
        
        # Ket luan
        lpr = [p for p in info.get("lpr", []) if p and p.strip()]
        if lpr:
            print(f"  => BIEN SO DOC DUOC: {lpr}")
        else:
            print(f"  => Phat hien xe nhung KHONG DOC DUOC bien so (lpr rong)")

async def main():
    # Test nhieu anh khac nhau
    base = Path(r".\dataset_raw\vn_license_plate\valid")
    imgs = list((base / "images").glob("*.jpg"))[:10]
    
    for img in imgs[:5]:
        label = base / "labels" / (img.stem + ".txt")
        await test(img, label, img.name)

asyncio.run(main())
