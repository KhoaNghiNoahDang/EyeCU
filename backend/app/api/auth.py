from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Department
from app.core.security import create_access_token, get_current_user
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
    # Form_data.username used as employee_id for staff login
    user = db.query(User).filter(User.employee_id == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Sai mã nhân viên hoặc mật khẩu")

    # TODO: Verify password_hash
    # if not verify_password(form_data.password, user.password_hash): ...

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

    db.commit()
    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dept = None
    if current_user.department_id:
        dept = db.query(Department).filter(Department.id == current_user.department_id).first()
    
    title = "BS." if current_user.role in ["clinician", "ems"] else "ĐD." if current_user.role == "ops" else ""
    if current_user.role == "admin":
        title = ""

    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "type": "staff" if current_user.role != "patient" else "patient",
        "avatar": current_user.avatar_url,
        "department": dept.name if dept else None,
        "title": title,
        "employeeCode": current_user.employee_id,
        "role": current_user.role,
        "cccd": current_user.cccd
    }


@router.get("/staff")
def get_staff(db: Session = Depends(get_db)):
    staff_users = db.query(User).filter(User.role.in_(["clinician", "ops", "ems", "admin"])).all()
    result = []
    for u in staff_users:
        dept = None
        if u.department_id:
            dept = db.query(Department).filter(Department.id == u.department_id).first()
        
        title = "BS." if u.role in ["clinician", "ems"] else "ĐD." if u.role == "ops" else ""
        if u.role == "admin":
            title = ""

        result.append({
            "id": str(u.id),
            "name": u.name,
            "type": "staff",
            "avatar": u.avatar_url,
            "department": dept.name if dept else None,
            "title": title,
            "employeeCode": u.employee_id,
            "role": u.role,
            "cccd": u.cccd
        })
    return result
