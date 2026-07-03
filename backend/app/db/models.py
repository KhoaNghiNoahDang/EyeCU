from typing import Optional, Dict, Any, List
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
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


class Patient(SQLModel, table=True):
    __tablename__ = "patients"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100)
    cccd: str = Field(max_length=12, unique=True, index=True)
    phone: Optional[str] = Field(default=None, max_length=20)
    bhxh_code: Optional[str] = Field(default=None, max_length=20)
    qr_token: Optional[str] = Field(
        default=None, max_length=100, unique=True, index=True
    )
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    cccd_front_url: Optional[str] = Field(default=None, max_length=255)
    cccd_back_url: Optional[str] = Field(default=None, max_length=255)
    password_hash: Optional[str] = Field(default=None, max_length=255)
    face_base64: Optional[str] = Field(default=None)
    dob: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None)
    hometown: Optional[str] = Field(default=None)
    gender: Optional[str] = Field(default=None, max_length=10)
    issue_date: Optional[str] = Field(default=None, max_length=20)
    issue_place: Optional[str] = Field(default=None)
    valid_until: Optional[str] = Field(default=None, max_length=20)
    characteristics: Optional[str] = Field(default=None)
    blood_type: Optional[str] = Field(default=None, max_length=10)
    allergies: Optional[str] = Field(default=None)
    chronic_conditions: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def role(self) -> str:
        return "patient"


class Staff(SQLModel, table=True):
    __tablename__ = "staffs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: str = Field(max_length=20, index=True)  # admin, clinician, ops, ems
    cccd: str = Field(max_length=12, unique=True, index=True)
    name: str = Field(max_length=100)
    employee_id: str = Field(max_length=20, unique=True)
    password_hash: str = Field(max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    dob: Optional[str] = Field(default=None, max_length=20)
    department_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="departments.id"
    )
    face_base64: Optional[str] = Field(default=None) # To store the registered face image
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorSchedule(SQLModel, table=True):
    __tablename__ = "doctor_schedules"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    doctor_id: uuid.UUID = Field(foreign_key="staffs.id")
    date: str = Field(max_length=20) # YYYY-MM-DD
    start_time: str = Field(max_length=10) # HH:MM
    end_time: str = Field(max_length=10) # HH:MM
    created_at: datetime = Field(default_factory=datetime.utcnow)


# =========================================================================
# 2. NHÓM ĐIỀU PHỐI & THIẾT BỊ (OPERATIONS & DEVICES)
# =========================================================================


class Ambulance(SQLModel, table=True):
    __tablename__ = "ambulances"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    plate_number: str = Field(max_length=15, unique=True, index=True)
    driver_name: Optional[str] = Field(default=None, max_length=100)
    status: str = Field(
        default="available", max_length=20
    )  # available, dispatched, returning
    last_lat: Optional[float] = None
    last_lng: Optional[float] = None


class Shift(SQLModel, table=True):
    __tablename__ = "shifts"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ambulance_id: uuid.UUID = Field(foreign_key="ambulances.id")
    doctor_id: uuid.UUID = Field(foreign_key="staffs.id")
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None


class Device(SQLModel, table=True):
    __tablename__ = "devices"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    device_type: str = Field(
        max_length=50, index=True
    )  # camera_fall, camera_lpr, monitor_spo2
    name: str = Field(max_length=100)
    location: Optional[str] = Field(default=None, max_length=255)
    status: str = Field(default="active", max_length=20)  # active, offline, maintenance
    ip_address: Optional[str] = Field(default=None, max_length=50)


# =========================================================================
# 3. NHÓM KHÁM CHỮA BỆNH (CLINICAL RECORDS)
# =========================================================================


class PatientsQueue(SQLModel, table=True):
    __tablename__ = "patients_queue"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    department_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="departments.id"
    )
    triage_level: int = Field(default=3)  # 1: Đỏ, 2: Vàng, 3: Xanh
    status: str = Field(
        default="waiting", max_length=20
    )  # waiting, in_treatment, discharged
    entered_at: datetime = Field(default_factory=datetime.utcnow)


class RegistrationTicket(SQLModel, table=True):
    __tablename__ = "registration_tickets"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    ticket_code: str = Field(max_length=50, unique=True, index=True)
    patient_code: str = Field(max_length=50)
    sequence_number: int = Field(default=1)
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="active", max_length=20) # active, completed, cancelled

class TicketServiceItem(SQLModel, table=True):
    __tablename__ = "ticket_service_items"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ticket_id: uuid.UUID = Field(foreign_key="registration_tickets.id")
    service_name: str = Field(max_length=255)
    room_location: str = Field(max_length=255)
    order_index: int = Field(default=1)
    status: str = Field(default="pending", max_length=20)



