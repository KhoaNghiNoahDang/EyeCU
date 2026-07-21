"""EyeCU API Diagnostic - Windows compatible version"""
import sys
import os
import asyncio
import json
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    print("[OK] dotenv loaded")
except ImportError:
    print("[WARN] python-dotenv not found, reading .env manually")
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        for line in open(env_path, encoding="utf-8").readlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"'))

import httpx

BACKEND_URL = "https://eyecu-r7ny.onrender.com"
LOCAL_URL   = "http://localhost:8000"

VNPT_EKYC_TOKEN_ID     = os.getenv("VNPT_EKYC_TOKEN_ID", "")
VNPT_EKYC_TOKEN_KEY    = os.getenv("VNPT_EKYC_TOKEN_KEY", "")
VNPT_EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN", "")
VNPT_SV_TOKEN_ID       = os.getenv("VNPT_SMARTVISION_TOKEN_ID", "")
VNPT_SV_TOKEN_KEY      = os.getenv("VNPT_SMARTVISION_TOKEN_KEY", "")
VNPT_SV_ACCESS_TOKEN   = os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN", "")

FAKE_JPG = bytes([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
])


def sep(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print(f"{'='*55}")


async def run():
    print("\n=== EyeCU API Diagnostic Tool ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"eKYC Token ID    : {'OK: ' + VNPT_EKYC_TOKEN_ID[:20] + '...' if VNPT_EKYC_TOKEN_ID else 'MISSING!'}")
    print(f"SmartVision Token: {'OK: ' + VNPT_SV_TOKEN_ID[:20] + '...' if VNPT_SV_TOKEN_ID else 'MISSING!'}")

    # ----------------------------------------------------------------
    # TEST 1: Backend reachable?
    # ----------------------------------------------------------------
    sep("TEST 1: Backend Health Check")
    active_url = None
    for url in [LOCAL_URL, BACKEND_URL]:
        try:
            async with httpx.AsyncClient(timeout=8) as c:
                r = await c.get(f"{url}/")
                if r.status_code == 200:
                    print(f"  [OK] {url} -> {r.json()}")
                    active_url = url
                    break
                else:
                    print(f"  [WARN] {url} -> HTTP {r.status_code}")
        except httpx.ConnectError:
            print(f"  [FAIL] {url} -> Khong ket noi duoc (server chua chay?)")
        except httpx.TimeoutException:
            print(f"  [WARN] {url} -> Timeout (server dang khoi dong?)")
        except Exception as e:
            print(f"  [FAIL] {url} -> {type(e).__name__}: {e}")

    if not active_url:
        print("  [WARN] Khong tim thay backend. Chi test VNPT truc tiep.")

    # ----------------------------------------------------------------
    # TEST 2: VNPT Upload File
    # ----------------------------------------------------------------
    sep("TEST 2: VNPT Upload File (buoc 1 cua LPR)")
    if not VNPT_EKYC_TOKEN_ID:
        print("  [SKIP] Khong co VNPT_EKYC_TOKEN_ID")
        file_hash = None
    else:
        headers = {
            "Token-id": VNPT_EKYC_TOKEN_ID,
            "Token-key": VNPT_EKYC_TOKEN_KEY,
            "Authorization": VNPT_EKYC_ACCESS_TOKEN,
        }
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(
                    "https://api.idg.vnpt.vn/file-service/v1/addFile",
                    headers=headers,
                    files={"file": ("test_plate.jpg", FAKE_JPG, "image/jpeg")},
                    data={"title": "test_plate.jpg", "description": "EyeCU diag"},
                )
                print(f"  HTTP Status: {r.status_code}")
                if r.status_code == 200:
                    data = r.json()
                    file_hash = data.get("object", {}).get("hash")
                    if file_hash:
                        print(f"  [OK] Upload thanh cong! Hash: {file_hash[:40]}...")
                    else:
                        print(f"  [WARN] Upload OK nhung khong co hash. Response: {json.dumps(data)[:200]}")
                        file_hash = None
                elif r.status_code == 401:
                    print("  [FAIL] 401 Unauthorized - TOKEN VNPT DA HET HAN!")
                    print("  -> Can dang nhap lai tai: https://vnpt.ai hoac https://idg.vnpt.vn")
                    print(f"  Response snippet: {r.text[:300]}")
                    file_hash = None
                elif r.status_code == 403:
                    print("  [FAIL] 403 Forbidden - Token khong co quyen upload")
                    file_hash = None
                else:
                    print(f"  [FAIL] HTTP {r.status_code}: {r.text[:200]}")
                    file_hash = None
        except httpx.TimeoutException:
            print("  [FAIL] Timeout khi ket noi VNPT API (>15s)")
            file_hash = None
        except Exception as e:
            print(f"  [FAIL] {type(e).__name__}: {e}")
            file_hash = None

    # ----------------------------------------------------------------
    # TEST 3: VNPT SmartVision detect-vehicle
    # ----------------------------------------------------------------
    sep("TEST 3: VNPT SmartVision - Nhan dien bien so (LPR)")
    if not file_hash:
        print("  [SKIP] Can file_hash tu buoc upload")
    else:
        sv_token = VNPT_SV_ACCESS_TOKEN
        if sv_token and not sv_token.lower().startswith("bearer"):
            sv_token = "Bearer " + sv_token

        sv_headers = {
            "Token-id": VNPT_SV_TOKEN_ID,
            "Token-key": VNPT_SV_TOKEN_KEY,
            "Authorization": sv_token,
            "Content-Type": "application/json",
        }

        # Step 3a: Get CDN URL
        cdn_url = None
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.get(
                    "https://api.idg.vnpt.vn/proxy-service/url-file",
                    params={"hash": file_hash},
                    headers=sv_headers,
                )
                print(f"  CDN URL fetch HTTP: {r.status_code}")
                data = r.json()
                obj = data.get("object")
                if isinstance(obj, str) and obj.startswith("http"):
                    cdn_url = obj
                    print(f"  [OK] CDN URL: {cdn_url[:70]}...")
                elif isinstance(obj, dict):
                    cdn_url = obj.get("url") or obj.get("fileUrl")
                    if cdn_url:
                        print(f"  [OK] CDN URL (dict): {cdn_url[:70]}...")
                    else:
                        print(f"  [WARN] CDN obj la dict nhung khong co url: {obj}")
                else:
                    print(f"  [WARN] CDN response khong hop le: {json.dumps(data)[:200]}")
        except Exception as e:
            print(f"  [FAIL] Lay CDN URL: {e}")

        # Step 3b: detect-vehicle
        if cdn_url:
            try:
                async with httpx.AsyncClient(timeout=15) as c:
                    r = await c.post(
                        "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
                        json={"data": cdn_url},
                        headers=sv_headers,
                    )
                    print(f"  detect-vehicle HTTP: {r.status_code}")
                    if r.status_code == 200:
                        data = r.json()
                        info_d = data.get("object", {}).get("message", {}).get("info", {})
                        lpr_list = info_d.get("lpr", [])
                        print(f"  [OK] SmartVision hoat dong!")
                        if lpr_list:
                            print(f"  Bien so doc duoc: {lpr_list}")
                        else:
                            print("  Bien so: [] (anh gia -> binh thuong, API van hoat dong)")
                        print(f"  Raw snippet: {json.dumps(data)[:300]}")
                    elif r.status_code == 401:
                        print("  [FAIL] 401 - SmartVision token het han!")
                        print(f"  Response: {r.text[:300]}")
                    else:
                        print(f"  [FAIL] HTTP {r.status_code}: {r.text[:200]}")
            except Exception as e:
                print(f"  [FAIL] detect-vehicle: {e}")
        else:
            print("  [SKIP] Khong co CDN URL")

    # ----------------------------------------------------------------
    # TEST 4: Backend LPR endpoint
    # ----------------------------------------------------------------
    sep("TEST 4: Backend /api/ambulance/lpr/camera")
    if not active_url:
        print("  [SKIP] Khong co backend")
    else:
        # Demo mode
        print(f"  [a] Demo mode (plate_hint=29A-02116)...")
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.post(
                    f"{active_url}/api/ambulance/lpr/camera",
                    data={"plate_hint": "29A-02116", "camera_id": "diag"},
                    files={"image": ("t.jpg", FAKE_JPG, "image/jpeg")},
                )
                print(f"  HTTP {r.status_code}: {r.json()}")
        except Exception as e:
            print(f"  [FAIL] {e}")

        # Real mode (no hint)
        print(f"\n  [b] Real mode (VNPT pipeline)...")
        try:
            async with httpx.AsyncClient(timeout=30) as c:
                r = await c.post(
                    f"{active_url}/api/ambulance/lpr/camera",
                    files={"image": ("real.jpg", FAKE_JPG, "image/jpeg")},
                    data={"camera_id": "diag"},
                )
                data = r.json()
                print(f"  HTTP {r.status_code}")
                print(f"  plate: {data.get('plate')}")
                print(f"  plates: {data.get('plates')}")
                print(f"  error: {data.get('error')}")
                if data.get("raw"):
                    mode = data.get("raw", {}).get("mode", "N/A")
                    print(f"  mode: {mode}")
        except Exception as e:
            print(f"  [FAIL] {e}")

    # ----------------------------------------------------------------
    # TEST 5: Active missions
    # ----------------------------------------------------------------
    sep("TEST 5: EmsMission dang active")
    if not active_url:
        print("  [SKIP] Khong co backend")
    else:
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.get(f"{active_url}/api/ems/dispatch_records?status=active")
                if r.status_code == 200:
                    data = r.json()
                    missions = data if isinstance(data, list) else data.get("data", [])
                    if missions:
                        print(f"  [OK] Co {len(missions)} xe dang active:")
                        for m in missions[:5]:
                            plate = m.get("plate") or m.get("plate_number", "?")
                            print(f"    - Bien so: {plate}")
                    else:
                        print("  [WARN] Khong co xe nao active!")
                        print("  -> LPR se tra ve matched=False du doc dung bien so")
                        print("  -> Can nhan 'Bat dau nhiem vu' tren app EMS truoc")
                else:
                    print(f"  HTTP {r.status_code}: {r.text[:150]}")
        except Exception as e:
            print(f"  [FAIL] {e}")

    # ----------------------------------------------------------------
    # Summary
    # ----------------------------------------------------------------
    sep("TONG KET")
    print("""
  Nguyen nhan pho bien khi LPR khong hoat dong:

  1. VNPT Token het han (test 2 tra 401)
     -> Refresh token tai: https://vnpt.ai hoac https://idg.vnpt.vn

  2. Khong co EmsMission active (test 5 = empty)
     -> Nhan "Bat dau nhiem vu" tren app EMS truoc khi quet

  3. Bien so OCR dang ky sai format
     -> Dam bao bien so trong he thong khop voi what VNPT doc

  4. Anh chup mo, goc nghieng
     -> VNPT SmartVision can anh ro, du sang, bien so chinh dien
""")


asyncio.run(run())
