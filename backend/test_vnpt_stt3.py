import asyncio
import httpx
import uuid

TOKEN = "bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6ImYyYmJiYTRkLTYxMDgtNDAxZC1hNDFiLWJhOTUzY2UyNDc1OSIsInN1YiI6IjU0OTQzMTJlLWExZTItMDZhNC1lMDYzLTYzMTk5ZjBhMmI4MCIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJ0ZWFtLjAyQHZucHRhaS5pbyIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoidGVhbS4wMkB2bnB0YWkuaW8iLCJ1dWlkX2FjY291bnQiOiI1NDk0MzEyZS1hMWUyLTA2YTQtZTA2My02MzE5OWYwYTJiODAiLCJhdXRob3JpdGllcyI6WyJVU0VSIiwiVFJBQ0tfMSJdLCJqdGkiOiIxYjliYTI0My1mMTk4LTQ0MDYtOTViZC0yM2Y3MWQ2NThkMTYiLCJjbGllbnRfaWQiOiJhZG1pbmFwcCJ9.EKGmtC7mpxfIxLALrUzZnCnzkQwA-lhvmaW2g9KWxTs5PMYZ3PhvKamIhDEh067iiYnh_SyMICnm9Au3JOx6E-1tZX4YeL1zA0mLmFiqxp84lDjqhZYXqCOyAUk7AvIzAryC7284b2tMULofuEfY4RLpXHQrJqjSNJ2MKBfoXYqBbYDBXjFZJca3n0mjLNlkLMh_873nlhB4-Ub83Tt1wwQFFlmE0hWFPgdDZTNqAEPE2XI2u1p--S0Q1dDxG5eK6eSNUs--Q9ZvLW_csz4XzKSCwqRNJC-It2p_RV22X8Gjf-N6DToTTn0WF6hXeH6XJFKou0zZ5a-W0_D7Tx0QRg"
TID = "54943144-80c7-701c-e063-62199f0a88a8" # Wait, user gave: 54943144-80c7-701c-e063-62199f0aff3a
TID = "54943144-80c7-701c-e063-62199f0aff3a"
TKEY = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANUCX/IH86RWmK7iZIXuqblCde/n7Mzn+frXAh/+glUD71RK6lAe5iyWlUlLcuU1zcT6lBtYZxvTxgdoxeaTAtkCAwEAAQ=="

with open("test_audio.wav", "rb") as f2:
    wav_bytes = f2.read()

async def test_stt():
    print(f"\n--- Testing STT GRPC ---")
    headers = {"Token-id": TID, "Token-key": TKEY, "Authorization": TOKEN}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post("https://api.idg.vnpt.vn/stt-service/v1/grpc/standard", headers=headers, files={"audioFile": ("test.wav", wav_bytes, "audio/wav")}, data={"clientSession": str(uuid.uuid4())})
            print("STT Status:", resp.status_code)
            print("STT Response:", resp.text[:500])
    except Exception as e:
        print("STT Exception:", e)

asyncio.run(test_stt())
