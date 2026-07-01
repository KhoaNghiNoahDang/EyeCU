"""
EyeCU Backend - Unit Tests
==========================
File test cơ bản để CI/CD pipeline có thể chạy ngay.
Thêm test cases cụ thể cho từng API ở đây.

QUAN TRỌNG:
- conftest.py đã set env vars trước khi file này chạy → không cần os.environ ở đây
- KHÔNG dùng try/except để bắt lỗi import — nếu app bị lỗi, pytest phải báo FAILED ngay
"""

import pytest
from fastapi.testclient import TestClient

# Import thẳng ở module level (ngoài mọi function/class)
# Nếu app/main.py có lỗi syntax, import sai tên, DB crash... pytest sẽ
# báo FAILED với ERROR: ImportError ngay lập tức — không thể lọt qua CI
from app.main import app

client = TestClient(app)


def test_placeholder_always_pass():
    """Placeholder test — luôn pass."""
    assert 1 + 1 == 2


class TestHealthCheck:
    """Test health check endpoint của FastAPI app."""

    def test_root_endpoint_returns_200(self):
        """Test GET / trả về 200 và có message."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "status" in data

    def test_docs_endpoint_accessible(self):
        """Test Swagger UI /docs endpoint trả về 200."""
        response = client.get("/docs")
        assert response.status_code == 200


class TestAuthEndpoints:
    """
    Test Authentication endpoints.
    TODO - Trịnh: Thêm test cases đầy đủ cho:
      - POST /api/auth/login
      - POST /api/auth/register
      - GET  /api/auth/me (cần token)
    """

    pass


class TestPatientEndpoints:
    """
    Test Patient Portal endpoints.
    TODO - An: Thêm test cases cho:
      - GET  /api/patient/
      - POST /api/patient/create
    """

    pass
