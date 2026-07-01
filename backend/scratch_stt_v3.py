import requests
import wave
import struct

url = "https://api.idg.vnpt.vn/stt-service/v3/standard"
headers = {
    'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6ImFlZTRhZWU1LWVkZGUtNDI3Yi1iNjdlLWNmYzA2N2VmZTY2ZSIsInN1YiI6IjU0OTQzMTJlLWExZTItMDZhNC1lMDYzLTYzMTk5ZjBhMmI4MCIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJ0ZWFtLjAyQHZucHRhaS5pbyIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoidGVhbS4wMkB2bnB0YWkuaW8iLCJ1dWlkX2FjY291bnQiOiI1NDk0MzEyZS1hMWUyLTA2YTQtZTA2My02MzE5OWYwYTJiODAiLCJhdXRob3JpdGllcyI6WyJVU0VSIiwiVFJBQ0tfMSJdLCJqdGkiOiJiZTA2ZDJjMy00YThhLTQ5NzktOGIzZi1hMDcxOTM1ZTY4YTYiLCJjbGllbnRfaWQiOiJhZG1pbmFwcCJ9.gLSW9BNEhZhxbgRwKJXqS0nlEJDppZ9DVvLhe7bHw4YFvt9RFGCQlhK4TK7leClSJzGkq56TfMEZFm8hDjAuVxt2VDnmP2H4aCNvvdqrWl0NQlztoM30xmUkUvUIZYuL8_bYp-oZmF91t4k76u8RrGgm61uxBLXXcDQkLOL7U82eAqUSi0WBv4puJJFmFHYw87_qCzVsd2lslsXTXl2_fGxbB2tDhZ3lrw4aMb0HjJ4rpJKTH0H7YdDEKfbOOZkacLC26P6uQ0n2qmMVx0JwenZmrLEksK9VaJ4PJGMKVVxo6_Ruuy8nTKbroQ352O9rsfXgkhygo4OtaWH278PK5g',
    'Token-id': '54943144-80c7-701c-e063-62199f0aff3a',
    'Token-key': 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANUCX/IH86RWmK7iZIXuqblCde/n7Mzn+frXAh/+glUD71RK6lAe5iyWlUlLcuU1zcT6lBtYZxvTxgdoxeaTAtkCAwEAAQ==',
    'sample-rate': '16000',
    'domain': 'general',
    'Content-Type': 'audio/wave'
}

# Create a valid 16kHz mono WAV file in memory
sample_rate = 16000
with wave.open('dummy.wav', 'wb') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    # write 0.1 seconds of silence
    for i in range(int(sample_rate * 0.1)):
        value = 0
        data = struct.pack('<h', value)
        wav_file.writeframesraw(data)

with open('dummy.wav', 'rb') as f:
    payload = f.read()

print("Sending request to STT v3 API with valid WAV file...")
response = requests.request("POST", url, headers=headers, data=payload)
print("Status:", response.status_code)
print("Response:", response.text)
