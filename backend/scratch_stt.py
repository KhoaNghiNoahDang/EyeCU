import requests
import os
from dotenv import load_dotenv

load_dotenv()

url = "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard"
headers = {
    "Authorization": os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN"),
    "Token-id": os.getenv("VNPT_SMARTVOICE_TOKEN_ID"),
    "Token-key": os.getenv("VNPT_SMARTVOICE_TOKEN_KEY"),
}

# Create a small dummy WAV file in memory
dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"

files = {
    "audioFile": ("audio.wav", dummy_wav, "audio/wav")
}
data = {
    "clientSession": "test1234"
}

print("Testing STT API without Content-Type header (letting requests use multipart)...")
res = requests.post(url, headers=headers, files=files, data=data)
print("Status:", res.status_code)
print("Response:", res.text)

print("\nTesting STT API WITH Content-Type: application/json...")
headers["Content-Type"] = "application/json"
res = requests.post(url, headers=headers, files=files, data=data)
print("Status:", res.status_code)
print("Response:", res.text)
