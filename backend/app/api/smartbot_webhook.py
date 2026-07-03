from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient, Staff, Department, Appointment
import uuid
import datetime

router = APIRouter()

@router.post("/webhook/smartbot/tra-cuu-lich")
async def smartbot_webhook_tracuu_lich(request: Request, db: Session = Depends(get_db)):
    """
    API: Tra cứu lịch khám (Cá nhân & Bác sĩ)
    """
    try:
        data = await request.json()
        sender_id = data.get("sender_id")
        variables = data.get("set_variables", {})
        
        loai_tra_cuu = data.get("loai_tra_cuu", "ca_nhan")
        ngay_tra_cuu = variables.get("ngay_tra_cuu", "")
        
        if loai_tra_cuu == "ca_nhan":
            patient = db.query(Patient).filter((Patient.cccd == sender_id) | (Patient.id == sender_id)).first()
            if not patient:
                return JSONResponse(content={
                    "set_variables": {"api_status": "0"},
                    "bot_responses": [{"type": "text", "text": "Không tìm thấy thông tin bệnh nhân trong hệ thống."}]
                }, status_code=200)

            query = db.query(Appointment).filter(Appointment.patient_id == patient.id, Appointment.status != "cancelled")
            
            if ngay_tra_cuu:
                # Lọc theo ngày nếu người dùng có nhập
                query = query.filter(Appointment.date.ilike(f"%{ngay_tra_cuu}%"))
                
            appointments = query.order_by(Appointment.date.desc()).all()
            
            if not appointments:
                return JSONResponse(content={
                    "set_variables": {"api_status": "1"},
                    "bot_responses": [{
                        "type": "text", 
                        "text": f"Hiện không có lịch khám nào trong ngày {ngay_tra_cuu}. Bạn có muốn đặt lịch khám không?",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Có",
                                "payload": "?ic_bot_button_Dat_lich_kham",
                                "button_variables": []
                            },
                            {
                                "type": "postback",
                                "title": "Không",
                                "payload": "?ic_bot_button_Khong_Dat_Lich",
                                "button_variables": []
                            }
                        ]
                    }]
                }, status_code=200)
                
            text_response = f"Dưới đây là các lịch hẹn của bạn:\n"
            for apt in appointments:
                doctor = db.query(Staff).filter(Staff.id == apt.doctor_id).first()
                doc_name = doctor.name if doctor else "Bác sĩ"
                
                dept_name = "Khoa Khám Bệnh"
                if doctor and doctor.department_id:
                    dept = db.query(Department).filter(Department.id == doctor.department_id).first()
                    if dept:
                        dept_name = dept.name
                        
                text_response += f"• Ngày giờ: {apt.time} ngày {apt.date}\n"
                text_response += f"• Địa điểm: Phòng 101 - Tầng 1\n"
                text_response += f"• Khoa: {dept_name}\n"
                text_response += f"• Tên bác sĩ: BS. {doc_name}\n\n"

            return JSONResponse(content={
                "set_variables": {"api_status": "1"},
                "bot_responses": [{"type": "text", "text": text_response}]
            }, status_code=200)
            
        return JSONResponse(content={
            "set_variables": {"api_status": "0"},
            "bot_responses": [{"type": "text", "text": "Loại tra cứu không hợp lệ."}]
        }, status_code=200)

    except Exception as e:
        return JSONResponse(content={"bot_responses": [{"type": "text", "text": f"Hệ thống lỗi: {str(e)}"}]}, status_code=500)


