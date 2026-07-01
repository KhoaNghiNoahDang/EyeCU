import os
import sys
import requests
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

print("=== BẮT ĐẦU KIỂM THỬ LẠI KẾT NỐI 6 API VNPT ===")

def print_result(api_name, success, detail):
    status = " THÀNH CÔNG" if success else " THẤT BẠI"
    print(f"{api_name:<20} | {status} | {detail}")

def safe_req(method, url, **kwargs):
    api_name = kwargs.pop("api_name", "API")
    try:
        res = requests.request(method, url, timeout=10, **kwargs)
        if res.status_code in [200, 201]:
            print_result(api_name, True, f"HTTP {res.status_code}: {res.text[:80]}")
        else:
            print_result(api_name, False, f"HTTP {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print_result(api_name, False, str(e))

def test_smartreader():
    url = "https://api.idg.vnpt.vn/file-service/v1/addFile"
    headers = {
        "Authorization": os.getenv("VNPT_SMARTREADER_ACCESS_TOKEN"),
        "Token-id": os.getenv("VNPT_SMARTREADER_TOKEN_ID"),
        "Token-key": os.getenv("VNPT_SMARTREADER_TOKEN_KEY"),
    }
    files = {"file": ("test.jpg", b"\xff\xd8\xff\xdb\x00\x43\x00\x01" + b"\x00"*10, "image/jpeg")}
    data = {"title": "test.jpg", "description": "test upload"}
    safe_req("POST", url, headers=headers, files=files, data=data, api_name="SmartReader(upload)")

def test_ekyc():
    url = "https://api.idg.vnpt.vn/file-service/v1/addFile"
    headers = {
        "Authorization": os.getenv("VNPT_EKYC_ACCESS_TOKEN"),
        "Token-id": os.getenv("VNPT_EKYC_TOKEN_ID"),
        "Token-key": os.getenv("VNPT_EKYC_TOKEN_KEY"),
    }
    files = {"file": ("test.jpg", b"\xff\xd8\xff\xdb\x00\x43\x00\x01" + b"\x00"*10, "image/jpeg")}
    data = {"title": "test.jpg", "description": "test upload"}
    safe_req("POST", url, headers=headers, files=files, data=data, api_name="eKYC(upload)")

def test_smartvision():
    url = "https://api.idg.vnpt.vn/file-service/v1/addFile"
    headers = {
        "Authorization": os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN"),
        "Token-id": os.getenv("VNPT_SMARTVISION_TOKEN_ID"),
        "Token-key": os.getenv("VNPT_SMARTVISION_TOKEN_KEY"),
    }
    files = {"file": ("test.jpg", b"\xff\xd8\xff\xdb\x00\x43\x00\x01" + b"\x00"*10, "image/jpeg")}
    data = {"title": "test.jpg", "description": "test upload"}
    safe_req("POST", url, headers=headers, files=files, data=data, api_name="SmartVision(upload)")

def test_smartbot():
    url = "https://assistant-stream.vnpt.vn/v1/conversation"
    token = os.getenv("VNPT_SMARTBOT_ACCESS_TOKEN")
    headers = {
        "Authorization": token if token and "Bearer" in str(token) else f"Bearer {token}",
        "Token-id": os.getenv("VNPT_SMARTBOT_TOKEN_ID"),
        "Token-key": os.getenv("VNPT_SMARTBOT_TOKEN_KEY"),
        "Content-Type": "application/json",
    }
    payload = {
        "bot_id": "69c66280-4e97-11ec-8489-55ac94e8524e",
        "sender_id": "123",
        "text": "Xin chào",
        "input_channel": "livechat",
        "session_id": "123",
        "metadata": {},
    }
    safe_req("POST", url, headers=headers, json=payload, api_name="SmartBot")

def test_smartvoice():
    import sys
    sys.path.append('./app/grpc_proto')
    try:
        import grpc
        import vnpt_asr_pb2
        import vnpt_asr_pb2_grpc
        import vnpt_audio_pb2
    except ImportError as e:
        print_result("SmartVoice", False, f"Missing gRPC libs or proto compiled files: {e}")
        return

    # Endpoint host cho gRPC (Thường gRPC dùng domain:port, không có https:// hay /path)
    # Tuy nhiên VNPT STT đôi khi Gateway nằm ở path cụ thể nếu dùng gRPC-Web hoặc Envoy. 
    # Nhưng chuẩn gRPC native thì thường là host:443. Dựa trên URL cũ: api.idg.vnpt.vn
    host = "api.idg.vnpt.vn:443"
    
    token = os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN")
    if token and "Bearer" not in token:
        token = f"Bearer {token}"
        
    metadata = (
        ("authorization", token),
        ("token-id", os.getenv("VNPT_SMARTVOICE_TOKEN_ID")),
        ("token-key", os.getenv("VNPT_SMARTVOICE_TOKEN_KEY")),
    )

    try:
        credentials = grpc.ssl_channel_credentials()
        channel = grpc.secure_channel(host, credentials)
        stub = vnpt_asr_pb2_grpc.VnptSpeechRecognitionStub(channel)

        config = vnpt_asr_pb2.RecognitionConfig(
            encoding=vnpt_audio_pb2.LINEAR_PCM,
            sample_rate_hertz=16000,
            language_code="vi-VN",
            max_alternatives=1,
            enable_automatic_punctuation=False
        )
        streaming_config = vnpt_asr_pb2.StreamingRecognitionConfig(config=config, interim_results=True)
        
        # Generator for streaming request
        def request_generator():
            yield vnpt_asr_pb2.StreamingRecognizeRequest(streaming_config=streaming_config)
            # Dummy PCM audio chunk (just zeros)
            dummy_chunk = b'\x00' * 2048
            yield vnpt_asr_pb2.StreamingRecognizeRequest(audio_content=dummy_chunk)

        # Gửi streaming request lên server
        responses = stub.StreamingRecognize(request_generator(), metadata=metadata, timeout=10)
        
        # Đọc response đầu tiên để xác nhận kết nối thành công
        for response in responses:
            print_result("SmartVoice(gRPC)", True, f"Kết nối gRPC thành công! Phản hồi Streaming: OK")
            break
            
    except grpc.RpcError as e:
        print_result("SmartVoice(gRPC)", False, f"gRPC Error: {e.code().name} - {e.details()}")
    except Exception as e:
        print_result("SmartVoice(gRPC)", False, f"Error: {str(e)}")

def test_vnface():
    token = os.getenv("VNPT_VNFACE_ACCESS_TOKEN")
    channel = os.getenv("VNPT_VNFACE_TOKEN_CHANNEL")
    url = "https://api-vnface.vnpt.vn/checkin-service/external/account/list?maxSize=2&page=1"
    headers = {
        "Authorization": f"Bearer {token}" if token and "Bearer" not in str(token) else str(token),
        "Token-Channel": channel if channel else "",
        "Content-Type": "application/json"
    }
    safe_req("GET", url, headers=headers, api_name="VNFace")

test_smartreader()
test_ekyc()
test_smartvision()
test_smartbot()
test_smartvoice()
test_vnface()
print("===============================================")
