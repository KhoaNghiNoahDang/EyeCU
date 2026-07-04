import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from sqlmodel import SQLModel
from app.api import auth, admin, ambulance, ambient, ems, patient, records, voice
from app.api.ambulance import background_db_updater

SQLModel.metadata.create_all(bind=engine)

# ── Startup Migration: thêm cột mới nếu chưa tồn tại ──────────────
def _run_migrations():
    """Tự động thêm cột mới vào bảng hiện có khi upgrade."""
    from sqlalchemy import text
    with engine.connect() as conn:
        # Thêm doctor_name vào community_questions
        try:
            conn.execute(text("ALTER TABLE community_questions ADD COLUMN doctor_name TEXT"))
            conn.commit()
        except Exception:
            pass  # Cột đã tồn tại
        # Thêm doctor_id vào community_questions
        try:
            conn.execute(text("ALTER TABLE community_questions ADD COLUMN doctor_id TEXT"))
            conn.commit()
        except Exception:
            pass  # Cột đã tồn tại

_run_migrations()

app = FastAPI(title="EyeCU Ambient Clinical OS", version="1.0.0")


# Dang ky Background Task: chay ngam khi server khoi dong
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_db_updater())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Dashboard"])
app.include_router(ambulance.router, prefix="/api/ambulance", tags=["Ambulance & Map"])
app.include_router(ambient.router, prefix="/api/ambient", tags=["AI Ambient Camera"])
app.include_router(ems.router, prefix="/api/ems", tags=["EMS & ER Ops"])
app.include_router(patient.router, prefix="/api/patient", tags=["Patient Portal"])
app.include_router(records.router, prefix="/api/records", tags=["Medical Records OCR"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice EMR"])


@app.get("/")
def read_root():
    return {"message": "Welcome to EyeCU API"}
