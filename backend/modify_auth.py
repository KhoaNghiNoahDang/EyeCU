import re

with open('app/api/auth.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_api = """
from typing import Optional

class RegisterPatientEkyc(BaseModel):
    name: str
    password: str
    phone: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    cccd_front_base64: str
    face_base64: str

@router.post("/register/patient/ekyc")
async def register_patient_ekyc(data: RegisterPatientEkyc, db: Session = Depends(get_db)):
    from app.services.vnpt_api import vnpt_client
    import base64
    
    try:
        def decode_b64(b64_str):
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            return base64.b64decode(b64_str)
            
        cccd_bytes = decode_b64(data.cccd_front_base64)
        face_bytes = decode_b64(data.face_base64)
        
        webcam_hash = await vnpt_client.upload_file(cccd_bytes, "cccd_front.jpg")
        face_hash = await vnpt_client.upload_file(face_bytes, "face.jpg")
        
        if not webcam_hash or not face_hash:
            raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên eKYC")

        card_liveness = await vnpt_client.call_card_liveness(webcam_hash)
        if card_liveness.get("liveness") != "success":
            raise HTTPException(status_code=400, detail=f"Giấy tờ không hợp lệ: {card_liveness.get('msg')}")

        face_liveness = await vnpt_client.call_face_liveness_2d(face_hash)
        if face_liveness.get("liveness") != "success":
            raise HTTPException(status_code=400, detail=f"Khuôn mặt giả mạo: {face_liveness.get('msg')}")

        compare_res = await vnpt_client.call_face_compare(face_hash, webcam_hash)
        prob = float(compare_res.get("prob", 0))
        if str(compare_res.get("match")).lower() != "true" and prob < 80.0:
            raise HTTPException(status_code=400, detail="Khuôn mặt không khớp với CCCD")

        ocr_res = await vnpt_client.call_ekyc_ocr(webcam_hash)
        cccd_str = ocr_res.get("cccd")
        
        if not cccd_str:
            raise HTTPException(status_code=400, detail="Không nhận diện được số CCCD")
            
        existing = db.query(Patient).filter(Patient.cccd == cccd_str).first()
        if existing:
            raise HTTPException(status_code=400, detail="CCCD này đã được đăng ký trong hệ thống")

        new_patient = Patient(
            name=data.name,
            password_hash=data.password,
            phone=data.phone,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
            cccd=cccd_str,
            dob=ocr_res.get("dob"),
            address=ocr_res.get("address"),
            hometown=ocr_res.get("address"),
            face_base64=data.face_base64
        )
        
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        return {"message": "Đăng ký thành công", "cccd": cccd_str}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"Lỗi EKYC Đăng ký: {str(e)}")
        raise HTTPException(status_code=500, detail="Đã xảy ra lỗi trong quá trình xử lý eKYC")
"""

# Append to the end of auth.py
with open('app/api/auth.py', 'a', encoding='utf-8') as f:
    f.write("\n" + new_api + "\n")
print("Appended ekyc API to auth.py")