@router.post("/webhook/smartbot/danh-sach-bac-si")
async def smartbot_webhook_ds_bacsi(request: Request, db: Session = Depends(get_db)):
    """
    API: Tra cứu thông tin Bác sĩ & Lịch trống
    (Tương đương /thong-tin-bac-si)
    """
    try:
        data = await request.json()
        # Thường VNPT Smartbot truyền các biến qua key set_variables
        variables = data.get("set_variables", {})
        
        # Hỗ trợ lấy tên khoa từ root hoặc từ set_variables
        ten_khoa = data.get("ten_khoa") or variables.get("khoa_kham") or "Khoa Nội"
        
        # Tìm department
        dept = db.query(Department).filter(Department.name.ilike(f"%{ten_khoa}%")).first()
        if not dept:
            # Nếu không tìm thấy, lấy ngẫu nhiên 1 khoa có bác sĩ
            dept = db.query(Department).first()

        doctors = db.query(Staff).filter(Staff.department_id == dept.id, Staff.role == "clinician").all()
        
        if not doctors:
            return JSONResponse(content={
                "set_variables": {"api_status": "1"},
                "bot_responses": [{"type": "text", "text": f"Hiện tại {ten_khoa} chưa có bác sĩ nào có lịch trống."}]
            }, status_code=200)
            
        carousel_data = []
        doc_names = []
        for doc in doctors:
            doc_names.append(doc.name)
            carousel_data.append({
                "title": f"Bác sĩ {doc.name}",
                "subtitle": f"Khoa: {dept.name}. Lịch trống: 08:00 - 11:30",
                "url": doc.face_base64 or "https://img.freepik.com/free-photo/smiling-asian-male-doctor-pointing-upwards_1262-18321.jpg",
                "buttons": [
                    {
                        "type": "postback",
                        "title": f"Đặt lịch BS {doc.name.split()[-1]}",
                        "payload": "?ic_bot_button_Dat_lich_kham",
                        "button_variables": [
                            {"variableName": "ten_bac_si", "value": doc.name},
                            {"variableName": "bac_si_id", "value": str(doc.id)}
                        ]
                    }
                ]
            })

        response_data = {
            "set_variables": {
                "danh_sach_bac_si": ", ".join(doc_names),
                "lich_trong": "08:00 - 11:30",
                "api_status": "1"
            },
            "bot_responses": [
                {
                    "type": "carousel",
                    "data": carousel_data
                }
            ]
        }
        return JSONResponse(content=response_data, status_code=200)
    except Exception as e:
        return JSONResponse(content={"bot_responses": [{"type": "text", "text": "Không thể tải danh sách bác sĩ lúc này."}]}, status_code=500)


@router.post("/webhook/smartbot/dat-lich")
async def smartbot_webhook_dat_lich(request: Request, db: Session = Depends(get_db)):
    """
    API: Đặt lịch khám
    """
    try:
        data = await request.json()
        variables = data.get("set_variables", {})
        
        sender_id = data.get("sender_id") or variables.get("sender_id")
        bac_si_id = data.get("bac_si_id") or variables.get("bac_si_id")
        ngay_gio = data.get("ngay_gio") or variables.get("ngay_kham") or "Ngày mai"
        noi_dung = data.get("noi_dung_kham") or variables.get("trieu_chung") or ""
        
        # Tìm patient
        patient = db.query(Patient).filter((Patient.cccd == sender_id) | (Patient.id == sender_id)).first()
        if not patient:
            # Nếu chạy demo, tự động tạo mới patient dựa trên sender_id nếu nó trông giống CCCD
            patient = Patient(cccd=sender_id or str(uuid.uuid4())[:12], name="Bệnh nhân Demo")
            db.add(patient)
            db.commit()
            db.refresh(patient)
            
        doc_id_obj = None
        try:
            if bac_si_id:
                doc_id_obj = uuid.UUID(bac_si_id)
        except:
            pass
            
        if not doc_id_obj:
            doctor = db.query(Staff).filter(Staff.role == "clinician").first()
            doc_id_obj = doctor.id if doctor else None
            
        # Tách ngày và giờ nếu có
        date_part = ngay_gio
        time_part = "08:00"
        if " " in ngay_gio:
            parts = ngay_gio.split(" ")
            date_part = parts[0]
            time_part = parts[1]

        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id_obj,
            date=date_part,
            time=time_part,
            status="pending"
        )
        db.add(appointment)
        db.commit()
        
        doctor_name = "Bác sĩ"
        if doc_id_obj:
            doc = db.query(Staff).filter(Staff.id == doc_id_obj).first()
            if doc:
                doctor_name = doc.name

        response_data = {
            "set_variables": {
                "api_status": "1",
                "ngay_gio": ngay_gio,
                "ten_bac_si": doctor_name,
                "ten_khoa": variables.get("khoa_kham", "Khoa Khám Bệnh"),
                "phong_tang": "Phòng 101 - Tầng 1"
            },
            "bot_responses": [
                {
                    "type": "text",
                    "text": f"✅ Đặt lịch thành công!\n\nLịch khám: {ngay_gio}\nBác sĩ: {doctor_name}\nLý do: {noi_dung}\n\nMã bệnh nhân của bạn là: {patient.cccd}.\nCảm ơn bạn đã sử dụng EyeCU."
                }
            ]
        }
        return JSONResponse(content=response_data, status_code=200)
    except Exception as e:
        return JSONResponse(content={"bot_responses": [{"type": "text", "text": f"Có lỗi xảy ra khi đặt lịch: {str(e)}"}]}, status_code=500)


