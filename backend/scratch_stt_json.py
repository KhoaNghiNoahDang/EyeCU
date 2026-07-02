import requests
import os
import base64
from dotenv import load_dotenv

load_dotenv()

url = "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard"
headers = {
    "Authorization": os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN"),
    "Token-id": os.getenv("VNPT_SMARTVOICE_TOKEN_ID"),
    "Token-key": os.getenv("VNPT_SMARTVOICE_TOKEN_KEY"),
    "Content-Type": "application/json"
}

# Create a small dummy WAV file
dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
b64_audio = base64.b64encode(dummy_wav).decode('utf-8')

payload = {
    "audioFile": b64_audio,
    "clientSession": "test1234"
}

print("Testing STT API WITH JSON payload...")
res = requests.post(url, headers=headers, json=payload)
print("Status:", res.status_code)
print("Response:", res.text)
