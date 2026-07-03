import os
import json
import httpx
from typing import AsyncGenerator
from dotenv import load_dotenv

# Tải biến môi trường từ file .env (chứa các Token xác thực)
load_dotenv()

def open_emergency_call():
    """
    Hàm điều hướng: Được kích hoạt khi bot không xử lý được và yêu cầu chuyển máy tới nhân viên (bác sĩ trực).
    """
    # TODO: Tích hợp logic gọi Video Call hoặc mở giao diện chat với bác sĩ thật tại đây
    print("\n[HỆ THỐNG] Đang kết nối tới bác sĩ trực... (Emergency Call Triggered)\n")

async def stream_smartbot_conversation(
    session_id: str, 
    user_text: str, 
    patient_id: str, 
    department_name: str
) -> AsyncGenerator[str, None]:
    """
    Gửi tin nhắn tới VNPT SmartBot (dạng Streaming) và nhận kết quả trả về từng phần.
    
    Tham số:
        session_id: ID phiên chat của người dùng.
        user_text: Câu hỏi người dùng nhập vào.
        patient_id: Mã định danh bệnh nhân.
        department_name: Tên khoa bệnh đang khám.
        
    Trả về (Yields):
        str: Các đoạn text streaming trả về từ bot để hiển thị mượt mà lên giao diện (UI).
    """
    url = "https://assistant-stream.vnpt.vn/v1/conversation"
    
    # Chuẩn bị thông tin xác thực Authentication (lấy từ biến môi trường)
    token = os.getenv("VNPT_SMARTBOT_ACCESS_TOKEN", "")
    auth_header = token if token.lower().startswith("bearer") else f"Bearer {token}"
    
    headers = {
        "Authorization": auth_header,
        "Token-id": os.getenv("VNPT_SMARTBOT_TOKEN_ID", ""),
        "Token-key": os.getenv("VNPT_SMARTBOT_TOKEN_KEY", ""),
        "Content-Type": "application/json",
        "Accept": "text/event-stream"  # Quan trọng: Yêu cầu server trả về định dạng stream
    }
    
    # Body request chứa metadata và button_variables để truyền thông tin bệnh nhân
    payload = {
        "bot_id": "69c66280-4e97-11ec-8489-55ac94e8524e", # Bot ID mẫu, có thể đổi theo thực tế
        "sender_id": session_id,
        "text": user_text,
        "input_channel": "livechat",
        "session_id": session_id,
        "metadata": {
            "button_variables": {
                "patient_id": patient_id,
                "department_name": department_name
            }
        }
    }
    
    try:
        # Sử dụng AsyncClient để kết nối và lắng nghe luồng dữ liệu (Stream) mượt mà mà không block app
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                # Bắt lỗi HTTP (VD: 401 Unauthorized, 400 Bad Request)
                response.raise_for_status()
                
                # Lắng nghe và duyệt qua từng dòng dữ liệu Server-Sent Events (SSE) trả về
                async for line in response.aiter_lines():
                    if not line:
                        continue
                        
                    # Dữ liệu SSE chuẩn luôn bắt đầu bằng 'data:'
                    if line.startswith("data:"):
                        data_str = line[5:].strip() # Cắt bỏ chữ 'data:' ở đầu
                        if not data_str or data_str == "[DONE]":
                            continue
                            
                        try:
                            # Parse chuỗi JSON
                            json_data = json.loads(data_str)
                            obj = json_data.get("object", {})
                            
                            # Yêu cầu 1: Điều hướng. Nếu type là chuyển GDV -> Mở kết nối bác sĩ trực
                            if obj.get("type") == "chuyen_gdv":
                                open_emergency_call()
                                yield "\n[Hệ thống đang chuyển máy cho bác sĩ trực...]"
                                break
                            
                            # Yêu cầu 2: Hiển thị mượt mà. Lấy text từ sb.card_data
                            sb = obj.get("sb", {})
                            card_data = sb.get("card_data", "")
                            card_data_info = sb.get("card_data_info", {})
                            status = card_data_info.get("status")
                            
                            # Gửi phần text mới nhất về cho UI
                            if card_data:
                                yield card_data
                            
                            # Yêu cầu 3: Kết thúc luồng stream khi nhận được status == 2
                            if status == 2:
                                break
                                
                        except json.JSONDecodeError:
                            # Bỏ qua các dòng bị lỗi format JSON trong quá trình stream
                            continue
                            
    # Xử lý lỗi cơ bản (Error Handling)
    except httpx.HTTPStatusError as e:
        yield f"\n[Lỗi kết nối API SmartBot: {e.response.status_code}]"
    except httpx.RequestError as e:
        yield f"\n[Lỗi mạng hoặc Timeout: {str(e)}]"
    except Exception as e:
        yield f"\n[Lỗi hệ thống ngoài dự kiến: {str(e)}]"

# ==========================================
# CÁCH TEST NHANH MODULE NÀY TRONG TERMINAL
# ==========================================
if __name__ == "__main__":
    import asyncio
    
    async def main_test():
        print("Đang gửi tin nhắn tới VNPT SmartBot (Streaming)...\n")
        print("Bot phản hồi: ", end="", flush=True)
        
        # Test hàm stream với các tham số mẫu
        async for chunk in stream_smartbot_conversation(
            session_id="test_session_999",
            user_text="Tôi đang bị đau đầu quá, cần tư vấn",
            patient_id="BN_123456",
            department_name="Khoa Thần Kinh"
        ):
            print(chunk, end="", flush=True)
            
        print("\n\n--- Kết thúc luồng Stream ---")
        
    asyncio.run(main_test())
