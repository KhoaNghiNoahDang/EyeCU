from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api import auth, admin, ambulance, ambient, ems, patient, records, voice

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EyeCU Ambient Clinical OS", version="1.0.0")

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
