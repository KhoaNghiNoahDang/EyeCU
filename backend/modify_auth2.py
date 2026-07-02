import re

with open('app/api/auth.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old /register/patient/ekyc API
pattern = re.compile(r'class RegisterPatientEkyc\(BaseModel\):.*', re.DOTALL)
content = pattern.sub('', content)

new_apis = """
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

        face_liveness = await vnpt_client.call_face_liveness_2d(face_hash)
        if face_liveness.get("liveness") != "success":
            raise HTTPException(status_code=400, detail=f"Khuôn mặt giả mạo: {face_liveness.get('msg')}")

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
"""

with open('app/api/auth.py', 'w', encoding='utf-8') as f:
    f.write(content.strip() + "\n\n" + new_apis + "\n")
print("Updated auth.py")