@router.post("/webhook/smartbot/tu-van-trieu-chung")
async def smartbot_webhook_tu_van(request: Request):
    """
    API nhận triệu chứng từ người bệnh, dùng AI phân tích và đề xuất Khoa khám.
    """
    try:
        data = await request.json()
        variables = data.get("set_variables", {})
        
        trieu_chung = variables.get("cau_tra_loi_dat_lich", "")
        
        # Giả lập LLM phân tích:
        khoa_goi_y = "Khoa Nội"
        if "mắt" in trieu_chung.lower():
            khoa_goi_y = "Khoa Mắt"
        elif "răng" in trieu_chung.lower():
            khoa_goi_y = "Khoa Răng Hàm Mặt"
        elif "tai" in trieu_chung.lower() or "mũi" in trieu_chung.lower() or "họng" in trieu_chung.lower():
            khoa_goi_y = "Khoa Tai Mũi Họng"
        elif "xương" in trieu_chung.lower() or "khớp" in trieu_chung.lower():
            khoa_goi_y = "Khoa Cơ Xương Khớp"
        elif "tim" in trieu_chung.lower() or "huyết áp" in trieu_chung.lower():
            khoa_goi_y = "Khoa Tim mạch"
        elif "đau bụng" in trieu_chung.lower() or "tiêu hoá" in trieu_chung.lower() or "dạ dày" in trieu_chung.lower():
            khoa_goi_y = "Khoa Tiêu hoá"

        response_data = {
            "set_variables": {
                "api_status": "1",
                "khoa_kham": khoa_goi_y
            },
            "bot_responses": [
                {
                    "type": "text",
                    "text": f"Dựa vào triệu chứng '{trieu_chung}', tôi đề xuất bạn nên khám **{khoa_goi_y}**.\nBạn có muốn xem danh sách Bác sĩ của khoa này để đặt lịch không?",
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Đồng ý",
                            "payload": "?ic_bot_button_Dong_y_Kham", 
                            "button_variables": [
                                {"variableName": "hanh_dong_tu_van", "value": "dong_y"}
                            ]
                        },
                        {
                            "type": "postback",
                            "title": "Cần hỗ trợ khác",
                            "payload": "?ic_bot_button_Ho_tro_Khac",
                            "button_variables": [
                                {"variableName": "hanh_dong_tu_van", "value": "ho_tro"}
                            ]
                        }
                    ]
                }
            ]
        }
        return JSONResponse(content=response_data, status_code=200)
    except Exception as e:
        return JSONResponse(content={"bot_responses": [{"type": "text", "text": "Hệ thống AI đang bận, không thể phân tích triệu chứng lúc này."}]}, status_code=500)
