import re

# 1. Fix backend patient.py
with open("app/api/patient.py", "r") as f:
    content = f.read()

content = content.replace('''        if liveness_data.get("liveness") != "pass":
            msg = liveness_data.get("msg") or "Thẻ có dấu hiệu giả mạo hoặc chụp lại qua màn hình!"
            liveness_warning = f"CẢNH BÁO: {msg}"''', '''        liveness_val = liveness_data.get("liveness")
        msg = liveness_data.get("msg", "")
        # Handle vnpt real return value
        is_real = liveness_val in ["pass", "True", True] or "thật" in str(msg).lower()
        if not is_real:
            liveness_warning = f"CẢNH BÁO: {msg or 'Thẻ có dấu hiệu giả mạo!'}"''')

with open("app/api/patient.py", "w") as f:
    f.write(content)

print("Backend liveness check fixed.")
