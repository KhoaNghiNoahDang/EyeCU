"""
Seed script: Generate 50 realistic Vietnamese sample records for each patient-related table.
Keeps existing patients & staffs, only seeds:
  - patients (thêm đủ 50)
  - clinical_records (50)
  - vital_signs (50)
  - medications (50)
  - imaging_results (50)
  - follow_ups (50)
  - hospital_fees + hospital_fee_items (50 fees, ~100 items)
  - appointments (50)
  - notifications (50)
  - community_questions (50)
  - consent_forms (50)
"""
import os, uuid, random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.environ.get("DATABASE_URL"))

def rnd_date(start_year=1950, end_year=2005):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    return (start + timedelta(days=random.randint(0, (end - start).days))).strftime("%d/%m/%Y")

def rnd_datetime_past(days=180):
    return datetime.utcnow() - timedelta(days=random.randint(1, days), hours=random.randint(0, 23))

HO = ["Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ","Đặng","Bùi","Đỗ","Hồ","Ngô","Dương","Lý"]
TEN_GIUA = ["Văn","Thị","Hoàng","Minh","Thanh","Quốc","Hữu","Kim","Bảo","Thành","Đức","Anh","Thu","Thi","Hải","Phú"]
TEN_CUOI = ["Hùng","Lan","Minh","Hà","Nam","Phương","Dũng","Linh","Tú","Hương","Trung","Hiếu","Bình","Thảo","Phong","Ánh","Duy","Ngân","Khoa","Mai"]
TINH = ["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng","Cần Thơ","Hải Phòng","Huế","Nha Trang","Vinh","Quy Nhơn","Buôn Ma Thuột","Vũng Tàu","Long Xuyên"]
PHUONG = ["Phường 1","Phường 2","Phường 3","Phường Bình Thạnh","Phường Tân Phú","Phường Gò Vấp","Xã Thạnh Lộc"]
QUAN = ["Quận 1","Quận 3","Quận 5","Quận 7","Quận 9","Quận Bình Thạnh","Quận Tân Bình","Quận Gò Vấp","Huyện Bình Chánh"]
DUONG = ["Lý Thường Kiệt","Nguyễn Huệ","Đinh Tiên Hoàng","Trần Hưng Đạo","Võ Văn Tần","Cách Mạng Tháng 8","Nguyễn Thái Học","Phan Bội Châu"]

def gen_name():
    return f"{random.choice(HO)} {random.choice(TEN_GIUA)} {random.choice(TEN_CUOI)}"

def gen_cccd():
    return "0" + str(random.randint(1,9)) + "".join([str(random.randint(0,9)) for _ in range(10)])

def gen_phone():
    prefixes = ["090","091","093","096","097","098","032","033","034","035","036","038","039","070","079"]
    return random.choice(prefixes) + "".join([str(random.randint(0,9)) for _ in range(7)])

def gen_address():
    so = random.randint(1,200)
    return f"{so} {random.choice(DUONG)}, {random.choice(PHUONG)}, {random.choice(QUAN)}, {random.choice(TINH)}"

BLOOD_TYPES = ["A+","A-","B+","B-","O+","O-","AB+","AB-"]
ALLERGIES = ["Không có","Penicillin","Amoxicillin","Sulfa","Hải sản","Đậu phộng","Phấn hoa","Aspirin","NSAIDs"]
CHRONIC = ["Không có","Tăng huyết áp","Đái tháo đường type 2","Hen phế quản","Bệnh tim mạch","Viêm khớp dạng thấp","Tăng huyết áp, Đái tháo đường","Bệnh thận mạn tính"]
GENDERS = ["Nam","Nữ"]
DEPARTMENTS = ["Nội tổng quát","Ngoại tổng quát","Nhi khoa","Tim mạch","Da liễu","Thần kinh","Tiêu hóa","Hô hấp","Cơ xương khớp","Tai mũi họng","Mắt","Sản phụ khoa","Ung bướu","Thận - Tiết niệu","Nội tiết"]

