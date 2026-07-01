# conftest.py — Pytest configuration for EyeCU Backend
import os
import pytest

# Đặt DATABASE_URL về SQLite khi chạy test local (không cần PostgreSQL)
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_eyecu.db")
os.environ.setdefault("SECRET_KEY", "test_secret_key_for_ci_only")
os.environ.setdefault("VNPT_EKYC_TOKEN_ID", "")
os.environ.setdefault("VNPT_EKYC_TOKEN_KEY", "")
os.environ.setdefault("VNPT_EKYC_ACCESS_TOKEN", "")
os.environ.setdefault("VNPT_SMARTVISION_TOKEN_ID", "")
os.environ.setdefault("VNPT_SMARTVISION_TOKEN_KEY", "")
os.environ.setdefault("VNPT_SMARTVISION_ACCESS_TOKEN", "")
os.environ.setdefault("VNPT_VNFACE_ACCESS_TOKEN", "")
os.environ.setdefault("VNPT_SMARTBOT_TOKEN_ID", "")
os.environ.setdefault("VNPT_SMARTBOT_TOKEN_KEY", "")
os.environ.setdefault("VNPT_SMARTBOT_ACCESS_TOKEN", "")

def pytest_configure(config):
    config.addinivalue_line("markers", "asyncio: mark test as async")

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    from app.db.database import engine
    from app.db.models import Staff, Patient
    from sqlmodel import SQLModel, Session
    import uuid
    
    SQLModel.metadata.create_all(bind=engine)
    
    with Session(engine) as session:
        ops_id = uuid.UUID('12345678-1234-5678-1234-567812345678')
        doc_id = uuid.UUID('11111111-1111-1111-1111-111111111111')
        
        if not session.get(Staff, ops_id):
            ops = Staff(id=ops_id, role='ops', cccd='123456789012', name='Ops', employee_id='123456789000', password_hash='any')
            session.add(ops)
        if not session.get(Staff, doc_id):
            doc = Staff(id=doc_id, role='doctor', cccd='111111111111', name='Doc', employee_id='doc001', password_hash='any')
            session.add(doc)
        if not session.get(Patient, ops_id):
            pat = Patient(id=ops_id, name='Pat', cccd='000000000000', phone='000')
            session.add(pat)
        session.commit()
