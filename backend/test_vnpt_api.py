import asyncio
import httpx
import wave
import struct
import math
import uuid

TOKEN = "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6ImYyYmJiYTRkLTYxMDgtNDAxZC1hNDFiLWJhOTUzY2UyNDc1OSIsInN1YiI6IjU0OTQzMTJlLWExZTItMDZhNC1lMDYzLTYzMTk5ZjBhMmI4MCIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJ0ZWFtLjAyQHZucHRhaS5pbyIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoidGVhbS4wMkB2bnB0YWkuaW8iLCJ1dWlkX2FjY291bnQiOiI1NDk0MzEyZS1hMWUyLTA2YTQtZTA2My02MzE5OWYwYTJiODAiLCJhdXRob3JpdGllcyI6WyJVU0VSIiwiVFJBQ0tfMSJdLCJqdGkiOiIxYjliYTI0My1mMTk4LTQ0MDYtOTViZC0yM2Y3MWQ2NThkMTYiLCJjbGllbnRfaWQiOiJhZG1pbmFwcCJ9.EKGmtC7mpxfIxLALrUzZnCnzkQwA-lhvmaW2g9KWxTs5PMYZ3PhvKamIhDEh067iiYnh_SyMICnm9Au3JOx6E-1tZX4YeL1zA0mLmFiqxp84lDjqhZYXqCOyAUk7AvIzAryC7284b2tMULofuEfY4RLpXHQrJqjSNJ2MKBfoXYqBbYDBXjFZJca3n0mjLNlkLMh_873nlhB4-Ub83Tt1wwQFFlmE0hWFPgdDZTNqAEPE2XI2u1p--S0Q1dDxG5eK6eSNUs--Q9ZvLW_csz4XzKSCwqRNJC-It2p_RV22X8Gjf-N6DToTTn0WF6hXeH6XJFKou0zZ5a-W0_D7Tx0QRg"
TID = "54943144-80c7-701c-e063-62199f0aff3a"
TKEY = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANUCX/IH86RWmK7iZIXuqblCde/n7Mzn+frXAh/+glUD71RK6lAe5iyWlUlLcuU1zcT6lBtYZxvTxgdoxeaTAtkCAwEAAQ=="

try:
    with open("test_audio.wav", "rb") as f2:
        wav_bytes = f2.read()
except FileNotFoundError:
    f = wave.open("test_audio.wav", "w")
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(16000)
    for i in range(16000):
        value = int(32767.0 * math.cos(1000.0 * math.pi * float(i) / float(16000)))
        f.writeframes(struct.pack('h', value))
    f.close()
    with open("test_audio.wav", "rb") as f2:
        wav_bytes = f2.read()

async def test_summary():
    print(f"\n--- Testing Summary GRPC ---")
    headers = {"Token-id": TID, "Token-key": TKEY, "Authorization": TOKEN}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.idg.vnpt.vn/eval-emotion-service/v1/conversation/summary-meeting", 
                headers=headers, 
                files={"file": ("test.wav", wav_bytes, "audio/wav")}, 
                data={"maxNumSpeakers": "2", "languageCode": "vi-VN"}
            )
            print("Status:", resp.status_code)
            print("Response:", resp.text[:500])
    except Exception as e:
        print("Exception Type:", type(e))
        print("Exception:", str(e))

asyncio.run(test_summary())
