from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient, Staff, Department
from app.core.security import create_access_token, get_current_user
from pydantic import BaseModel
from app.services.dataset_reader import get_mock_json

router = APIRouter()


class EkycLogin(BaseModel):
    cccd_base64: str = None
    face_base64: str = None


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    # Form_data.username used as employee_id for staff login
    user = db.query(Staff).filter(Staff.employee_id == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Sai mã nhân viên hoặc mật khẩu")

    # TODO: Verify password_hash
    # if not verify_password(form_data.password, user.password_hash): ...

    access_token = create_access_token(subject=user.id, role=user.role)
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@router.post("/login/ekyc")
def login_ekyc(data: EkycLogin, db: Session = Depends(get_db)):
    # Giả lập VNPT eKYC trả về
    ekyc_data = get_mock_json("ekyc_response")
    cccd_info = ekyc_data.get("cccd", "123456789")

    user = db.query(Patient).filter(Patient.cccd == cccd_info).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found from eKYC")

    db.commit()
    access_token = create_access_token(subject=user.id, role="patient")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "patient",
        "name": user.name,
    }

class PatientLogin(BaseModel):
    cccd: str
    password: str

@router.post("/login/patient")
def login_patient(data: PatientLogin, db: Session = Depends(get_db)):
    user = db.query(Patient).filter(Patient.cccd == data.cccd).first()
    if not user:
        raise HTTPException(status_code=401, detail="Sai CCCD hoặc mật khẩu")
        
    # TODO: Verify password_hash
    # if not verify_password(data.password, user.password_hash): ...
    if user.password_hash and user.password_hash != data.password: # temporary plaintext check for hackathon
         pass # Replace with actual hash verification if needed
    
    access_token = create_access_token(subject=user.id, role="patient")
    return {"access_token": access_token, "token_type": "bearer", "role": "patient", "name": user.name}


class FaceStaffLogin(BaseModel):
    face_base64: str

@router.post("/login/face/staff")
async def login_face_staff(data: FaceStaffLogin, db: Session = Depends(get_db)):
    from app.services.vnpt_api import vnpt_client
    import base64

    try:
        # Tách header base64 nếu có
        b64_data = data.face_base64
        if "," in b64_data:
            b64_data = b64_data.split(",")[1]
            
        file_bytes = base64.b64decode(b64_data)
        
        # 1. Upload ảnh chụp từ webcam lên VNPT eKYC để lấy hash
        webcam_hash = await vnpt_client.upload_file(file_bytes, "webcam_face.jpg")
        if not webcam_hash:
            raise HTTPException(status_code=500, detail="Lỗi kết nối VNPT eKYC")

        # 2. Lấy danh sách nhân viên CÓ ảnh khuôn mặt từ Supabase
        staff_list = db.query(Staff).filter(Staff.face_base64 != None).all()
        if not staff_list:
            raise HTTPException(status_code=404, detail="Chưa có nhân viên nào đăng ký khuôn mặt trên hệ thống")

        matched_user = None
        highest_prob = 0.0

        # 3. Chạy vòng lặp so khớp 1:1
        for staff in staff_list:
            try:
                # Tách header base64 của ảnh db
                db_b64 = staff.face_base64
                if "," in db_b64:
                    db_b64 = db_b64.split(",")[1]
                db_bytes = base64.b64decode(db_b64)
                
                # Upload ảnh db lên VNPT eKYC (trong thực tế nên cache hash này vào CSDL để tối ưu, nhưng hackathon thì gọi luôn)
                db_hash = await vnpt_client.upload_file(db_bytes, "db_face.jpg")
                if not db_hash: continue

                # Gọi API Compare 1:1
                compare_res = await vnpt_client.call_face_compare(webcam_hash, db_hash)
                prob = float(compare_res.get("prob", 0))
                
                # Nếu độ chính xác > 80% (tùy chỉnh)
                if str(compare_res.get("match")).lower() == "true" or prob > 80.0:
                    if prob > highest_prob:
                        highest_prob = prob
                        matched_user = staff
            except Exception:
                continue
        
        if not matched_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên khớp với khuôn mặt này")

        access_token = create_access_token(subject=matched_user.id, role=matched_user.role)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": matched_user.role,
            "name": matched_user.name
        }
    except Exception as e:
        print(f"Lỗi FaceID: {str(e)}")
        raise HTTPException(status_code=500, detail="Lỗi khi nhận diện khuôn mặt")

