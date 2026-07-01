import os
import sys
import requests
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

# Force load backend/.env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# New Access Token
new_access_token = os.getenv("VNPT_SMARTVOICE_ACCESS_TOKEN")

# Old SmartVoice Credentials (from fallback config)
old_voice_id = "54943137-1d59-759e-e063-62199f0addf0"
old_voice_key = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJnB3zZbI/yFWDCJQsmlmquT+KPuvFmaNQFrrw0ivEDM4jQSPCDQyORZ2AEx4AoOI2l+KWZQRUZLhuoMVau9ogkCAwEAAQ=="

print("Testing NEW access token with OLD SmartVoice credentials...")

url = "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard"
dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
files = {"audioFile": ("audio.wav", dummy_wav, "audio/wav")}

headers = {
    "Authorization": new_access_token if "Bearer" in str(new_access_token) else f"Bearer {new_access_token}",
    "Token-id": old_voice_id,
    "Token-key": old_voice_key
}

try:
    res = requests.post(url, headers=headers, files=files, timeout=10)
    print("Status:", res.status_code)
    print("Response Body:", res.text)
except Exception as e:
    print("Error:", e)
