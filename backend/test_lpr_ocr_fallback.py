"""Test OCR fallback cho LPR - kiem tra SmartReader co doc duoc bien so khong"""
import asyncio, httpx, sys, json, os, re
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

VNPT_SR_TOKEN_ID  = os.getenv("VNPT_SMARTREADER_TOKEN_ID", "")
VNPT_SR_TOKEN_KEY = os.getenv("VNPT_SMARTREADER_TOKEN_KEY", "")
VNPT_SR_TOKEN     = os.getenv("VNPT_SMARTREADER_ACCESS_TOKEN", "")
VNPT_EKYC_TOKEN_ID     = os.getenv("VNPT_EKYC_TOKEN_ID", "")
VNPT_EKYC_TOKEN_KEY    = os.getenv("VNPT_EKYC_TOKEN_KEY", "")
VNPT_EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN", "")

sr_token = VNPT_SR_TOKEN
if sr_token and not sr_token.lower().startswith("bearer"):
    sr_token = "Bearer " + sr_token


def extract_plate(text):
    patterns = [
        r'\b(\d{2}[A-Za-z]\d?\s*[-.]?\s*\d{3}[.\-]?\d{0,2})\b',
        r'\b(\d{2}[A-Za-z]\d?\s+\d{3}[.\-]?\d{0,2})\b',
    ]
    found = []
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            p = m.group(1).strip()
            if p not in found:
                found.append(p)
    return found


async def test_ocr_with_plate_image():
    print("=== Test SmartReader OCR voi anh bien so ===\n")

    # Thu tai anh xe cap cuu (bien so ro rang tu anh user)
    # Dung anh bien so xe ma user da chup
    test_images = [
        ("https://img.ntv.vn/thumb/1200/2021/04/21/xe-cap-cuu-bien-so-xanh.jpg", "Xe cap cuu bien xanh"),
        ("https://tse1.mm.bing.net/th?q=xe+cap+cuu+bien+so+29A", "Bing search plate"),
    ]
    
    img_bytes = None
    img_label = "Test"
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
        for url, label in test_images:
            try:
                r = await c.get(url, headers={"User-Agent": "Mozilla/5.0"})
                if r.status_code == 200 and len(r.content) > 5000:
                    img_bytes = r.content
                    img_label = label
                    print(f"[OK] Tai duoc anh: {label} ({len(img_bytes)} bytes)")
                    break
                else:
                    print(f"[SKIP] {url}: HTTP {r.status_code}, size {len(r.content)}")
            except Exception as ex:
                print(f"[FAIL] {url}: {ex}")

    if not img_bytes:
        print("[INFO] Khong tai duoc anh tu internet, dung anh local neu co")
        # Tim anh local
        for fname in ["test_plate.jpg", "ambulance.jpg", "plate.jpg"]:
            if os.path.exists(fname):
                img_bytes = open(fname, "rb").read()
                img_label = fname
                print(f"[OK] Dung anh local: {fname}")
                break

    if not img_bytes:
        print("[WARN] Khong co anh de test OCR")
        print("[INFO] Test regex thay the voi text mau:")
        sample_texts = [
            "29A 021.16",
            "29A-021.16",
            "Bien so: 29A02116",
            "29 A 021 16",
            "Plate: 51G12345",
        ]
        for text in sample_texts:
            plates = extract_plate(text)
            print(f"  Text: {text!r} -> Plates: {plates}")
        return

    # Upload len VNPT
    print(f"\n[BUOC 1] Upload anh '{img_label}' len VNPT...")
    file_hash = None
    async with httpx.AsyncClient(timeout=20) as c:
        h = {k: v for k, v in {
            "Token-id": VNPT_SR_TOKEN_ID,
            "Token-key": VNPT_SR_TOKEN_KEY,
            "Authorization": sr_token,
        }.items()}
        h_no_ct = {k: v for k, v in h.items()}
        r = await c.post(
            "https://api.idg.vnpt.vn/file-service/v1/addFile",
            headers=h_no_ct,
            files={"file": ("plate.jpg", img_bytes, "image/jpeg")},
            data={"title": "plate.jpg", "description": "LPR test"},
        )
        print(f"  HTTP {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            file_hash = data.get("object", {}).get("hash")
            print(f"  Hash: {file_hash}")

    if not file_hash:
        # Thu voi eKYC token
        print("  Thu lai voi eKYC token...")
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                "https://api.idg.vnpt.vn/file-service/v1/addFile",
                headers={
                    "Token-id": VNPT_EKYC_TOKEN_ID,
                    "Token-key": VNPT_EKYC_TOKEN_KEY,
                    "Authorization": VNPT_EKYC_ACCESS_TOKEN,
                },
                files={"file": ("plate.jpg", img_bytes, "image/jpeg")},
                data={"title": "plate.jpg", "description": "LPR OCR test"},
            )
            print(f"  HTTP {r.status_code}")
            if r.status_code == 200:
                data = r.json()
                file_hash = data.get("object", {}).get("hash")
                print(f"  Hash: {file_hash}")

    if not file_hash:
        print("  [FAIL] Khong upload duoc")
        return

    # OCR via SmartReader
    print(f"\n[BUOC 2] Goi SmartReader OCR...")
    h_sr = {
        "Token-id": VNPT_SR_TOKEN_ID,
        "Token-key": VNPT_SR_TOKEN_KEY,
        "Authorization": sr_token,
        "Content-Type": "application/json",
        "mac-address": "WEB-001",
    }
    import uuid
    payload = {
        "file_hash": file_hash,
        "file_type": "jpg",
        "token": "8928skjhfa89298jahga1771vbvb",
        "client_session": str(uuid.uuid4()),
        "details": True,
    }
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            "https://api.idg.vnpt.vn/rpa-service/aidigdoc/v1/ocr/scan",
            json=payload,
            headers=h_sr,
        )
        print(f"  HTTP {r.status_code}")
        print(f"  Response: {r.text[:500]}")
        if r.status_code == 200:
            data = r.json()
            text_result = ""
            obj = data.get("object", [])
            if isinstance(obj, list):
                for item in obj:
                    text_result += str(item.get("text", "")) + " "
            elif isinstance(obj, dict):
                text_result = obj.get("text", str(obj))
            print(f"  OCR Text: {text_result.strip()!r}")
            plates = extract_plate(text_result)
            print(f"  Bien so boc duoc: {plates}")

    print("\n[BUOC 3] Test regex bien so:")
    test_cases = [
        "29A 021.16", "29A-021.16", "29A02116", "51G-123.45",
        "Han su dung: 29A021.16 Ngay", "BIEN SO: 29A 021 16",
    ]
    for t in test_cases:
        print(f"  {t!r} -> {extract_plate(t)}")


asyncio.run(test_ocr_with_plate_image())