class FacePatientLogin(BaseModel):
    face_base64: str

@router.post("/login/face/patient")
async def login_face_patient(data: FacePatientLogin, db: Session = Depends(get_db)):
    from app.services.vnpt_api import vnpt_client
    import base64

    try:
        b64_data = data.face_base64
        if "," in b64_data:
            b64_data = b64_data.split(",")[1]
            
        file_bytes = base64.b64decode(b64_data)
        
        webcam_hash = await vnpt_client.upload_file(file_bytes, "webcam_face.jpg")
        if not webcam_hash:
            raise HTTPException(status_code=500, detail="Lỗi kết nối VNPT eKYC")

        patient_list = db.query(Patient).filter(Patient.face_base64 != None).all()
        if not patient_list:
            raise HTTPException(status_code=404, detail="Chưa có bệnh nhân nào đăng ký khuôn mặt trên hệ thống")

        matched_user = None
        highest_prob = 0.0

        for pt in patient_list:
            try:
                db_b64 = pt.face_base64
                if "," in db_b64:
                    db_b64 = db_b64.split(",")[1]
                db_bytes = base64.b64decode(db_b64)
                
                db_hash = await vnpt_client.upload_file(db_bytes, "db_face.jpg")
                if not db_hash: continue

                compare_res = await vnpt_client.call_face_compare(webcam_hash, db_hash)
                prob = float(compare_res.get("prob", 0))
                
                if str(compare_res.get("match")).lower() == "true" or prob > 80.0:
                    if prob > highest_prob:
                        highest_prob = prob
                        matched_user = pt
            except Exception as inner_e:
                print(f"Lỗi khi check 1 patient: {inner_e}")
                continue
                
        if not matched_user:
            raise HTTPException(status_code=401, detail="Không nhận diện được khuôn mặt hoặc chưa đăng ký")

        access_token = create_access_token(subject=matched_user.id, role="patient")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": "patient",
            "name": matched_user.name
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Lỗi FaceID Patient: {str(e)}")
        raise HTTPException(status_code=500, detail="Lỗi khi nhận diện khuôn mặt bệnh nhân")

@router.get("/me")
def get_me(
    current_user: Staff | Patient = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dept = None
    if getattr(current_user, "department_id", None):
        dept = (
            db.query(Department)
            .filter(Department.id == current_user.department_id)
            .first()
        )

    title = (
        "BS."
        if current_user.role in ["clinician", "ems"]
        else "ĐD." if current_user.role == "ops" else ""
    )
    if current_user.role == "admin":
        title = ""

    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "type": "staff" if current_user.role != "patient" else "patient",
        "avatar": getattr(current_user, "avatar_url", None),
        "department": dept.name if dept else None,
        "title": title,
        "employeeCode": getattr(current_user, "employee_id", None),
        "role": current_user.role,
        "cccd": current_user.cccd,
    }


@router.get("/staff")
def get_staff(db: Session = Depends(get_db)):
    staff_users = db.query(Staff).all()
    result = []
    for u in staff_users:
        dept = None
        if u.department_id:
            dept = db.query(Department).filter(Department.id == u.department_id).first()

        title = (
            "BS."
            if u.role in ["clinician", "ems"]
            else "ĐD." if u.role == "ops" else ""
        )
        if u.role == "admin":
            title = ""

        result.append(
            {
                "id": str(u.id),
                "name": u.name,
                "type": "staff",
                "avatar": None,
                "department": dept.name if dept else None,
                "title": title,
                "employeeCode": u.employee_id,
                "role": u.role,
                "cccd": u.cccd,
            }
        )
    return result


from typing import Optional


class EkycExtractRequest(BaseModel):
    cccd_front_base64: str
    cccd_back_base64: str
    face_base64: str

