from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.core.security import create_access_token
from pydantic import BaseModel
from app.services.dataset_reader import get_mock_json

router = APIRouter()


class EkycLogin(BaseModel):
    cccd_base64: str = None
    face_base64: str = None


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    # Fallback/Test login
    user = db.query(User).filter(User.cccd == form_data.username).first()
    if not user:
        try:
            user = User(cccd=form_data.username, name="Test User", role="admin")
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            # Trường hợp race condition hoặc unique constraint — query lại
            db.rollback()
            user = db.query(User).filter(User.cccd == form_data.username).first()
            if not user:
                raise HTTPException(status_code=500, detail="Không thể tạo tài khoản")
    else:
        db.refresh(user)



    access_token = create_access_token(subject=user.id, role=user.role)
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@router.post("/login/ekyc")
def login_ekyc(data: EkycLogin, db: Session = Depends(get_db)):
    # Giả lập VNPT eKYC trả về
    ekyc_data = get_mock_json("ekyc_response")
    cccd_info = ekyc_data.get("cccd", "123456789")

    user = db.query(User).filter(User.cccd == cccd_info).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found from eKYC")

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
    }