class ClinicalRecord(SQLModel, table=True):
    __tablename__ = "clinical_records"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    doctor_id: uuid.UUID = Field(foreign_key="staffs.id")
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
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    device_id: Optional[uuid.UUID] = Field(default=None, foreign_key="devices.id")
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = Field(default=None, max_length=20)
    spo2: Optional[int] = None
    temperature: Optional[float] = None
    measured_at: datetime = Field(default_factory=datetime.utcnow)


class ImagingResult(SQLModel, table=True):
    __tablename__ = "imaging_results"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    record_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clinical_records.id"
    )
    image_type: str = Field(max_length=100) # X-Quang, Siêu âm, MRI, CT
    image_url: str = Field(max_length=255)
    description: Optional[str] = None
    conclusion: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SmartReaderDoc(SQLModel, table=True):
    __tablename__ = "smart_reader_docs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    record_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="clinical_records.id"
    )
    doc_type: str = Field(max_length=50)  # blood_test, old_prescription
    image_url: str = Field(max_length=255)
    extracted_data: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON)
    )
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class FollowUp(SQLModel, table=True):
    __tablename__ = "follow_ups"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    record_id: uuid.UUID = Field(foreign_key="clinical_records.id")
    date: str = Field(max_length=50)
    time: str = Field(max_length=50)
    department: str = Field(max_length=100)
    note: Optional[str] = None
    status: str = Field(default="pending", max_length=20)  # pending, booked
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HospitalFee(SQLModel, table=True):
    __tablename__ = "hospital_fees"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    record_id: uuid.UUID = Field(foreign_key="clinical_records.id")
    total: int = Field(default=0)
    status: str = Field(default="pending", max_length=20)  # paid, pending
    paid_at: Optional[datetime] = None


class HospitalFeeItem(SQLModel, table=True):
    __tablename__ = "hospital_fee_items"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    fee_id: uuid.UUID = Field(foreign_key="hospital_fees.id")
    name: str = Field(max_length=150)
    amount: int = Field(default=0)


# =========================================================================
# 4. NHÓM LOGGING & CẢNH BÁO (ALERTS)
# =========================================================================


class SystemLog(SQLModel, table=True):
    __tablename__ = "system_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    log_type: str = Field(
        max_length=50, index=True
    )  # fall_detected, auth_success, auth_fail
    device_id: Optional[uuid.UUID] = Field(default=None, foreign_key="devices.id")
    description: Optional[str] = None
    is_alert: bool = Field(default=False)
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LprLog(SQLModel, table=True):
    __tablename__ = "lpr_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    camera_id: Optional[uuid.UUID] = Field(default=None, foreign_key="devices.id")
    plate_number: str = Field(max_length=20, index=True)
    confidence: Optional[float] = None
    image_url: Optional[str] = Field(default=None, max_length=255)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Incident(SQLModel, table=True):
    __tablename__ = "incidents"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    room_code: str = Field(max_length=50, index=True)
    severity: str = Field(max_length=50)  # Khẩn, Cần xem, Ổn định
    description: Optional[str] = None
    status: str = Field(default="pending", max_length=20)  # pending, resolved
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmsMission(SQLModel, table=True):
    __tablename__ = "ems_missions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    plate_number: str = Field(max_length=20, index=True)
    hospital_id: Optional[str] = Field(default=None, max_length=50)
    status: str = Field(default="active", max_length=20)  # active, arrived, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)


# =========================================================================
# 5. NHÓM TƯƠNG TÁC BỆNH NHÂN (PATIENT ENGAGEMENT)
# =========================================================================

class Appointment(SQLModel, table=True):
    __tablename__ = "appointments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    department_id: Optional[uuid.UUID] = Field(default=None, foreign_key="departments.id")
    doctor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="staffs.id")
    booking_date: str = Field(max_length=20)
    booking_time: str = Field(max_length=20)
    reason: Optional[str] = None
    status: str = Field(default="pending", max_length=20)  # pending, confirmed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: Optional[uuid.UUID] = Field(default=None, foreign_key="patients.id")
    staff_id: Optional[uuid.UUID] = Field(default=None, foreign_key="staffs.id")
    title: str = Field(max_length=200)
    content: str
    type: str = Field(max_length=50) # 'appointment_reminder', 'system', 'result'
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommunityQuestion(SQLModel, table=True):
    __tablename__ = "community_questions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    department: str = Field(max_length=100)
    question: str
    answer: Optional[str] = None
    status: str = Field(default="unanswered", max_length=20) # unanswered, answered
    created_at: datetime = Field(default_factory=datetime.utcnow)
    answered_at: Optional[datetime] = None

class ConsentForm(SQLModel, table=True):
    __tablename__ = "consent_forms"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: uuid.UUID = Field(foreign_key="patients.id")
    document_name: str = Field(max_length=200)
    content: str
    is_signed: bool = Field(default=False)
    signed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
