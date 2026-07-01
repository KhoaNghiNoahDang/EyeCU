import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

# Load env before importing app modules
load_dotenv(".env")

from app.services.vnpt_api import vnpt_client
import base64

async def test_all():
    print("=== BẮT ĐẦU TEST CÁC API VNPT ===")

    # 1. Test eKYC (CCCD)
    cccd_path = Path("datasets/ekyc_pool/id_01.jpg")
    if cccd_path.exists():
        print(f"\n[1] Đang test quét thẻ CCCD với file: {cccd_path.name}")
        with open(cccd_path, "rb") as f:
            file_bytes = f.read()
        
        # Gọi Upload (Mock VNPT)
        print(" -> Đang upload ảnh lên hệ thống...")
        img_hash = await vnpt_client.upload_file(file_bytes, "id_01.jpg")
        
        print(" -> Đang gọi OCR bóc tách thông tin...")
        ocr_result = await vnpt_client.call_ekyc_ocr(img_hash or "mock_hash")
        
        print(" Kết quả OCR:")
        print(f"   Họ tên: {ocr_result.get('name')}")
        print(f"   CCCD: {ocr_result.get('cccd')}")
        print(f"   Ngày sinh: {ocr_result.get('dob')}")
        print(f"   Địa chỉ: {ocr_result.get('address')}")
        print(f"   [RAW API RESPONSE]: {ocr_result.get('raw')}")
    else:
        print("\n[1] Không tìm thấy file id_01.jpg trong datasets/ekyc_pool")

    # 2. Test SmartVision (LPR)
    lpr_path = Path("datasets/lpr_pool/amb_01.jpg")
    if lpr_path.exists():
        print(f"\n[2] Đang test quét Biển số xe với file: {lpr_path.name}")
        with open(lpr_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
            
        print(" -> Đang gọi SmartVision LPR...")
        # API requires img_url or base64 usually, the code takes img_url string
        lpr_result = await vnpt_client.call_smartvision_detect_vehicle(img_b64)
        
        print(" Kết quả nhận diện Biển số:")
        print(f"   Biển số: {lpr_result.get('plate')}")
        print(f"   [RAW API RESPONSE]: {lpr_result.get('raw')}")
    else:
        print("\n[2] Không tìm thấy file amb_01.jpg trong datasets/lpr_pool")

if __name__ == "__main__":
    asyncio.run(test_all())
