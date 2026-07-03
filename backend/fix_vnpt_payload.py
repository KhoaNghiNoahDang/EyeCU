import re

with open("app/services/vnpt_api.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix call_ekyc_ocr
content = re.sub(
    r'"img_front": hash_string,\s*"step_id": 0,\s*"type": 7',
    r'"token": "",\n            "client_session": "eyecu-ocr",\n            "img_front": hash_string,\n            "step_id": 0,\n            "type": 7',
    content
)

# Fix call_face_liveness_2d
content = re.sub(
    r'"img": face_img_hash,\s*"client_session": "eyecu-face-2d",',
    r'"token": "",\n            "img": face_img_hash,\n            "client_session": "eyecu-face-2d",',
    content
)

# Fix call_face_compare
content = re.sub(
    r'"img_front": img_hash_1,\s*"img_face": img_hash_2,\s*"client_session": "eyecu-face-compare",',
    r'"token": "",\n            "img_front": img_hash_1,\n            "img_face": img_hash_2,\n            "client_session": "eyecu-face-compare",',
    content
)

# Also ensure we use the web endpoints or the ones in the table
content = content.replace(
    '"https://api.idg.vnpt.vn/ai/v1/face/compare"',
    '"https://api.idg.vnpt.vn/ai/v1/face/compare"' # It seems the user's table says /ai/v1/face/compare, let's keep it
)
content = content.replace(
    '"https://api.idg.vnpt.vn/ai/v1/face/liveness"',
    '"https://api.idg.vnpt.vn/ai/v4/web/standard/face/liveness"' # The table says this is the face liveness endpoint
)

with open("app/services/vnpt_api.py", "w", encoding="utf-8") as f:
    f.write(content)