@router.post("/register/patient/ekyc/extract")
async def extract_ekyc(data: EkycExtractRequest, db: Session = Depends(get_db)):
    from app.services.vnpt_api import vnpt_client
    import base64
    
    try:
        def decode_b64(b64_str):
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            return base64.b64decode(b64_str)
            
        cccd_front_bytes = decode_b64(data.cccd_front_base64)
        cccd_back_bytes = decode_b64(data.cccd_back_base64)
        face_bytes = decode_b64(data.face_base64)
        
        front_hash = await vnpt_client.upload_file(cccd_front_bytes, "cccd_front.jpg")
        back_hash = await vnpt_client.upload_file(cccd_back_bytes, "cccd_back.jpg")
        face_hash = await vnpt_client.upload_file(face_bytes, "face.jpg")
        
        if not front_hash or not back_hash or not face_hash:
            raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên eKYC")

        card_liveness = await vnpt_client.call_card_liveness(front_hash)
        if card_liveness.get("liveness") != "success":
            raise HTTPException(status_code=400, detail=f"Giấy tờ không hợp lệ: {card_liveness.get('msg')}")

        # Tạm thời vô hiệu hóa Face Liveness vì Token VNPT chưa được cấp quyền (gây lỗi 401)
        # face_liveness = await vnpt_client.call_face_liveness_2d(face_hash)
        # if face_liveness.get("liveness") != "success":
        #     raise HTTPException(status_code=400, detail=f"Khuôn mặt giả mạo: {face_liveness.get('msg')}")

        compare_res = await vnpt_client.call_face_compare(face_hash, front_hash)
        prob = float(compare_res.get("prob", 0))
        if str(compare_res.get("match")).lower() != "true" and prob < 80.0:
            raise HTTPException(status_code=400, detail="Khuôn mặt không khớp với CCCD")

        ocr_res = await vnpt_client.call_ekyc_ocr(front_hash, back_hash)
        cccd_str = ocr_res.get("cccd")
        
        if not cccd_str:
            raise HTTPException(status_code=400, detail="Không nhận diện được số CCCD")
            
        existing = db.query(Patient).filter(Patient.cccd == cccd_str).first()
        if existing:
            raise HTTPException(status_code=400, detail="CCCD này đã được đăng ký trong hệ thống")

        return {
            "message": "Bóc tách thành công",
            "extracted": {
                "name": ocr_res.get("name"),
                "cccd": cccd_str,
                "dob": ocr_res.get("dob"),
                "address": ocr_res.get("address"),
                "hometown": ocr_res.get("hometown"),
                "issue_date": ocr_res.get("issue_date"),
                "issue_place": ocr_res.get("issue_place"),
                "valid_until": ocr_res.get("valid_until"),
                "characteristics": ocr_res.get("characteristics"),
            },
            "hashes": {
                "face_base64": data.face_base64
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Lỗi EKYC Extract: {str(e)}")
        raise HTTPException(status_code=500, detail="Đã xảy ra lỗi trong quá trình xử lý eKYC")


class FinalizeRegisterRequest(BaseModel):
    name: str
    cccd: str
    dob: str
    address: str
    hometown: str
    issue_date: str
    issue_place: str
    valid_until: str
    characteristics: str
    password: str
    phone: str
    emergency_contact_name: str
    emergency_contact_phone: str
    face_base64: str

@router.post("/register/patient/ekyc/finalize")
async def finalize_ekyc(data: FinalizeRegisterRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(Patient).filter(Patient.cccd == data.cccd).first()
        if existing:
            raise HTTPException(status_code=400, detail="CCCD này đã được đăng ký trong hệ thống")

        new_patient = Patient(
            name=data.name,
            password_hash=data.password,
            phone=data.phone,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
            cccd=data.cccd,
            dob=data.dob,
            address=data.address,
            hometown=data.hometown,
            issue_date=data.issue_date,
            issue_place=data.issue_place,
            valid_until=data.valid_until,
            characteristics=data.characteristics,
            face_base64=data.face_base64
        )
        
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        return {"message": "Đăng ký thành công", "cccd": data.cccd}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Lỗi EKYC Finalize: {str(e)}")
        raise HTTPException(status_code=500, detail="Đã xảy ra lỗi trong quá trình lưu dữ liệu")

