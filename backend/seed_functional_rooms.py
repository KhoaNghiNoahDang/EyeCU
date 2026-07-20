import os
import sys
from datetime import datetime
import uuid
from typing import Optional

# Thêm đường dẫn backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel, Field, Session, select
from dotenv import load_dotenv

# Tải env
load_dotenv()
database_url = os.environ.get("DATABASE_URL")

from sqlalchemy import create_engine

# Khởi tạo engine
engine = create_engine(database_url)

# ----------------- ĐỊNH NGHĨA MODEL MỚI ----------------- #

class FunctionalRoom(SQLModel, table=True):
    __tablename__ = "functional_rooms"
    __table_args__ = {'extend_existing': True}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=200)
    room_type: str = Field(max_length=50) # "khám bệnh", "xét nghiệm", "thăm dò chức năng"
    floor: int = Field(default=1)
    room_number: str = Field(max_length=50)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExaminationService(SQLModel, table=True):
    __tablename__ = "examination_services"
    __table_args__ = {'extend_existing': True}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    record_id: str = Field(max_length=100, index=True) # ID của lịch sử khám (hoặc số phiếu)
    room_id: uuid.UUID = Field(foreign_key="functional_rooms.id")
    status: str = Field(default="pending", max_length=50) # pending, completed
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    note: Optional[str] = None


def seed_rooms():
    print("Tạo bảng mới...")
    SQLModel.metadata.create_all(engine)
    print("Đã tạo bảng thành công.")

    print("Bắt đầu chèn dữ liệu phòng ban...")
    with Session(engine) as session:
        # Dữ liệu phòng
        rooms_data = [
            # Khám bệnh
            {"name": "CK Nội Tổng hợp", "room_type": "khám bệnh", "floor": 2, "room_number": "P. 201"},
            {"name": "CK Ngoại Tổng hợp", "room_type": "khám bệnh", "floor": 2, "room_number": "P. 202"},
            {"name": "CK Nhi", "room_type": "khám bệnh", "floor": 2, "room_number": "P. 203"},
            {"name": "CK Tai Mũi Họng 1", "room_type": "khám bệnh", "floor": 3, "room_number": "P. 301"},
            {"name": "CK Tai Mũi Họng 2", "room_type": "khám bệnh", "floor": 3, "room_number": "P. 301"},
            {"name": "CK Răng Hàm Mặt", "room_type": "khám bệnh", "floor": 3, "room_number": "P. 302"},
            {"name": "CK Mắt", "room_type": "khám bệnh", "floor": 3, "room_number": "P. 303"},
            {"name": "CK Da Liễu", "room_type": "khám bệnh", "floor": 3, "room_number": "P. 304"},
            
            # Xét nghiệm
            {"name": "Phòng Xét nghiệm Máu", "room_type": "xét nghiệm", "floor": 1, "room_number": "P. 101"},
            {"name": "Phòng Xét nghiệm Nước tiểu", "room_type": "xét nghiệm", "floor": 1, "room_number": "P. 102"},
            {"name": "Phòng Xét nghiệm Sinh hóa", "room_type": "xét nghiệm", "floor": 1, "room_number": "P. 103"},
            
            # Thăm dò chức năng
            {"name": "Phòng Siêu âm Tổng quát", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "P. 105"},
            {"name": "Phòng X-Quang", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "P. 106"},
            {"name": "Phòng Nội soi", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "P. 107"},
            {"name": "Phòng Điện tâm đồ (ECG)", "room_type": "thăm dò chức năng", "floor": 1, "room_number": "P. 108"},
        ]

        # Kiểm tra xem có dữ liệu chưa
        existing = session.exec(select(FunctionalRoom)).first()
        if not existing:
            for r in rooms_data:
                room = FunctionalRoom(**r)
                session.add(room)
            session.commit()
            print("Chèn dữ liệu phòng ban thành công!")
        else:
            print("Dữ liệu phòng ban đã tồn tại.")

if __name__ == "__main__":
    seed_rooms()
