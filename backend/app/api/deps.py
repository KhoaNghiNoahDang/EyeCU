# File: app/api/deps.py
#
# Đây là file "Bảo vệ đứng cửa" của toàn bộ hệ thống.
# Mọi API cần xác thực hoặc phân quyền đều import từ đây.
#
# Có 2 loại "Bảo vệ":
#   1. get_current_user      → Trả về User object (query DB) — dùng khi cần thông tin chi tiết
#   2. get_current_token_data → Trả về TokenData (KHÔNG query DB) — nhanh, dùng để kiểm tra quyền
#
# Cách dùng phân quyền:
#   - require_roles(["doctor", "admin"]) → Cú pháp ngắn, dependencies=[...]
#   - RoleChecker(["doctor"])            → Cú pháp class, dùng khi cần lấy user_id trong hàm

from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import User

# ─────────────────────────────────────────────
# FastAPI tự đọc "Bearer <token>" từ Header của mỗi Request
# ─────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# ─────────────────────────────────────────────
# Schema: Dữ liệu được giải mã ra từ JWT Token
# ─────────────────────────────────────────────
class TokenData(BaseModel):
    user_id: str  # "sub" trong JWT — là UUID của User trong DB
    role: str     # "role" trong JWT — ví dụ: "patient", "doctor", "admin"


# ─────────────────────────────────────────────
# HÀM NỀN 1: Giải mã Token → TokenData (KHÔNG query DB)
# Dùng nội bộ bởi require_roles() và RoleChecker
# ─────────────────────────────────────────────
async def get_current_token_data(
    token: str = Depends(oauth2_scheme),
) -> TokenData:
    """
    Giải mã JWT và trả về TokenData (user_id + role).
    Không truy vấn database — nhanh và nhẹ.
    Phù hợp cho kiểm tra quyền thuần túy.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực danh tính (Token không hợp lệ hoặc đã hết hạn)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
        return TokenData(user_id=user_id, role=role)
    except JWTError:
        raise credentials_exception


# ─────────────────────────────────────────────
# HÀM NỀN 2: Giải mã Token → User object đầy đủ (CÓ query DB)
# Dùng khi API cần thông tin chi tiết như user.name, user.phone...
# ─────────────────────────────────────────────
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Giải mã JWT và truy vấn DB để lấy User object đầy đủ.
    Dùng khi handler cần truy cập các trường thông tin của người dùng.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực danh tính (Token không hợp lệ hoặc đã hết hạn)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


# ─────────────────────────────────────────────
# PHÂN QUYỀN — Cách 1: Hàm require_roles()
#
# Cú pháp dùng:
#   @router.get("/endpoint", dependencies=[Depends(require_roles(["doctor"]))])
#
# Ưu điểm: Ngắn gọn, không cần thêm tham số vào hàm handler
# ─────────────────────────────────────────────
def require_roles(allowed_roles: List[str]):
    """
    Dependency kiểm tra role từ JWT (không cần query DB).

    Ví dụ:
        @router.get("/map", dependencies=[Depends(require_roles(["doctor", "nurse", "admin"]))])
        async def view_ambulance_map():
            return {"msg": "Bản đồ xe cứu thương"}
    """
    async def role_checker(
        token_data: TokenData = Depends(get_current_token_data),
    ):
        if token_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cấm truy cập. API này chỉ dành cho: {', '.join(allowed_roles)}",
            )
        return token_data

    return role_checker


# ─────────────────────────────────────────────
# PHÂN QUYỀN — Cách 2: Class RoleChecker
#
# Cú pháp dùng:
#   allow_doctor = RoleChecker(["doctor", "admin"])
#   async def handler(current_user: TokenData = Depends(allow_doctor)):
#
# Ưu điểm: Lấy được thông tin user_id và role bên trong hàm handler
# ─────────────────────────────────────────────
class RoleChecker:
    """
    Class-based dependency cho RBAC.
    Dùng khi handler cần truy cập user_id hoặc role của người đang gọi API.

    Ví dụ:
        allow_doctor = RoleChecker(["doctor", "admin"])

        @router.post("/prescribe")
        async def prescribe_medicine(current_user: TokenData = Depends(allow_doctor)):
            return {"msg": f"Bác sĩ {current_user.user_id} đã kê đơn thành công"}
    """

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self, token_data: TokenData = Depends(get_current_token_data)
    ) -> TokenData:
        if token_data.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cấm truy cập. API này chỉ dành cho: {', '.join(self.allowed_roles)}",
            )
        return token_data


# ─────────────────────────────────────────────
# CÁC ROLE CHECKER ĐỊNH SẴN (dùng ngay không cần khởi tạo lại)
#
# Import và dùng trực tiếp:
#   from app.api.deps import allow_patient, allow_medical_staff, allow_admin
# ─────────────────────────────────────────────

# Ai cũng vào được (đã đăng nhập)
allow_all_roles = RoleChecker(["patient", "doctor", "nurse", "ems", "ops", "admin"])

# Nhân viên y tế (không bao gồm bệnh nhân)
allow_medical_staff = RoleChecker(["doctor", "nurse", "ems", "ops", "admin"])

# Chỉ bệnh nhân
allow_patient = RoleChecker(["patient"])

# Chỉ bác sĩ và admin (kê đơn, chẩn đoán)
allow_doctor = RoleChecker(["doctor", "admin"])

# Quyền cao nhất
allow_admin = RoleChecker(["admin"])
