import os
import random
import json

def get_random_image_from_dataset(dataset_type: str) -> bytes:
    """Đọc ảnh từ Dataset cục bộ để làm đầu vào cho API VNPT"""
    # Xử lý đường dẫn tương đối (Từ thư mục app gọi ra ngoài datasets)
    base_path = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", dataset_type)
    os.makedirs(base_path, exist_ok=True)
    
    files = os.listdir(base_path)
    if not files:
        # Trả về dummy byte để không sập app nếu chưa copy dataset
        return b"dummy_image_data"
    
    chosen_file = random.choice(files)
    with open(os.path.join(base_path, chosen_file), "rb") as f:
        return f.read()

def get_mock_json(api_name: str) -> dict:
    """Fallback đọc file định dạng JSON chuẩn của VNPT API"""
    base_path = os.path.join(os.path.dirname(__file__), "..", "..", "mock_data")
    os.makedirs(base_path, exist_ok=True)
    file_path = os.path.join(base_path, f"{api_name}.json")
    
    if not os.path.exists(file_path):
        return {"status": "success", "message": "Dummy fallback data"}
        
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
