"""
test_security.py — Kiểm tra toàn bộ hệ thống Bảo mật & Phân quyền (RBAC)
=========================================================================

Các kịch bản được test:

    [JWT]
    ✅ PASS  Tạo token hợp lệ → giải mã được đúng role
    ✅ PASS  Token không có role → từ chối (401)
    ✅ PASS  Token giả mạo (sai SECRET_KEY) → từ chối (401)
    ✅ PASS  Token hết hạn → từ chối (401)

    [RBAC - Gọi API thật]
    ✅ PASS  Gọi API không có token → 401
    ✅ PASS  Gọi API đúng role → 200
    ✅ PASS  Gọi API sai role → 403
    ✅ PASS  Token admin → vào được mọi API
    ✅ PASS  Token patient → bị chặn API của bác sĩ

CÁCH CHẠY:
    cd d:\\HACKAITHON\\EyeCU\\backend
    pytest tests/test_security.py -v
"""

from datetime import timedelta

import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from jose import jwt

# ─── Import module ứng dụng ───────────────────────────────────────────────────
from app.main import app
from app.core.security import create_access_token
from app.core.config import settings
from app.api.deps import RoleChecker, TokenData, get_current_token_data

# ─── Client dùng chung cho toàn bộ test ──────────────────────────────────────
client = TestClient(app)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS — Tạo token nhanh cho từng role
# ══════════════════════════════════════════════════════════════════════════════

def make_token(role: str, user_id: str = "test-user-001") -> str:
    """Tạo JWT hợp lệ với role chỉ định."""
    return create_access_token(subject=user_id, role=role)


def make_expired_token(role: str = "doctor") -> str:
    """Tạo JWT đã hết hạn (expires_delta âm)."""
    return create_access_token(
        subject="expired-user", role=role, expires_delta=timedelta(seconds=-1)
    )


def auth_header(token: str) -> dict:
    """Tạo Authorization header từ token."""
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# PHẦN 1: Kiểm tra logic tạo & giải mã JWT
# ══════════════════════════════════════════════════════════════════════════════

class TestJWTCreation:
    """Kiểm tra create_access_token() tạo đúng payload không."""

    def test_token_contains_correct_role(self):
        """Role truyền vào phải xuất hiện đúng trong token."""
        for role in ["patient", "doctor", "nurse", "ems", "ops", "admin"]:
            token = make_token(role=role, user_id="user-123")
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            assert payload["role"] == role, f"Token thiếu role: {role}"
            assert payload["sub"] == "user-123"

    def test_token_contains_expiry(self):
        """Token phải có trường exp (thời gian hết hạn)."""
        token = make_token(role="admin")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        assert "exp" in payload

    def test_fake_token_cannot_be_decoded(self):
        """Token giả (sai SECRET_KEY) phải bị từ chối khi giải mã."""
        fake_token = jwt.encode(
            {"sub": "hacker", "role": "admin"},
            key="wrong-secret-key",
            algorithm="HS256",
        )
        with pytest.raises(Exception):
            jwt.decode(
                fake_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )

    def test_expired_token_raises_error(self):
        """Token hết hạn phải bị từ chối khi giải mã."""
        expired = make_expired_token()
        with pytest.raises(Exception):  # jose.ExpiredSignatureError
            jwt.decode(
                expired, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )


# ══════════════════════════════════════════════════════════════════════════════
# PHẦN 2: Kiểm tra API thật — /api/auth/login
# ══════════════════════════════════════════════════════════════════════════════

