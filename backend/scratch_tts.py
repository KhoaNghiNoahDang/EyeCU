import requests
import json

url = "https://api.idg.vnpt.vn/tts-service/v1/standard"

payload = json.dumps({
    "text": "Xin chào, tôi là AI của hệ thống Eye C U.",
    "text_split": "false",
    "model": "books",
    "speed": "1",
    "region": "female_north_ngochoa"
})
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFuc2FjdGlvbl9pZCI6ImFlZTRhZWU1LWVkZGUtNDI3Yi1iNjdlLWNmYzA2N2VmZTY2ZSIsInN1YiI6IjU0OTQzMTJlLWExZTItMDZhNC1lMDYzLTYzMTk5ZjBhMmI4MCIsImF1ZCI6WyJyZXN0c2VydmljZSJdLCJ1c2VyX25hbWUiOiJ0ZWFtLjAyQHZucHRhaS5pbyIsInNjb3BlIjpbInJlYWQiXSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3QiLCJuYW1lIjoidGVhbS4wMkB2bnB0YWkuaW8iLCJ1dWlkX2FjY291bnQiOiI1NDk0MzEyZS1hMWUyLTA2YTQtZTA2My02MzE5OWYwYTJiODAiLCJhdXRob3JpdGllcyI6WyJVU0VSIiwiVFJBQ0tfMSJdLCJqdGkiOiJiZTA2ZDJjMy00YThhLTQ5NzktOGIzZi1hMDcxOTM1ZTY4YTYiLCJjbGllbnRfaWQiOiJhZG1pbmFwcCJ9.gLSW9BNEhZhxbgRwKJXqS0nlEJDppZ9DVvLhe7bHw4YFvt9RFGCQlhK4TK7leClSJzGkq56TfMEZFm8hDjAuVxt2VDnmP2H4aCNvvdqrWl0NQlztoM30xmUkUvUIZYuL8_bYp-oZmF91t4k76u8RrGgm61uxBLXXcDQkLOL7U82eAqUSi0WBv4puJJFmFHYw87_qCzVsd2lslsXTXl2_fGxbB2tDhZ3lrw4aMb0HjJ4rpJKTH0H7YdDEKfbOOZkacLC26P6uQ0n2qmMVx0JwenZmrLEksK9VaJ4PJGMKVVxo6_Ruuy8nTKbroQ352O9rsfXgkhygo4OtaWH278PK5g',
    'Token-id': '54943137-1d59-759e-e063-62199f0addf0',
    'Token-key': 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJnB3zZbI/yFWDCJQsmlmquT+KPuvFmaNQFrrw0ivEDM4jQSPCDQyORZ2AEx4AoOI2l+KWZQRUZLhuoMVau9ogkCAwEAAQ=='
}
print("Sending request to TTS API...")
response = requests.request("POST", url, headers=headers, data=payload)
print("Status:", response.status_code)
print("Text length:", len(response.text))
if response.status_code != 200:
    print(response.text)
else:
    # Just print the first 100 chars to avoid printing binary output to terminal
    print(response.text[:100])
