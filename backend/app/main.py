import asyncio
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from sqlmodel import SQLModel
from app.api import auth, admin, ambulance, ambient, ems, patient, records, voice, crowd, services, inventory, blood_bank, pharmacy
from app.api.ambulance import background_db_updater

SQLModel.metadata.create_all(bind=engine)

# ── Startup Migration: thêm cột mới nếu chưa tồn tại ──────────────
def _run_migrations():
    """Tự động thêm cột mới vào bảng hiện có khi upgrade."""
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE community_questions ADD COLUMN doctor_name TEXT"))
    except Exception:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE community_questions ADD COLUMN doctor_id TEXT"))
    except Exception:
        pass




_run_migrations()

app = FastAPI(title="EyeCU Ambient Clinical OS", version="1.0.0")


async def keep_awake():
    """Background task to keep Render server awake by pinging itself every 14 minutes."""
    while True:
        await asyncio.sleep(14 * 60)  # 14 minutes
        try:
            async with httpx.AsyncClient() as client:
                await client.get("https://eyecu.onrender.com/")
        except Exception:
            pass

# Dang ky Background Task: chay ngam khi server khoi dong
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_db_updater())
    asyncio.create_task(keep_awake())


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
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(ambulance.router, prefix="/api/ambulance", tags=["Ambulance & Map"])
app.include_router(ambient.router, prefix="/api/ambient", tags=["AI Ambient Camera"])
app.include_router(ems.router, prefix="/api/ems", tags=["EMS & ER Ops"])
app.include_router(patient.router, prefix="/api/patient", tags=["Patient Portal"])
app.include_router(records.router, prefix="/api/records", tags=["Medical Records OCR"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice EMR"])
app.include_router(crowd.router, prefix="/api/crowd", tags=["Crowd AI"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Medical Inventory"])
app.include_router(blood_bank.router, prefix="/api/bloodbank", tags=["Blood Bank"])
app.include_router(pharmacy.router, prefix="/api/pharmacy", tags=["Pharmacy Management"])


@app.get("/")
def read_root():
    return {"message": "Welcome to EyeCU API"}
