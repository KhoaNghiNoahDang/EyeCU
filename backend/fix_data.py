"""
Fix dữ liệu giả lập: gán bác sĩ đúng chuyên khoa + thêm dịch vụ cho bệnh nhân Lê Quốc Đạt
"""
from app.db.database import get_db
from app.db.models import ClinicalRecord, Staff, Department, ExaminationService, FunctionalRoom, Patient
import uuid
from datetime import datetime, timedelta

gen = get_db()
db = next(gen)

# ─── 1. Mapping chẩn đoán → bác sĩ đúng chuyên khoa ───────────────────────
DIAG_TO_DOCTOR = {
    # Hô hấp
    "Viêm phế quản cấp":               "BS. Vũ Phương Phong",      # Khoa Hô hấp
    "Bệnh phổi tắc nghẽn mạn tính":    "BS. Vũ Phương Phong",
    # Mắt
    "Viêm kết mạc":                    "BS. Trần Hữu Linh",         # Khoa Mắt
    # Nội tiết / Đái tháo đường
    "Đái tháo đường type 2 chưa kiểm soát": "BS. Đỗ Hoàng Long",   # Khoa Nội tiết
    "Đái tháo đường type 2":            "BS. Đỗ Hoàng Long",
    # Tim mạch
    "Suy tim độ II":                    "BS. Đỗ Gia Hùng",          # Khoa Tim mạch
    "Tăng huyết áp độ 2":              "BS. Đỗ Gia Hùng",
    "Thiếu máu cơ tim":                "BS. Đỗ Gia Hùng",
    # Tiêu hóa
    "Viêm dạ dày - tá tràng":          "BS. Phan Phương Bình",      # Cơ xương khớp — sẽ gán nội Tiêu hóa
    "Hội chứng ruột kích thích":       "BS. Phan Phương Bình",
    # Tai Mũi Họng
    "Viêm xoang mạn":                  "BS. Trần Minh Hà",          # Khoa TMH
    # Thần kinh
    "Đau đầu căng thẳng":              "Trịnh Khánh Huyền",         # Khoa Thần kinh
    "Hội chứng tiền đình":             "Trịnh Khánh Huyền",
    # Cơ xương khớp
    "Thoát vị đĩa đệm L4-L5":         "BS. Phan Phương Bình",      # Cơ xương khớp
    "Viêm khớp dạng thấp":            "BS. Phan Phương Bình",
    "Gút cấp":                         "BS. Phan Phương Bình",
    # Thận/Tiết niệu
    "Sỏi thận":                        "BS. Bùi Văn Lan",           # Khoa Thận
    # Da liễu
    "Viêm da cơ địa":                  "BS. Phạm Tuấn Linh",        # Da liễu
    # Tâm thần
    "Trầm cảm nhẹ":                    "Trịnh Khánh Huyền",
    # Truyền nhiễm
    "Hội chứng ruột kích thích":       "e83df905-4e57-40f8-86b4-a18b40e10d59",  # Dương Hữu Nam
}

# Build name→id map for staff
all_staff = db.query(Staff).all()
name_to_staff = {s.name: s for s in all_staff}

# Fix all records
fixed = 0
for r in db.query(ClinicalRecord).all():
    diag = r.diagnosis or ""
    target_name = DIAG_TO_DOCTOR.get(diag)
    if target_name and target_name in name_to_staff:
        new_doc = name_to_staff[target_name]
        if r.doctor_id != new_doc.id:
            r.doctor_id = new_doc.id
            fixed += 1

db.commit()
print("Fixed", fixed, "records")

# ─── 2. Thêm dịch vụ cho records của Lê Quốc Đạt ─────────────────────────
PATIENT_ID = "f75e8745-eeb6-4b1c-8470-dc8f6e1fde30"
le_quoc_dat_records = (
    db.query(ClinicalRecord)
    .filter(ClinicalRecord.patient_id == PATIENT_ID)
    .order_by(ClinicalRecord.created_at.desc())
    .all()
)

# Xóa dịch vụ cũ nếu có
for r in le_quoc_dat_records:
    db.query(ExaminationService).filter(ExaminationService.record_id == str(r.id)).delete()
db.commit()

# Room IDs by name
all_rooms = db.query(FunctionalRoom).all()
room_map = {rm.name: rm for rm in all_rooms}

def get_room(name):
    return room_map.get(name)

def add_srv(record_id, room, assigned_offset_min, completed_offset_min=None):
    if not room:
        return
    base = datetime(2026, 6, 22, 8, 0, 0)  # will be overridden
    # Use record's created_at as base
    base = le_quoc_dat_records[0].created_at.replace(hour=7, minute=30, second=0)
    assigned = base + timedelta(minutes=assigned_offset_min)
    completed = (base + timedelta(minutes=completed_offset_min)) if completed_offset_min else None
    srv = ExaminationService(
        id=uuid.uuid4(),
        record_id=str(record_id),
        room_id=room.id,
        status="completed" if completed else "pending",
        assigned_at=assigned,
        completed_at=completed,
    )
    db.add(srv)

