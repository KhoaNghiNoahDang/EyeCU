import asyncio
import sys
import os
import base64
import httpx

sys.path.append(os.path.dirname(__file__))
from app.services.vnpt_api import VnptAPIClient
import json

async def test_lpr(image_path: str):
    print(f"📸 Đang đọc ảnh từ: {image_path}")
    
    # Kiem tra xem co phai la URL khong
    if image_path.startswith("http://") or image_path.startswith("https://"):
        img_url = image_path
    else:
        if not os.path.exists(image_path):
            print("❌ Không tìm thấy file ảnh!")
            return
            
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
            
        # Thử truyền dạng base64 (VNPT SmartVision có thể nhận Base64 Data URI)
        img_url = f"data:image/jpeg;base64,{b64}"
        print("⏳ Ảnh cục bộ được mã hóa thành Base64 để gửi lên VNPT...")

    client = VnptAPIClient()
    
    print("🔍 Đang phân tích biển số xe (SmartVision)...")
    result = await client.call_smartvision_detect_vehicle(img_url)
    
    print("\n================= KẾT QUẢ TỪ VNPT AI =================")
    print("Biển số trích xuất chính:", result.get("plate"))
    print("\nJSON Data chi tiết trả về từ VNPT:")
    print(json.dumps(result.get("raw", {}), indent=2, ensure_ascii=False))
    print("======================================================")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: docker compose exec backend python test_vnpt_lpr.py <ten_file_anh.jpg_hoac_URL>")
    else:
        asyncio.run(test_lpr(sys.argv[1]))
