import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.db.database import engine
from app.db.models import User, Department

def test_connection():
    print("Dang thu ket noi toi Supabase...")
    try:
        with Session(engine) as session:
            # Truy vấn thử bảng users
            statement = select(User).limit(5)
            users = session.exec(statement).all()
            
            print("\nKET NOI DATABASE THANH CONG!")
            print(f"Da tim thay {len(users)} nguoi dung trong bang 'users'.")
            
            for u in users:
                print(f"  - [{u.role.upper()}] {u.name} (CCCD: {u.cccd})")
                
            # Thử truy vấn bảng departments
            dept_stmt = select(Department).limit(5)
            depts = session.exec(dept_stmt).all()
            print(f"\nDa tim thay {len(depts)} khoa phong trong bang 'departments'.")
            for d in depts:
                print(f"  - {d.name}")
                
    except Exception as e:
        print("\nLOI KET NOI HOAC TRUY VAN!")
        print("Chi tiet loi:", str(e))

if __name__ == "__main__":
    test_connection()
