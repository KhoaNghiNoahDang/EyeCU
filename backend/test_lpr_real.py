"""
test_lpr_real.py
=================
Script kiểm tra TOÀN BỘ luồng LPR thật với VNPT SmartVision.

Cách chạy (từ thư mục backend/):
    python test_lpr_real.py <đường_dẫn_ảnh.jpg>

Nếu không cung cấp ảnh, script sẽ tự tạo ảnh JPEG dummy để test kết nối API.
"""

import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

# Fix encoding cho Windows terminal
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()

TOKEN_ID  = os.getenv("VNPT_SMARTVISION_TOKEN_ID", "")
TOKEN_KEY = os.getenv("VNPT_SMARTVISION_TOKEN_KEY", "")
AUTH      = os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN", "")

HEADERS_WITH_AUTH = {
    "Token-id": TOKEN_ID,
    "Token-key": TOKEN_KEY,
    "Authorization": AUTH,
}

TIMEOUT = 20


def _check_env():
    missing = [k for k, v in {
        "VNPT_SMARTVISION_TOKEN_ID": TOKEN_ID,
        "VNPT_SMARTVISION_TOKEN_KEY": TOKEN_KEY,
        "VNPT_SMARTVISION_ACCESS_TOKEN": AUTH,
    }.items() if not v]
    if missing:
        print(f"❌ Thiếu biến môi trường: {missing}")
        print("   Hãy kiểm tra file backend/.env")
        sys.exit(1)
    print("✅ Biến môi trường SmartVision OK")


async def step1_upload(client: httpx.AsyncClient, image_bytes: bytes, filename: str) -> str | None:
    """Bước 1: Upload ảnh lên VNPT, lấy hash."""
    print(f"\n🔼 Bước 1: Upload ảnh '{filename}' ({len(image_bytes)} bytes)...")
    resp = await client.post(
        "https://api.idg.vnpt.vn/file-service/v1/addFile",
        headers=HEADERS_WITH_AUTH,
        files={"file": (filename, image_bytes, "image/jpeg")},
        data={"title": filename, "description": "EyeCU LPR test"},
        timeout=TIMEOUT,
    )
    print(f"   HTTP Status: {resp.status_code}")
    data = resp.json()
    print(f"   Response JSON: {data}")

    file_hash = data.get("object", {}).get("hash")
    if file_hash:
        print(f"   ✅ Hash nhận được: {file_hash}")
    else:
        print("   ❌ Không lấy được hash từ response!")
    return file_hash


async def step2_get_cdn_url(client: httpx.AsyncClient, file_hash: str) -> str | None:
    """Buoc 2: Lay signed CDN URL tu hash."""
    print(f"\n[+] Buoc 2: Lay CDN URL tu hash...")
    resp = await client.get(
        "https://api.idg.vnpt.vn/proxy-service/url-file",
        params={"hash": file_hash},
        headers={**HEADERS_WITH_AUTH, "Content-Type": "application/json"},
        timeout=TIMEOUT,
    )
    print(f"   HTTP Status: {resp.status_code}")
    data = resp.json()
    print(f"   Response (truncated): {str(data)[:300]}...")

    # VNPT tra ve object la string CDN URL truc tiep
    cdn_url = data.get("object")
    if isinstance(cdn_url, dict):
        cdn_url = cdn_url.get("url") or cdn_url.get("fileUrl")

    if cdn_url and isinstance(cdn_url, str):
        print(f"   [OK] CDN URL: {cdn_url[:80]}...")
    else:
        print("   [FAIL] Khong lay duoc CDN URL!")
    return cdn_url if isinstance(cdn_url, str) else None


async def step3_detect_vehicle(client: httpx.AsyncClient, cdn_url: str) -> dict:
    """Buoc 3: Goi SmartVision detect-vehicle voi CDN URL."""
    print(f"\n[>] Buoc 3: Nhan dien bien so xe...")
    resp = await client.post(
        "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
        json={"data": cdn_url},
        headers={**HEADERS_WITH_AUTH, "Content-Type": "application/json"},
        timeout=TIMEOUT,
    )
    print(f"   HTTP Status: {resp.status_code}")
    data = resp.json()

    # Parse cau truc that cua VNPT: object.message.info.lpr
    obj = data.get("object", {})
    info = obj.get("message", {}).get("info", {})
    lpr_list = info.get("lpr", [])
    lp_probs = info.get("lp_probs", [])
    vehicle_probs = info.get("vehicle_probs", [])

    # Chon bien so co do chinh xac cao nhat
    valid_plates = [
        (p, prob) for p, prob in zip(lpr_list, lp_probs)
        if p and p.strip()
    ]
    if valid_plates:
        best_plate, best_prob = max(valid_plates, key=lambda x: x[1])
    else:
        best_plate, best_prob = "Khong nhan ra bien so", 0

    print(f"\n  === KET QUA ===")
    print(f"  Bien so tot nhat : {best_plate}  (do chinh xac: {best_prob:.2%})")
    print(f"  Tat ca bien so phat hien: {[p for p in lpr_list if p]}")
    print(f"  So xe phat hien : {sum(1 for v in vehicle_probs if v > 0.5)}")

    if not valid_plates:
        # In raw response de debug khi khong co bien so
        print(f"\n  Raw response (de debug): {str(data)[:500]}")

    return {"plate": best_plate, "confidence": best_prob, "all_plates": lpr_list, "raw": data}


async def run_lpr_test(image_path: str | None = None):
    _check_env()

    # Chuẩn bị ảnh
    if image_path and os.path.exists(image_path):
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        filename = os.path.basename(image_path)
        print(f"📷 Sử dụng ảnh: {image_path}")
    else:
        # Tạo ảnh JPEG tối thiểu hợp lệ để test kết nối
        image_bytes = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD3,
            0xFF, 0xD9,
        ])
        filename = "test_lpr.jpg"
        print("📷 Dùng ảnh JPEG dummy (test kết nối API, không nhận được biển số thật)")

    async with httpx.AsyncClient() as client:
        try:
            # Bước 1
            file_hash = await step1_upload(client, image_bytes, filename)
            if not file_hash:
                print("\n❌ Test THẤT BẠI tại Bước 1 (upload). Kiểm tra Token-id/Token-key.")
                return

            # Bước 2
            cdn_url = await step2_get_cdn_url(client, file_hash)
            if not cdn_url:
                print("\n❌ Test THẤT BẠI tại Bước 2 (lấy CDN URL).")
                return

            # Bước 3
            result = await step3_detect_vehicle(client, cdn_url)
            print("\n✅ Test THÀNH CÔNG! API SmartVision LPR hoạt động bình thường.")

        except httpx.ConnectError:
            print("\n❌ Không thể kết nối tới VNPT API. Kiểm tra Internet.")
        except httpx.HTTPStatusError as e:
            print(f"\n❌ HTTP Error {e.response.status_code}: {e.response.text[:200]}")
        except Exception as e:
            print(f"\n❌ Lỗi không mong đợi: {type(e).__name__}: {e}")


if __name__ == "__main__":
    img = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(run_lpr_test(img))
