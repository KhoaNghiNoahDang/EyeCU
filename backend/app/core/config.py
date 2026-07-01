import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "EyeCU Backend"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./eyecu.db"

    # VNPT eKYC
    VNPT_EKYC_TOKEN_ID: str = ""
    VNPT_EKYC_TOKEN_KEY: str = ""
    VNPT_EKYC_ACCESS_TOKEN: str = ""

    # VNPT SmartVision
    VNPT_SMARTVISION_TOKEN_ID: str = ""
    VNPT_SMARTVISION_TOKEN_KEY: str = ""
    VNPT_SMARTVISION_ACCESS_TOKEN: str = ""

    # VNPT SmartBot
    VNPT_SMARTBOT_TOKEN_ID: str = ""
    VNPT_SMARTBOT_TOKEN_KEY: str = ""
    VNPT_SMARTBOT_ACCESS_TOKEN: str = ""

    # VNPT vnFace
    VNPT_VNFACE_ACCESS_TOKEN: str = ""

    # VNPT SmartVoice
    VNPT_SMARTVOICE_TOKEN_ID: str = ""
    VNPT_SMARTVOICE_TOKEN_KEY: str = ""
    VNPT_SMARTVOICE_ACCESS_TOKEN: str = ""

    # VNPT SmartReader
    VNPT_SMARTREADER_TOKEN_ID: str = ""
    VNPT_SMARTREADER_TOKEN_KEY: str = ""
    VNPT_SMARTREADER_ACCESS_TOKEN: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",        
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
