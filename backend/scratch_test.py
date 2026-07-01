import requests

url = "http://localhost:8000/api/voice/emr"
dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
files = {"audio": ("audio.wav", dummy_wav, "audio/wav")}
data = {"patient_id": "test_123"}

# Mock authentication token
headers = {"Authorization": "Bearer fake_token"}

response = requests.post(url, files=files, data=data, headers=headers)
print("Status:", response.status_code)
print("Response:", response.text)
