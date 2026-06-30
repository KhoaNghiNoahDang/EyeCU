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