# Các đợt khám của Lê Quốc Đạt (hiện tại 4 records, thứ tự: mới nhất trước)
# Record 0 = mới nhất (E5072566 - Viêm phế quản cấp, 22/6/2026)
if len(le_quoc_dat_records) >= 1:
    r0 = le_quoc_dat_records[0]
    base0 = r0.created_at.replace(hour=7, minute=30)
    # Viêm phế quản: khám Hô hấp + đo chức năng hô hấp + XQ + xét nghiệm máu
    for room_name, ao, co in [
        ("Phòng Khám Hô Hấp",                       0,   45),
        ("Phòng Lấy Máu Xét Nghiệm 1",              50,  80),
        ("Phòng Đo Chức Năng Hô Hấp",               90, 130),
        ("Phòng X-Quang 1",                         140, 165),
    ]:
        rm = room_map.get(room_name)
        if rm:
            db.add(ExaminationService(
                id=uuid.uuid4(), record_id=str(r0.id), room_id=rm.id,
                status="completed",
                assigned_at=base0 + timedelta(minutes=ao),
                completed_at=base0 + timedelta(minutes=co),
            ))

# Record 1 = C3B86CA1 - Viêm kết mạc (10/6/2026)
if len(le_quoc_dat_records) >= 2:
    r1 = le_quoc_dat_records[1]
    base1 = r1.created_at.replace(hour=8, minute=0)
    for room_name, ao, co in [
        ("Phòng Khám Mắt",                           0,  40),
        ("Phòng Lấy Máu Xét Nghiệm 1",              45,  70),
    ]:
        rm = room_map.get(room_name)
        if rm:
            db.add(ExaminationService(
                id=uuid.uuid4(), record_id=str(r1.id), room_id=rm.id,
                status="completed",
                assigned_at=base1 + timedelta(minutes=ao),
                completed_at=base1 + timedelta(minutes=co),
            ))

# Record 2 = 61CC9B39 - Viêm phế quản cấp (17/5/2026)
if len(le_quoc_dat_records) >= 3:
    r2 = le_quoc_dat_records[2]
    base2 = r2.created_at.replace(hour=9, minute=0)
    for room_name, ao, co in [
        ("Phòng Khám Hô Hấp",                        0,  50),
        ("Phòng X-Quang 1",                          55,  80),
        ("Phòng Đo Chức Năng Hô Hấp",               85, 120),
    ]:
        rm = room_map.get(room_name)
        if rm:
            db.add(ExaminationService(
                id=uuid.uuid4(), record_id=str(r2.id), room_id=rm.id,
                status="completed",
                assigned_at=base2 + timedelta(minutes=ao),
                completed_at=base2 + timedelta(minutes=co),
            ))

# Record 3 = 6A6930B6 - Đái tháo đường type 2 (24/4/2026)
if len(le_quoc_dat_records) >= 4:
    r3 = le_quoc_dat_records[3]
    base3 = r3.created_at.replace(hour=7, minute=45)
    for room_name, ao, co in [
        ("Phòng Khám Nội Tiết",                      0,  40),
        ("Phòng Lấy Máu Xét Nghiệm 1",              45,  75),
        ("Phòng Lấy Mẫu Nước Tiểu / Phân",          80, 100),
        ("Phòng Siêu Âm Tổng Quát",                105, 130),
    ]:
        rm = room_map.get(room_name)
        if rm:
            db.add(ExaminationService(
                id=uuid.uuid4(), record_id=str(r3.id), room_id=rm.id,
                status="completed",
                assigned_at=base3 + timedelta(minutes=ao),
                completed_at=base3 + timedelta(minutes=co),
            ))

# Fix doctor for Lê Quốc Đạt records
hh_doc = name_to_staff.get("BS. Vũ Phương Phong")  # Hô hấp
mat_doc = name_to_staff.get("BS. Trần Hữu Linh")    # Mắt
nt_doc  = name_to_staff.get("BS. Đỗ Hoàng Long")    # Nội tiết

if len(le_quoc_dat_records) >= 1 and hh_doc:
    le_quoc_dat_records[0].doctor_id = hh_doc.id
if len(le_quoc_dat_records) >= 2 and mat_doc:
    le_quoc_dat_records[1].doctor_id = mat_doc.id
if len(le_quoc_dat_records) >= 3 and hh_doc:
    le_quoc_dat_records[2].doctor_id = hh_doc.id
if len(le_quoc_dat_records) >= 4 and nt_doc:
    le_quoc_dat_records[3].doctor_id = nt_doc.id

db.commit()
print("Done! Added services for Le Quoc Dat's", len(le_quoc_dat_records), "records")
print("Records:")
for r in le_quoc_dat_records:
    srvs = db.query(ExaminationService).filter(ExaminationService.record_id == str(r.id)).count()
    doc = db.query(Staff).filter(Staff.id == r.doctor_id).first() if r.doctor_id else None
    dept = db.query(Department).filter(Department.id == doc.department_id).first() if (doc and doc.department_id) else None
    print(" ", str(r.id)[:10], r.diagnosis, "->", doc.name if doc else "?", dept.name if dept else "?", "srvs:", srvs)