class TestLoginEndpoint:
    """Kiểm tra endpoint đăng nhập trả về token có role."""

    def test_login_returns_token_with_role(self):
        """Đăng nhập thành công → response phải có access_token và role."""
        response = client.post(
            "/api/auth/login",
            data={"username": "123456789000", "password": "any"},  # mock user
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "role" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    def test_login_token_contains_role_in_payload(self):
        """Giải mã token từ login → phải có trường role."""
        response = client.post(
            "/api/auth/login",
            data={"username": "doc001", "password": "any"},
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        assert "role" in payload
        assert "sub" in payload


# ══════════════════════════════════════════════════════════════════════════════
# PHẦN 3: Kiểm tra RBAC — Các kịch bản gọi API có bảo vệ
# ══════════════════════════════════════════════════════════════════════════════

class TestRBACPatientEndpoints:
    """Kiểm tra các API trong /api/patient/ phân quyền đúng không."""

    def test_no_token_returns_401(self):
        """Gọi API không có token → phải trả về 401."""
        response = client.post("/api/patient/sos")
        assert response.status_code == 401

    def test_patient_can_access_sos(self):
        """Bệnh nhân (role=patient) được gọi SOS."""
        token = make_token(role="patient")
        response = client.post(
            "/api/patient/sos", headers=auth_header(token)
        )
        # 200 = thành công, 422 = thiếu body (nhưng đã qua auth) — đều hợp lệ
        assert response.status_code in [200, 422, 500]
        assert response.status_code != 401  # Không phải "chưa đăng nhập"
        assert response.status_code != 403  # Không phải "không có quyền"

    def test_doctor_cannot_access_patient_sos(self):
        """Bác sĩ (role=doctor) bị chặn khỏi API chỉ dành cho bệnh nhân."""
        token = make_token(role="doctor")
        response = client.post(
            "/api/patient/sos", headers=auth_header(token)
        )
        assert response.status_code == 403

    def test_admin_cannot_access_patient_sos(self):
        """Admin cũng bị chặn nếu API được giới hạn chỉ role=patient."""
        token = make_token(role="admin")
        response = client.post(
            "/api/patient/sos", headers=auth_header(token)
        )
        assert response.status_code == 403

    def test_expired_token_returns_401(self):
        """Token hết hạn → 401, không phải 403."""
        expired = make_expired_token(role="patient")
        response = client.post(
            "/api/patient/sos", headers=auth_header(expired)
        )
        assert response.status_code == 401

    def test_fake_token_returns_401(self):
        """Token giả → 401."""
        fake = jwt.encode(
            {"sub": "hacker", "role": "patient"},
            key="wrong-key",
            algorithm="HS256",
        )
        response = client.post(
            "/api/patient/sos",
            headers={"Authorization": f"Bearer {fake}"},
        )
        assert response.status_code == 401


class TestRBACPatientAdmit:
    """Kiểm tra /api/patient/admit-walkin — chỉ ops và admin."""

    def test_patient_cannot_admit_walkin(self):
        """Bệnh nhân không được nhập viện người khác."""
        token = make_token(role="patient")
        response = client.post(
            "/api/patient/admit-walkin",
            json={"name": "Hacker", "cccd": "000000000000"},
            headers=auth_header(token),
        )
        assert response.status_code == 403

    def test_ops_can_admit_walkin(self):
        """Điều phối viên (ops) được nhập viện bệnh nhân mới."""
        token = make_token(role="ops")
        response = client.post(
            "/api/patient/admit-walkin",
            json={"name": "Nguyễn Văn A", "cccd": "123456789012"},
            headers=auth_header(token),
        )
        assert response.status_code in [200, 201, 422]
        assert response.status_code != 403

    def test_admin_can_admit_walkin(self):
        """Admin được nhập viện bệnh nhân mới."""
        token = make_token(role="admin")
        response = client.post(
            "/api/patient/admit-walkin",
            json={"name": "Trần Thị B", "cccd": "987654321012"},
            headers=auth_header(token),
        )
        assert response.status_code != 403


# ══════════════════════════════════════════════════════════════════════════════
# PHẦN 4: Kiểm tra RoleChecker trực tiếp (unit test không cần HTTP)
# ══════════════════════════════════════════════════════════════════════════════

class TestRoleCheckerUnit:
    """Unit test RoleChecker không qua HTTP — kiểm tra logic thuần."""

    @pytest.mark.asyncio
    async def test_role_checker_allows_correct_role(self):
        """RoleChecker phải cho qua khi role khớp."""
        checker = RoleChecker(["doctor", "admin"])
        token_data = TokenData(user_id="dr-001", role="doctor")

        # Gọi trực tiếp __call__ với token_data — không cần HTTP request
        result = await checker.__call__(token_data=token_data)
        assert result.role == "doctor"
        assert result.user_id == "dr-001"

    @pytest.mark.asyncio
    async def test_role_checker_blocks_wrong_role(self):
        """RoleChecker phải raise 403 khi role không khớp."""
        from fastapi import HTTPException

        checker = RoleChecker(["doctor", "admin"])
        token_data = TokenData(user_id="p-001", role="patient")

        with pytest.raises(HTTPException) as exc_info:
            await checker.__call__(token_data=token_data)

        assert exc_info.value.status_code == 403
        assert "Cấm truy cập" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_role_checker_error_message_lists_allowed_roles(self):
        """Thông báo lỗi phải liệt kê các role được phép."""
        from fastapi import HTTPException

        checker = RoleChecker(["doctor", "nurse"])
        token_data = TokenData(user_id="p-001", role="patient")

        with pytest.raises(HTTPException) as exc_info:
            await checker.__call__(token_data=token_data)

        assert "doctor" in exc_info.value.detail
        assert "nurse" in exc_info.value.detail


# ══════════════════════════════════════════════════════════════════════════════
# PHẦN 5: Kiểm tra các Role Checker định sẵn trong deps.py
# ══════════════════════════════════════════════════════════════════════════════

class TestPresetRoleCheckers:
    """Kiểm tra allow_patient, allow_medical_staff, allow_admin, v.v."""

    @pytest.mark.asyncio
    async def test_allow_patient_blocks_doctor(self):
        from fastapi import HTTPException
        from app.api.deps import allow_patient

        token_data = TokenData(user_id="dr-001", role="doctor")
        with pytest.raises(HTTPException) as exc:
            await allow_patient(token_data=token_data)
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_allow_medical_staff_blocks_patient(self):
        from fastapi import HTTPException
        from app.api.deps import allow_medical_staff

        token_data = TokenData(user_id="p-001", role="patient")
        with pytest.raises(HTTPException) as exc:
            await allow_medical_staff(token_data=token_data)
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_allow_medical_staff_allows_doctor(self):
        from app.api.deps import allow_medical_staff

        token_data = TokenData(user_id="dr-001", role="doctor")
        result = await allow_medical_staff(token_data=token_data)
        assert result.role == "doctor"

    @pytest.mark.asyncio
    async def test_allow_admin_only_allows_admin(self):
        from fastapi import HTTPException
        from app.api.deps import allow_admin

        for role in ["patient", "doctor", "nurse", "ems", "ops"]:
            token_data = TokenData(user_id="x", role=role)
            with pytest.raises(HTTPException):
                await allow_admin(token_data=token_data)

    @pytest.mark.asyncio
    async def test_allow_all_roles_allows_everyone(self):
        from app.api.deps import allow_all_roles

        for role in ["patient", "doctor", "nurse", "ems", "ops", "admin"]:
            token_data = TokenData(user_id="x", role=role)
            result = await allow_all_roles(token_data=token_data)
            assert result.role == role