SYMPTOMS_LIST = [
    "Đau ngực, khó thở","Sốt cao, ho khan","Đau đầu dữ dội, chóng mặt","Tiêu chảy, buồn nôn","Đau bụng trên","Khó thở, thở rít","Ho ra máu","Đau lưng dưới","Phù chân, mệt mỏi","Đau khớp gối",
    "Mất ngủ, lo âu","Đau mắt, mờ mắt","Chảy máu cam","Huyết áp cao","Đường huyết tăng","Ngứa toàn thân","Nổi ban đỏ","Đau họng, nuốt khó","Chóng mặt, ù tai","Tiểu nhiều, tiểu đêm",
]
DIAGNOSES_LIST = [
    "Tăng huyết áp độ 2","Viêm phế quản cấp","Đái tháo đường type 2 chưa kiểm soát","Viêm dạ dày - tá tràng","Hội chứng ruột kích thích","Viêm khớp dạng thấp","Thiếu máu cơ tim","Viêm xoang mạn",
    "Sỏi thận","Gút cấp","Viêm da cơ địa","Trầm cảm nhẹ","Thoát vị đĩa đệm L4-L5","Suy tim độ II","Bệnh phổi tắc nghẽn mạn tính","Viêm kết mạc","Hội chứng tiền đình","Đau đầu căng thẳng",
]
MEDS = [
    ("Amlodipine 5mg","1 viên/ngày","Uống sau ăn sáng"),("Metformin 500mg","2 viên x 2 lần/ngày","Uống trong bữa ăn"),("Omeprazole 20mg","1 viên/ngày","Uống trước ăn 30 phút"),
    ("Atorvastatin 20mg","1 viên/ngày buổi tối","Uống sau ăn"),("Losartan 50mg","1 viên/ngày","Uống sáng"),("Salbutamol 2.5mg","Khí dung khi khó thở","Theo chỉ định"),
    ("Paracetamol 500mg","1 viên x 3 lần/ngày","Uống khi đau"),("Amoxicillin 500mg","1 viên x 3 lần/ngày 7 ngày","Uống đủ liều"),("Ibuprofen 400mg","1 viên x 2 lần/ngày","Uống sau ăn"),
    ("Cetirizine 10mg","1 viên/ngày buổi tối","Chống dị ứng"),("Bisoprolol 5mg","1 viên/ngày","Uống sáng trước ăn"),("Furosemide 40mg","1 viên/ngày","Uống sáng"),
]
IMAGE_TYPES = ["X-Quang ngực","Siêu âm bụng","CT não","MRI cột sống","Siêu âm tim","X-Quang khớp gối","CT ngực","Siêu âm tuyến giáp","MRI khớp vai","Nội soi dạ dày"]
IMAGE_CONCLUSIONS = [
    "Bình thường, không có tổn thương đáng kể","Tim to độ I, không có dịch màng phổi","Gan nhẹ, không có u nang hay khối","Thoái hóa cột sống L4-L5, gai xương","Chức năng tim bình thường, EF 65%",
    "Sỏi thận phải 8mm","Viêm xoang hàm hai bên","Không phát hiện bất thường","Tổn thương phổi cần theo dõi","Tuyến giáp bình thường",
]
FEE_ITEMS = [
    ("Khám bệnh",150000),("Xét nghiệm máu",200000),("Siêu âm",250000),("X-Quang",180000),("CT-Scan",800000),("MRI",1200000),
    ("Nội soi",500000),("Điện tim",100000),("Đo huyết áp 24h",300000),("Tư vấn dinh dưỡng",100000),("Thuốc điều trị",350000),("Chi phí giường bệnh",500000),
]
CONSENT_DOCS = ["Cam kết điều trị nội khoa","Phiếu chấp thuận phẫu thuật","Đồng ý thủ thuật xâm lấn","Cam kết sử dụng thuốc có rủi ro","Đồng ý thu thập thông tin y tế","Chấp thuận gây mê toàn thân"]
COMMUNITY_QS = [
    ("Nội tổng quát","Huyết áp cao có cần nhịn ăn khi xét nghiệm không?","Thưa bạn, các xét nghiệm mỡ máu, đường huyết cần nhịn ăn 8-12 tiếng. Tuy nhiên nếu chỉ xét nghiệm huyết áp thì không cần nhịn ăn ạ."),
    ("Nhi khoa","Bé 2 tuổi bị sốt 38.5 độ có cần đến viện không?","Bé sốt 38.5°C thì có thể theo dõi tại nhà, cho uống paracetamol theo cân nặng. Nếu sốt trên 39°C, sốt kéo dài trên 2 ngày hoặc bé lừ đừ thì cần đến viện ngay ạ."),
    ("Tim mạch","Đau ngực trái kèm khó thở có phải tim mạch không?","Triệu chứng của bạn cần được thăm khám trực tiếp. Đau ngực kèm khó thở có thể do nhiều nguyên nhân, trong đó có bệnh tim mạch. Vui lòng đến khoa Tim mạch để được kiểm tra sớm."),
    ("Sản phụ khoa","Thai 36 tuần, đau bụng lâm râm có phải chuyển dạ chưa?","Đau bụng lâm râm ở tuần 36 có thể là dấu hiệu chuyển dạ sớm. Bạn cần đến cơ sở y tế gần nhất để được kiểm tra, đặc biệt nếu kèm theo ra máu hoặc vỡ ối."),
    ("Tiêu hóa","Đau bụng trên sau ăn, ợ chua có phải viêm dạ dày không?","Triệu chứng bạn mô tả có thể là viêm dạ dày hoặc trào ngược thực quản. Khuyến nghị nội soi dạ dày để chẩn đoán chính xác và điều trị phù hợp."),
    ("Thần kinh","Hay bị đau đầu một bên kèm buồn nôn là bệnh gì?","Triệu chứng này rất giống chứng đau nửa đầu (migraine). Bạn nên đến khoa Thần kinh để được thăm khám và điều trị phù hợp, tránh lạm dụng thuốc giảm đau."),
    ("Nội tiết","Đường huyết lúc đói 7.2 mmol/L có phải tiểu đường không?","Đường huyết lúc đói ≥ 7.0 mmol/L được chẩn đoán là đái tháo đường theo tiêu chuẩn WHO. Bạn cần đến khoa Nội tiết để được thăm khám và tư vấn điều trị sớm."),
    ("Cơ xương khớp","Đau đầu gối khi leo cầu thang có phải thoái hóa không?","Đau gối khi leo cầu thang thường là dấu hiệu thoái hóa khớp gối. Cần chụp X-Quang để xác định mức độ và có phác đồ điều trị phù hợp ạ."),
]
NOTIF_TYPES = ["appointment_reminder","result","system"]
NOTIF_TITLES = [
    ("Nhắc lịch tái khám","appointment_reminder"),("Kết quả xét nghiệm đã có","result"),("Kết quả siêu âm cập nhật","result"),
    ("Hóa đơn viện phí","system"),("Nhắc uống thuốc","system"),("Lịch hẹn xác nhận","appointment_reminder"),
    ("Kết quả CT-Scan sẵn sàng","result"),("Thông báo kết quả khám","result"),
]

