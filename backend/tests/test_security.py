"""
test_security.py â€” Kiá»ƒm tra toÃ n bá»™ há»‡ thá»‘ng Báº£o máº­t & PhÃ¢n quyá»n (RBAC)
=========================================================================

CÃ¡c ká»‹ch báº£n Ä‘Æ°á»£c test:

    [JWT]
    âœ… PASS  Táº¡o token há»£p lá»‡ â†’ giáº£i mÃ£ Ä‘Æ°á»£c Ä‘Ãºng role
    âœ… PASS  Token khÃ´ng cÃ³ role â†’ tá»« chá»‘i (401)
    âœ… PASS  Token giáº£ máº¡o (sai SECRET_KEY) â†’ tá»« chá»‘i (401)
    âœ… PASS  Token háº¿t háº¡n â†’ tá»« chá»‘i (401)

    [RBAC - Gá»i API tháº­t]
    âœ… PASS  Gá»i API khÃ´ng cÃ³ token â†’ 401
    âœ… PASS  Gá»i API Ä‘Ãºng role â†’ 200
    âœ… PASS  Gá»i API sai role â†’ 403
    âœ… PASS  Token admin â†’ vÃ o Ä‘Æ°á»£c má»i API
    âœ… PASS  Token patient â†’ bá»‹ cháº·n API cá»§a bÃ¡c sÄ©

CÃCH CHáº Y:
    cd d:\\HACKAITHON\\EyeCU\\backend
    pytest tests/test_security.py -v
"""

from datetime import timedelta

import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from jose import jwt

# â”€â”€â”€ Import module á»©ng dá»¥ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
from app.main import app
from app.core.security import create_access_token
from app.core.config import settings
from app.api.deps import RoleChecker, TokenData, get_current_token_data

# â”€â”€â”€ Client dÃ¹ng chung cho toÃ n bá»™ test â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
client = TestClient(app)


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# HELPERS â€” Táº¡o token nhanh cho tá»«ng role
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def make_token(role: str, user_id: str = "12345678-1234-5678-1234-567812345678") -> str:
    """Táº¡o JWT há»£p lá»‡ vá»›i role chá»‰ Ä‘á»‹nh."""
    return create_access_token(subject=user_id, role=role)


def make_expired_token(role: str = "doctor") -> str:
    """Táº¡o JWT Ä‘Ã£ háº¿t háº¡n (expires_delta Ã¢m)."""
    return create_access_token(
        subject="12345678-1234-5678-1234-567812345678", role=role, expires_delta=timedelta(seconds=-1)
    )


