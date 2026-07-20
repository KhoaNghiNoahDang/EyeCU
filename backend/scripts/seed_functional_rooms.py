import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import engine
from sqlmodel import Session
from app.db.models import FunctionalRoom

def seed_rooms():
    db = Session(engine)
    
    rooms_data = [
        # Khám bệnh
        {"name": "Phòng Khám Nội Chung 1", "room_type": "khám bệnh", "floor": 1, "room_number": "101"},
        {"name": "Phòng Khám Nội Chung 2", "room_type": "khám bệnh", "floor": 1, "room_number": "102"},
        {"name": "Phòng Khám Ngoại Khoa", "room_type": "khám bệnh", "floor": 1, "room_number": "103"},
        {"name": "Phòng Khám Tim Mạch", "room_type": "khám bệnh", "floor": 2, "room_number": "201"},
        {"name": "Phòng Khám Nội Tiết", "room_type": "khám bệnh", "floor": 2, "room_number": "202"},
        {"name": "Phòng Khám Thần Kinh", "room_type": "khám bệnh", "floor": 2, "room_number": "203"},
        {"name": "Phòng Khám Cơ Xương Khớp", "room_type": "khám bệnh", "floor": 2, "room_number": "204"},
        {"name": "Phòng Khám Tiêu Hóa", "room_type": "khám bệnh", "floor": 2, "room_number": "205"},
        {"name": "Phòng Khám Hô Hấp", "room_type": "khám bệnh", "floor": 2, "room_number": "206"},
        {"name": "Phòng Khám Tai Mũi Họng", "room_type": "khám bệnh", "floor": 3, "room_number": "301"},
        {"name": "Phòng Khám Răng Hàm Mặt", "room_type": "khám bệnh", "floor": 3, "room_number": "302"},
        {"name": "Phòng Khám Mắt", "room_type": "khám bệnh", "floor": 3, "room_number": "303"},
        {"name": "Phòng Khám Da Liễu", "room_type": "khám bệnh", "floor": 3, "room_number": "304"},
        {"name": "Phòng Khám Sản Phụ Khoa", "room_type": "khám bệnh", "floor": 3, "room_number": "305"},
        {"name": "Phòng Khám Nhi", "room_type": "khám bệnh", "floor": 3, "room_number": "306"},
        
        # Xét nghiệm
        {"name": "Phòng Lấy Máu Xét Nghiệm 1", "room_type": "xét nghiệm", "floor": 1, "room_number": "110"},
        {"name": "Phòng Lấy Máu Xét Nghiệm 2", "room_type": "xét nghiệm", "floor": 1, "room_number": "111"},
        {"name": "Phòng Lấy Mẫu Nước Tiểu / Phân", "room_type": "xét nghiệm", "floor": 1, "room_number": "112"},
        {"name": "Khoa Huyết Học - Truyền Máu", "room_type": "xét nghiệm", "floor": 4, "room_number": "401"},
        {"name": "Khoa Hóa Sinh", "room_type": "xét nghiệm", "floor": 4, "room_number": "402"},
        {"name": "Khoa Vi Sinh", "room_type": "xét nghiệm", "floor": 4, "room_number": "403"},
        {"name": "Khoa Giải Phẫu Bệnh", "room_type": "xét nghiệm", "floor": 4, "room_number": "404"},
        
        # Thăm dò chức năng & CĐHA
        {"name": "Phòng X-Quang 1", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "120"},
        {"name": "Phòng X-Quang 2", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "121"},
        {"name": "Phòng Siêu Âm Tổng Quát", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "122"},
        {"name": "Phòng Siêu Âm Tim - Mạch Máu", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "123"},
        {"name": "Phòng Siêu Âm Sản Khoa", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "124"},
        {"name": "Phòng Chụp Cắt Lớp Vi Tính (CT)", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "125"},
        {"name": "Phòng Chụp Cộng Hưởng Từ (MRI)", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "126"},
        {"name": "Phòng Nội Soi Dạ Dày - Đại Tràng", "room_type": "thăm dò chức năng", "floor": 2, "room_number": "220"},
        {"name": "Phòng Nội Soi Tai Mũi Họng", "room_type": "thăm dò chức năng", "floor": 3, "room_number": "320"},
        {"name": "Phòng Điện Tâm Đồ (ECG)", "room_type": "thăm dò chức năng", "floor": 2, "room_number": "221"},
        {"name": "Phòng Điện Não Đồ (EEG)", "room_type": "thăm dò chức năng", "floor": 2, "room_number": "222"},
        {"name": "Phòng Đo Chức Năng Hô Hấp", "room_type": "thăm dò chức năng", "floor": 2, "room_number": "223"},
        
        # Khác
        {"name": "Phòng Cấp Cứu", "room_type": "khác", "floor": 1, "room_number": "100"},
        {"name": "Phòng Tiểu Phẫu", "room_type": "khác", "floor": 1, "room_number": "104"},
        {"name": "Phòng Tiêm Chủng", "room_type": "khác", "floor": 3, "room_number": "330"},
        {"name": "Quầy Thuốc BHYT", "room_type": "khác", "floor": 1, "room_number": "150"},
        {"name": "Quầy Thuốc Dịch Vụ", "room_type": "khác", "floor": 1, "room_number": "151"}
    ]
    
    try:
        # Xóa dữ liệu cũ nếu muốn (hoặc skip)
        # db.query(FunctionalRoom).delete()
        
        count = 0
        for data in rooms_data:
            # Kiểm tra xem phòng đã tồn tại chưa
            existing = db.query(FunctionalRoom).filter(FunctionalRoom.name == data["name"]).first()
            if not existing:
                room = FunctionalRoom(**data)
                db.add(room)
                count += 1
        
        db.commit()
        print(f"Đã thêm thành công {count} phòng chức năng vào database!")
        
    except Exception as e:
        db.rollback()
        print(f"Lỗi khi thêm dữ liệu: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_rooms()