with engine.connect() as conn:
    # --- 1. Thêm 50 bệnh nhân mới ---
    print("Seeding patients...")
    existing = conn.execute(text("SELECT COUNT(*) FROM patients")).scalar()
    to_add = max(0, 50 - existing)
    patient_ids = [r[0] for r in conn.execute(text("SELECT id FROM patients")).fetchall()]
    for i in range(to_add):
        pid = uuid.uuid4()
        patient_ids.append(pid)
        gender = random.choice(GENDERS)
        name = gen_name()
        cccd = gen_cccd()
        dob = rnd_date(1950, 2005)
        has_bhxh = random.random() > 0.3
        has_allergies = random.random() > 0.6
        has_chronic = random.random() > 0.6
        has_emergency = random.random() > 0.2

        conn.execute(text("""
            INSERT INTO patients (id,name,cccd,phone,dob,gender,address,hometown,blood_type,allergies,chronic_conditions,
                emergency_contact_name,emergency_contact_phone,password_hash,created_at, bhxh_code)
            VALUES (:id,:name,:cccd,:phone,:dob,:gender,:address,:hometown,:bt,:al,:ch,:ecn,:ecp,:ph,:ca,:bhxh)
        """), {
            "id": pid, "name": name, "cccd": cccd, "phone": gen_phone(),
            "dob": dob, "gender": gender, "address": gen_address(), "hometown": random.choice(TINH),
            "bt": random.choice(BLOOD_TYPES), 
            "al": random.choice(ALLERGIES) if has_allergies else None,
            "ch": random.choice(CHRONIC) if has_chronic else None,
            "ecn": gen_name() if has_emergency else None, 
            "ecp": gen_phone() if has_emergency else None,
            "ph": "$2b$12$placeholder_hash_for_seeded_patient",
            "ca": rnd_datetime_past(365),
            "bhxh": f"GD{random.randint(1000000000, 9999999999)}" if has_bhxh else None
        })
    conn.commit()
    patient_ids = [r[0] for r in conn.execute(text("SELECT id FROM patients WHERE name != 'test'")).fetchall()]
    staff_ids = [r[0] for r in conn.execute(text("SELECT id FROM staffs WHERE role='doctor'")).fetchall()]
    if not staff_ids:
        staff_ids = [r[0] for r in conn.execute(text("SELECT id FROM staffs LIMIT 5")).fetchall()]
    dept_ids = [r[0] for r in conn.execute(text("SELECT id FROM departments LIMIT 15")).fetchall()]
    print(f"  patients: {len(patient_ids)}, staff: {len(staff_ids)}")

    # --- 2. clinical_records ---
    print("Seeding clinical_records...")
    conn.execute(text("DELETE FROM medications WHERE record_id IN (SELECT id FROM clinical_records)"))
    conn.execute(text("DELETE FROM imaging_results WHERE record_id IN (SELECT id FROM clinical_records)"))
    conn.execute(text("DELETE FROM hospital_fee_items WHERE fee_id IN (SELECT id FROM hospital_fees WHERE record_id IN (SELECT id FROM clinical_records))"))
    conn.execute(text("DELETE FROM hospital_fees WHERE record_id IN (SELECT id FROM clinical_records)"))
    conn.execute(text("DELETE FROM follow_ups WHERE record_id IN (SELECT id FROM clinical_records)"))
    conn.execute(text("DELETE FROM clinical_records"))
    conn.commit()
    record_ids = []
    record_patient_map = {}
    for i in range(50):
        rid = uuid.uuid4()
        pid = random.choice(patient_ids)
        sid = random.choice(staff_ids)
        record_ids.append(rid)
        record_patient_map[rid] = pid
        # Create encounter first
        eid = uuid.uuid4()
        conn.execute(text("""
            INSERT INTO encounters (id, patient_id, status, created_at)
            VALUES (:id, :pid, :st, :ca)
        """), {
            "id": eid, "pid": pid,
            "st": random.choice(["active","completed"]),
            "ca": rnd_datetime_past(90),
        })
        conn.execute(text("""
            INSERT INTO clinical_records (id,patient_id,doctor_id,encounter_id,symptoms,diagnosis,notes,is_signed,created_at)
            VALUES (:id,:pid,:did,:eid,:sym,:diag,:notes,:signed,:ca)
        """), {
            "id": rid, "pid": pid, "did": sid, "eid": eid,
            "sym": random.choice(SYMPTOMS_LIST),
            "diag": random.choice(DIAGNOSES_LIST),
            "notes": random.choice(["Bệnh nhân đáp ứng tốt với điều trị","Theo dõi thêm 2 tuần","Tái khám sau 1 tháng","Cần xét nghiệm bổ sung","Kiểm soát tốt","Cần điều chỉnh thuốc"]),
            "signed": random.random() > 0.3,
            "ca": rnd_datetime_past(90),
        })
    conn.commit()

    # --- 3. vital_signs ---
    print("Seeding vital_signs...")
    conn.execute(text("DELETE FROM vital_signs"))
    conn.commit()
    for i in range(50):
        pid = random.choice(patient_ids)
        # create an encounter for vital_signs
        eid2 = uuid.uuid4()
        conn.execute(text("INSERT INTO encounters (id, patient_id, status, created_at) VALUES (:id, :pid, 'completed', :ca)"),
            {"id": eid2, "pid": pid, "ca": rnd_datetime_past(30)})
        conn.execute(text("""
            INSERT INTO vital_signs (id,encounter_id,heart_rate,spo2,measured_at)
            VALUES (:id,:eid,:hr,:spo2,:ma)
        """), {
            "id": uuid.uuid4(), "eid": eid2,
            "hr": random.randint(60, 110),
            "spo2": random.randint(94, 100),
            "ma": rnd_datetime_past(30),
        })
    conn.commit()

    # --- 4. medications ---
    print("Seeding medications...")
    conn.execute(text("DELETE FROM medications"))
    conn.commit()
    for i in range(50):
        rid = random.choice(record_ids)
        med = random.choice(MEDS)
        conn.execute(text("""
            INSERT INTO medications (id,record_id,medicine_name,dosage,instructions)
            VALUES (:id,:rid,:mn,:do,:ins)
        """), {"id": uuid.uuid4(), "rid": rid, "mn": med[0], "do": med[1], "ins": med[2]})
    conn.commit()

    # --- 5. imaging_results ---
    print("Seeding imaging_results...")
    conn.execute(text("DELETE FROM imaging_results"))
    conn.commit()
    for i in range(50):
        pid = random.choice(patient_ids)
        rid = random.choice(record_ids)
        img_type = random.choice(IMAGE_TYPES)
        conn.execute(text("""
            INSERT INTO imaging_results (id,patient_id,record_id,image_type,image_url,description,conclusion,created_at)
            VALUES (:id,:pid,:rid,:it,:iu,:desc,:concl,:ca)
        """), {
            "id": uuid.uuid4(), "pid": pid, "rid": rid,
            "it": img_type,
            "iu": f"https://placehold.co/800x600/88E8F2/0d1f2d?text={img_type.replace(' ','+').replace('-','+')}",
            "desc": f"Chỉ định: {img_type} để đánh giá tình trạng bệnh nhân",
            "concl": random.choice(IMAGE_CONCLUSIONS),
            "ca": rnd_datetime_past(60),
        })
    conn.commit()

    # --- 6. follow_ups ---
    print("Seeding follow_ups...")
    conn.execute(text("DELETE FROM follow_ups"))
    conn.commit()
    for i in range(50):
        rid = random.choice(record_ids)
        pid = record_patient_map[rid]
        future_date = datetime.utcnow() + timedelta(days=random.randint(3, 60))
        conn.execute(text("""
            INSERT INTO follow_ups (id,patient_id,record_id,date,time,department,note,status,created_at)
            VALUES (:id,:pid,:rid,:dt,:tm,:dept,:note,:st,:ca)
        """), {
            "id": uuid.uuid4(), "pid": pid, "rid": rid,
            "dt": future_date.strftime("%Y-%m-%d"),
            "tm": f"{random.randint(7,15):02d}:{random.choice(['00','30'])}",
            "dept": random.choice(DEPARTMENTS),
            "note": random.choice(["Tái khám kiểm tra huyết áp","Kiểm tra đường huyết","Xem kết quả xét nghiệm","Theo dõi sau điều trị","Kiểm tra định kỳ"]),
            "st": random.choice(["pending","booked"]),
            "ca": rnd_datetime_past(30),
        })
    conn.commit()

    # --- 7. hospital_fees + items ---
    print("Seeding hospital_fees...")
    conn.execute(text("DELETE FROM hospital_fee_items"))
    conn.execute(text("DELETE FROM hospital_fees"))
    conn.commit()
    for i in range(50):
        fid = uuid.uuid4()
        rid = random.choice(record_ids)
        pid = record_patient_map[rid]
        items = random.sample(FEE_ITEMS, k=random.randint(2,5))
        total = sum(it[1] for it in items)
        paid = random.random() > 0.4
        conn.execute(text("""
            INSERT INTO hospital_fees (id,patient_id,record_id,total,status,paid_at)
            VALUES (:id,:pid,:rid,:tot,:st,:pa)
        """), {
            "id": fid, "pid": pid, "rid": rid,
            "tot": total, "st": "paid" if paid else "pending",
            "pa": rnd_datetime_past(60) if paid else None,
        })
        for item in items:
            conn.execute(text("INSERT INTO hospital_fee_items (id,fee_id,name,amount) VALUES (:id,:fid,:name,:amt)"),
                {"id": uuid.uuid4(), "fid": fid, "name": item[0], "amt": item[1]})
    conn.commit()

    # --- 8. appointments ---
    print("Seeding appointments...")
    conn.execute(text("DELETE FROM appointments"))
    conn.commit()
    for i in range(50):
        pid = random.choice(patient_ids)
        future = datetime.utcnow() + timedelta(days=random.randint(-30, 60))
        conn.execute(text("""
            INSERT INTO appointments (id,patient_id,department_id,doctor_id,booking_date,booking_time,reason,status,created_at)
            VALUES (:id,:pid,:did,:docid,:dt,:tm,:reason,:st,:ca)
        """), {
            "id": uuid.uuid4(), "pid": pid,
            "did": random.choice(dept_ids) if dept_ids else None,
            "docid": random.choice(staff_ids) if staff_ids else None,
            "dt": future.strftime("%Y-%m-%d"),
            "tm": f"{random.randint(7,15):02d}:{random.choice(['00','30'])}",
            "reason": random.choice(["Khám định kỳ","Tái khám theo hẹn","Khám chuyên khoa","Xem kết quả xét nghiệm","Khám sức khỏe tổng quát"]),
            "st": random.choice(["pending","confirmed","cancelled"]),
            "ca": rnd_datetime_past(30),
        })
    conn.commit()

    # --- 9. notifications ---
    print("Seeding notifications...")
    conn.execute(text("DELETE FROM notifications"))
    conn.commit()
    for i in range(50):
        pid = random.choice(patient_ids)
        notif = random.choice(NOTIF_TITLES)
        conn.execute(text("""
            INSERT INTO notifications (id,patient_id,title,content,type,is_read,created_at)
            VALUES (:id,:pid,:title,:content,:type,:read,:ca)
        """), {
            "id": uuid.uuid4(), "pid": pid,
            "title": notif[0], "type": notif[1],
            "content": random.choice([
                "Bạn có lịch tái khám vào ngày mai lúc 8:00. Vui lòng đến đúng giờ.",
                "Kết quả xét nghiệm của bạn đã sẵn sàng. Vui lòng đăng nhập để xem.",
                "Nhắc nhở: Uống thuốc Amlodipine 5mg sau bữa sáng hôm nay.",
                "Hóa đơn viện phí của bạn đã được cập nhật. Vui lòng thanh toán.",
                "Lịch hẹn khám chuyên khoa Tim mạch của bạn đã được xác nhận.",
                "Kết quả siêu âm bụng của bạn đã có. Bác sĩ sẽ tư vấn trong buổi tái khám.",
                "Nhắc nhở tái khám: Kiểm tra huyết áp định kỳ sau 1 tháng điều trị.",
            ]),
            "read": random.random() > 0.5,
            "ca": rnd_datetime_past(30),
        })
    conn.commit()

    # --- 10. community_questions ---
    print("Seeding community_questions...")
    conn.execute(text("DELETE FROM community_questions"))
    conn.commit()
    for i in range(50):
        pid = random.choice(patient_ids)
        qa = random.choice(COMMUNITY_QS)
        answered = random.random() > 0.3
        conn.execute(text("""
            INSERT INTO community_questions (id,patient_id,department,question,answer,status,created_at,answered_at)
            VALUES (:id,:pid,:dept,:q,:a,:st,:ca,:aa)
        """), {
            "id": uuid.uuid4(), "pid": pid,
            "dept": qa[0], "q": qa[1],
            "a": qa[2] if answered else None,
            "st": "answered" if answered else "unanswered",
            "ca": rnd_datetime_past(60),
            "aa": rnd_datetime_past(30) if answered else None,
        })
    conn.commit()

    # --- 11. consent_forms ---
    print("Seeding consent_forms...")
    conn.execute(text("DELETE FROM consent_forms"))
    conn.commit()
    for i in range(50):
        pid = random.choice(patient_ids)
        doc = random.choice(CONSENT_DOCS)
        signed = random.random() > 0.3
        conn.execute(text("""
            INSERT INTO consent_forms (id,patient_id,document_name,content,is_signed,signed_at,created_at)
            VALUES (:id,:pid,:dn,:content,:signed,:sa,:ca)
        """), {
            "id": uuid.uuid4(), "pid": pid, "dn": doc,
            "content": f"Tôi đồng ý với các điều khoản trong văn bản '{doc}' và cam kết tuân thủ phác đồ điều trị của bác sĩ.",
            "signed": signed,
            "sa": rnd_datetime_past(30) if signed else None,
            "ca": rnd_datetime_past(60),
        })
    conn.commit()

    print("\n✅ Seeding hoàn tất! Kiểm tra số lượng:")
    tables = ["patients","clinical_records","vital_signs","medications","imaging_results",
              "follow_ups","hospital_fees","hospital_fee_items","appointments","notifications",
              "community_questions","consent_forms"]
    with engine.connect() as c2:
        for t in tables:
            cnt = c2.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            print(f"  {t}: {cnt} rows")
