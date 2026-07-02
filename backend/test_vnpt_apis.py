import os
import sys
import requests
import json
import uuid
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv(override=True)

print("=== BẮT ĐẦU KIỂM THỬ KẾT NỐI 6 API VNPT ===")

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
    url = "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard"
    
    token = os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN")
    if token and token.lower().startswith("bearer"):
        auth_header = token
    else:
        auth_header = f"Bearer {token}"
        
    headers = {
        "Authorization": auth_header,
        "Token-id": os.getenv("VNPT_SMARTVOICE_TOKEN_ID"),
        "Token-key": os.getenv("VNPT_SMARTVOICE_TOKEN_KEY"),
    }
    
    dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    files = {"audioFile": ("audio.wav", dummy_wav, "audio/wav")}
    
    data = {"clientSession": str(uuid.uuid4())}
    
    safe_req("POST", url, headers=headers, files=files, data=data, api_name="SmartVoice(STT)")

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

def main():
    test_smartreader()
    test_ekyc()
    test_smartvision()
    test_smartbot()
    test_smartvoice()
    test_vnface()
    print("===============================================")

if __name__ == "__main__":
    main()
