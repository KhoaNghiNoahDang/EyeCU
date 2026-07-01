from datetime import datetime, timedelta
from typing import Any, Union, List

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.db.database import get_db
from app.db.models import User

# ─────────────────────────────────────────────
# OAuth2 scheme — FastAPI tự đọc "Bearer <token>" từ Header
# ─────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


<<<<<<< HEAD
def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
=======
# ─────────────────────────────────────────────
# Schema dữ liệu nằm bên trong JWT Token
# ─────────────────────────────────────────────
class TokenData(BaseModel):
    user_id: str
    role: str


# ─────────────────────────────────────────────
# Tạo JWT Token — GẮN ROLE VÀO PAYLOAD
# ─────────────────────────────────────────────
def create_access_token(
    subject: Union[str, Any], role: str, expires_delta: timedelta = None
) -> str:
    """
    Tạo JWT Token chứa user_id (sub) và role.
    Token này được Frontend lưu và gửi lên mỗi request.
    """
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
<<<<<<< HEAD
    to_encode = {"exp": expire, "sub": str(subject)}
=======

    to_encode = {
        "exp": expire,
        "sub": str(subject),  # ID người dùng (UUID từ DB)
        "role": role,          # QUAN TRỌNG: Quyền gắn vào Token (patient, doctor, admin...)
    }

>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


<<<<<<< HEAD
def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
=======
# ─────────────────────────────────────────────
# Hàm 1: Giải mã Token → trả về TokenData (KHÔNG query DB)
# Dùng khi chỉ cần kiểm tra quyền nhanh
# ─────────────────────────────────────────────
async def get_current_token_data(
    token: str = Depends(oauth2_scheme),
) -> TokenData:
    """
    Giải mã JWT và trả về TokenData (user_id + role).
    Không truy vấn database — nhanh và nhẹ.
    """
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực danh tính (Token không hợp lệ hoặc đã hết hạn)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
<<<<<<< HEAD
=======
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
        return TokenData(user_id=user_id, role=role)
    except JWTError:
        raise credentials_exception


# ─────────────────────────────────────────────
# Hàm 2: Giải mã Token → trả về User object từ DB
# Dùng khi cần thông tin đầy đủ của người dùng
# ─────────────────────────────────────────────
def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Giải mã JWT và truy vấn DB để lấy User object đầy đủ.
    Dùng khi API cần truy cập thông tin chi tiết của người dùng.
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
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


<<<<<<< HEAD
=======
# ─────────────────────────────────────────────
# PHÂN QUYỀN RBAC — Cách 1: Hàm require_roles()
# Cú pháp: dependencies=[Depends(require_roles(["doctor", "admin"]))]
# ─────────────────────────────────────────────
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
def require_roles(allowed_roles: List[str]):
    """
    Dependency kiểm tra role từ JWT (không cần query DB).
    Dùng cho hầu hết các API thông thường.

    Ví dụ:
        @router.get("/report", dependencies=[Depends(require_roles(["doctor", "admin"]))])
    """
    async def role_checker(token_data: TokenData = Depends(get_current_token_data)):
        if token_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
<<<<<<< HEAD
                detail=f"Operation not permitted. Required role: {allowed_roles}",
            )
        return current_user
=======
                detail=f"Cấm truy cập. API này chỉ dành cho: {', '.join(allowed_roles)}",
            )
        return token_data
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5

    return role_checker


# ─────────────────────────────────────────────
# PHÂN QUYỀN RBAC — Cách 2: Class RoleChecker
# Cú pháp: Depends(RoleChecker(["doctor"]))
# Dùng khi muốn lấy current_user trong hàm xử lý
# ─────────────────────────────────────────────
class RoleChecker:
    """
    Class-based dependency cho RBAC.
    Dùng khi cần truy cập thông tin token_data bên trong hàm xử lý.

    Ví dụ:
        allow_doctor = RoleChecker(["doctor", "admin"])

        @router.post("/prescribe")
        async def prescribe(current_user: TokenData = Depends(allow_doctor)):
            return {"msg": f"Bác sĩ {current_user.user_id} đã kê đơn"}
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
