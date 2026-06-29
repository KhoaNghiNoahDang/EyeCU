from typing import Optional, Dict, Any, List
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import uuid

# =========================================================================
# 1. NHÓM QUẢN TRỊ & NGƯỜI DÙNG (ADMINISTRATION)
# =========================================================================

class Department(SQLModel, table=True):
    __tablename__ = "departments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100, unique=True, index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: str = Field(max_length=20, index=True) # admin, clinician, ops, ems, patient
    cccd: str = Field(max_length=12, unique=True, index=True)
    name: str = Field(max_length=100)
    
    # Dành cho NV Y tế
    employee_id: Optional[str] = Field(default=None, max_length=20, unique=True)
    password_hash: Optional[str] = Field(default=None, max_length=255)
    department_id: Optional[uuid.UUID] = Field(default=None, foreign_key="departments.id")
    
    # Dành cho Bệnh nhân
    bhxh_code: Optional[str] = Field(default=None, max_length=20)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    
    # Chung
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# =========================================================================
# 2. NHÓM ĐIỀU PHỐI & THIẾT BỊ (OPERATIONS & DEVICES)
# =========================================================================

class Ambulance(SQLModel, table=True):
    __tablename__ = "ambulances"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    plate_number: str = Field(max_length=15, unique=True, index=True)
    driver_name: Optional[str] = Field(default=None, max_length=100)
    status: str = Field(default="available", max_length=20) # available, dispatched, returning
    last_lat: Optional[float] = None
    last_lng: Optional[float] = None

class Shift(SQLModel, table=True):
    __tablename__ = "shifts"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ambulance_id: uuid.UUID = Field(foreign_key="ambulances.id")
    doctor_id: uuid.UUID = Field(foreign_key="users.id")
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None

class Device(SQLModel, table=True):
    __tablename__ = "devices"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    device_type: str = Field(max_length=50, index=True) # camera_fall, camera_lpr, monitor_spo2
    name: str = Field(max_length=100)
    location: Optional[str] = Field(default=None, max_length=255)
    status: str = Field(default="active", max_length=20) # active, offline, maintenance
    ip_address: Optional[str] = Field(default=None, max_length=50)


# =========================================================================
# 3. NHÓM KHÁM CHỮA BỆNH (CLINICAL RECORDS)
# =========================================================================

class PatientsQueue(SQLModel, table=True):
    __tablename__ = "patients_queue"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="users.id")
    department_id: uuid.UUID = Field(foreign_key="departments.id")
    triage_level: int = Field(default=3) # 1: Đỏ, 2: Vàng, 3: Xanh
    status: str = Field(default="waiting", max_length=20) # waiting, in_treatment, discharged
    entered_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicalRecord(SQLModel, table=True):
    __tablename__ = "clinical_records"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="users.id")
    doctor_id: uuid.UUID = Field(foreign_key="users.id")
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_signed: bool = Field(default=False)

class Medication(SQLModel, table=True):
    __tablename__ = "medications"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    record_id: uuid.UUID = Field(foreign_key="clinical_records.id")
    medicine_name: str = Field(max_length=200)
    dosage: str = Field(max_length=100)
    instructions: Optional[str] = None

class VitalSign(SQLModel, table=True):
    __tablename__ = "vital_signs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="users.id")
    device_id: Optional[uuid.UUID] = Field(default=None, foreign_key="devices.id")
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = Field(default=None, max_length=20)
    spo2: Optional[int] = None
    temperature: Optional[float] = None
    measured_at: datetime = Field(default_factory=datetime.utcnow)

class SmartReaderDoc(SQLModel, table=True):
    __tablename__ = "smart_reader_docs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="users.id")
    record_id: Optional[uuid.UUID] = Field(default=None, foreign_key="clinical_records.id")
    doc_type: str = Field(max_length=50) # blood_test, old_prescription
    image_url: str = Field(max_length=255)
    extracted_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


# =========================================================================
# 4. NHÓM LOGGING & CẢNH BÁO (ALERTS)
# =========================================================================

class SystemLog(SQLModel, table=True):
    __tablename__ = "system_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    log_type: str = Field(max_length=50, index=True) # fall_detected, auth_success, auth_fail
    device_id: Optional[uuid.UUID] = Field(default=None, foreign_key="devices.id")
    description: Optional[str] = None
    is_alert: bool = Field(default=False)
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LprLog(SQLModel, table=True):
    __tablename__ = "lpr_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    camera_id: uuid.UUID = Field(foreign_key="devices.id")
    plate_number: str = Field(max_length=20, index=True)
    confidence: Optional[float] = None
    image_url: Optional[str] = Field(default=None, max_length=255)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