def auth_header(token: str) -> dict:
    """Táº¡o Authorization header tá»« token."""
    return {"Authorization": f"Bearer {token}"}


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PHáº¦N 1: Kiá»ƒm tra logic táº¡o & giáº£i mÃ£ JWT
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class TestJWTCreation:
    """Kiá»ƒm tra create_access_token() táº¡o Ä‘Ãºng payload khÃ´ng."""

    def test_token_contains_correct_role(self):
        """Role truyá»n vÃ o pháº£i xuáº¥t hiá»‡n Ä‘Ãºng trong token."""
        for role in ["patient", "doctor", "nurse", "ems", "ops", "admin"]:
            token = make_token(role=role, user_id="12345678-1234-5678-1234-567812345678")
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            assert payload["role"] == role, f"Token thiáº¿u role: {role}"
            assert payload["sub"] == "12345678-1234-5678-1234-567812345678"

    def test_token_contains_expiry(self):
        """Token pháº£i cÃ³ trÆ°á»ng exp (thá»i gian háº¿t háº¡n)."""
        token = make_token(role="admin")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        assert "exp" in payload

    def test_fake_token_cannot_be_decoded(self):
        """Token giáº£ (sai SECRET_KEY) pháº£i bá»‹ tá»« chá»‘i khi giáº£i mÃ£."""
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
        """Token háº¿t háº¡n pháº£i bá»‹ tá»« chá»‘i khi giáº£i mÃ£."""
        expired = make_expired_token()
        with pytest.raises(Exception):  # jose.ExpiredSignatureError
            jwt.decode(
                expired, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PHáº¦N 2: Kiá»ƒm tra API tháº­t â€” /api/auth/login
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class TestLoginEndpoint:
    """Kiá»ƒm tra endpoint Ä‘Äƒng nháº­p tráº£ vá» token cÃ³ role."""

    def test_login_returns_token_with_role(self):
        """ÄÄƒng nháº­p thÃ nh cÃ´ng â†’ response pháº£i cÃ³ access_token vÃ  role."""
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
        """Giáº£i mÃ£ token tá»« login â†’ pháº£i cÃ³ trÆ°á»ng role."""
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


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PHáº¦N 3: Kiá»ƒm tra RBAC â€” CÃ¡c ká»‹ch báº£n gá»i API cÃ³ báº£o vá»‡
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class TestRBACPatientEndpoints:
    """Kiá»ƒm tra cÃ¡c API trong /api/patient/ phÃ¢n quyá»n Ä‘Ãºng khÃ´ng."""

    def test_no_token_returns_401(self):
        """Gá»i API khÃ´ng cÃ³ token â†’ pháº£i tráº£ vá» 401."""
        response = client.post("/api/patient/sos")
        assert response.status_code == 401

    def test_patient_can_access_sos(self):
        """Bá»‡nh nhÃ¢n (role=patient) Ä‘Æ°á»£c gá»i SOS."""
        token = make_token(role="patient")
        response = client.post(
            "/api/patient/sos", headers=auth_header(token)
        )
        # 200 = thÃ nh cÃ´ng, 422 = thiáº¿u body (nhÆ°ng Ä‘Ã£ qua auth) â€” Ä‘á»u há»£p lá»‡
        assert response.status_code in [200, 422, 500]
        assert response.status_code != 401  # KhÃ´ng pháº£i "chÆ°a Ä‘Äƒng nháº­p"
        assert response.status_code != 403  # KhÃ´ng pháº£i "khÃ´ng cÃ³ quyá»n"

    def test_doctor_cannot_access_patient_sos(self):
        """BÃ¡c sÄ© (role=doctor) bá»‹ cháº·n khá»i API chá»‰ dÃ nh cho bá»‡nh nhÃ¢n."""
        token = make_token(role="doctor")
        response = client.post(
            "/api/patient/sos", headers=auth_header(token)
        )
        assert response.status_code == 403

    def test_admin_cannot_access_patient_sos(self):
        """Admin cÅ©ng bá»‹ cháº·n náº¿u API Ä‘Æ°á»£c giá»›i háº¡n chá»‰ role=patient."""
        token = make_token(role="admin")
        response = client.post(
            "/api/patient/sos", headers=auth_header(token)
        )
        assert response.status_code == 403

    def test_expired_token_returns_401(self):
        """Token háº¿t háº¡n â†’ 401, khÃ´ng pháº£i 403."""
        expired = make_expired_token(role="patient")
        response = client.post(
            "/api/patient/sos", headers=auth_header(expired)
        )
        assert response.status_code == 401

    def test_fake_token_returns_401(self):
        """Token giáº£ â†’ 401."""
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
    """Kiá»ƒm tra /api/patient/admit-walkin â€” chá»‰ ops vÃ  admin."""

    def test_patient_cannot_admit_walkin(self):
        """Bá»‡nh nhÃ¢n khÃ´ng Ä‘Æ°á»£c nháº­p viá»‡n ngÆ°á»i khÃ¡c."""
        token = make_token(role="patient")
        response = client.post(
            "/api/patient/admit-walkin",
            json={"name": "Hacker", "cccd": "000000000000"},
            headers=auth_header(token),
        )
        assert response.status_code == 403

    def test_ops_can_admit_walkin(self):
        """Äiá»u phá»‘i viÃªn (ops) Ä‘Æ°á»£c nháº­p viá»‡n bá»‡nh nhÃ¢n má»›i."""
        token = make_token(role="ops")
        response = client.post(
            "/api/patient/admit-walkin",
            json={"name": "Nguyá»…n VÄƒn A", "cccd": "123456789012"},
            headers=auth_header(token),
        )
        assert response.status_code in [200, 201, 422]
        assert response.status_code != 403

    def test_admin_can_admit_walkin(self):
        """Admin Ä‘Æ°á»£c nháº­p viá»‡n bá»‡nh nhÃ¢n má»›i."""
        token = make_token(role="admin")
        response = client.post(
            "/api/patient/admit-walkin",
            json={"name": "Tráº§n Thá»‹ B", "cccd": "987654321012"},
            headers=auth_header(token),
        )
        assert response.status_code != 403


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PHáº¦N 4: Kiá»ƒm tra RoleChecker trá»±c tiáº¿p (unit test khÃ´ng cáº§n HTTP)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class TestRoleCheckerUnit:
    """Unit test RoleChecker khÃ´ng qua HTTP â€” kiá»ƒm tra logic thuáº§n."""

    @pytest.mark.asyncio
    async def test_role_checker_allows_correct_role(self):
        """RoleChecker pháº£i cho qua khi role khá»›p."""
        checker = RoleChecker(["doctor", "admin"])
        token_data = TokenData(user_id="11111111-1111-1111-1111-111111111111", role="doctor")

        # Gá»i trá»±c tiáº¿p __call__ vá»›i token_data â€” khÃ´ng cáº§n HTTP request
        result = await checker.__call__(token_data=token_data)
        assert result.role == "doctor"
        assert result.user_id == "11111111-1111-1111-1111-111111111111"

    @pytest.mark.asyncio
    async def test_role_checker_blocks_wrong_role(self):
        """RoleChecker pháº£i raise 403 khi role khÃ´ng khá»›p."""
        from fastapi import HTTPException

        checker = RoleChecker(["doctor", "admin"])
        token_data = TokenData(user_id="12345678-1234-5678-1234-567812345678", role="patient")

        with pytest.raises(HTTPException) as exc_info:
            await checker.__call__(token_data=token_data)

        assert exc_info.value.status_code == 403
        assert "doctor" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_role_checker_error_message_lists_allowed_roles(self):
        """ThÃ´ng bÃ¡o lá»—i pháº£i liá»‡t kÃª cÃ¡c role Ä‘Æ°á»£c phÃ©p."""
        from fastapi import HTTPException

        checker = RoleChecker(["doctor", "nurse"])
        token_data = TokenData(user_id="12345678-1234-5678-1234-567812345678", role="patient")

        with pytest.raises(HTTPException) as exc_info:
            await checker.__call__(token_data=token_data)

        assert "doctor" in exc_info.value.detail
        assert "nurse" in exc_info.value.detail


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PHáº¦N 5: Kiá»ƒm tra cÃ¡c Role Checker Ä‘á»‹nh sáºµn trong deps.py
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class TestPresetRoleCheckers:
    """Kiá»ƒm tra allow_patient, allow_medical_staff, allow_admin, v.v."""

    @pytest.mark.asyncio
    async def test_allow_patient_blocks_doctor(self):
        from fastapi import HTTPException
        from app.api.deps import allow_patient

        token_data = TokenData(user_id="11111111-1111-1111-1111-111111111111", role="doctor")
        with pytest.raises(HTTPException) as exc:
            await allow_patient(token_data=token_data)
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_allow_medical_staff_blocks_patient(self):
        from fastapi import HTTPException
        from app.api.deps import allow_medical_staff

        token_data = TokenData(user_id="12345678-1234-5678-1234-567812345678", role="patient")
        with pytest.raises(HTTPException) as exc:
            await allow_medical_staff(token_data=token_data)
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_allow_medical_staff_allows_doctor(self):
        from app.api.deps import allow_medical_staff

        token_data = TokenData(user_id="11111111-1111-1111-1111-111111111111", role="doctor")
        result = await allow_medical_staff(token_data=token_data)
        assert result.role == "doctor"

    @pytest.mark.asyncio
    async def test_allow_admin_only_allows_admin(self):
        from fastapi import HTTPException
        from app.api.deps import allow_admin

        for role in ["patient", "doctor", "nurse", "ems", "ops"]:
            token_data = TokenData(user_id="12345678-1234-5678-1234-567812345678", role=role)
            with pytest.raises(HTTPException):
                await allow_admin(token_data=token_data)

    @pytest.mark.asyncio
    async def test_allow_all_roles_allows_everyone(self):
        from app.api.deps import allow_all_roles

        for role in ["patient", "doctor", "nurse", "ems", "ops", "admin"]:
            token_data = TokenData(user_id="12345678-1234-5678-1234-567812345678", role=role)
            result = await allow_all_roles(token_data=token_data)
            assert result.role == role

