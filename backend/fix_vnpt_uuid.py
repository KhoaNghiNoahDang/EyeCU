import re

with open("app/services/vnpt_api.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add import uuid at the top if not exists
if "import uuid" not in content:
    content = "import uuid\n" + content

# Replace "token": "" with "token": str(uuid.uuid4())
content = content.replace('"token": ""', '"token": str(uuid.uuid4())')

with open("app/services/vnpt_api.py", "w", encoding="utf-8") as f:
    f.write(content)
