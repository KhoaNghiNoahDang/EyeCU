import re

with open("app/services/vnpt_api.py", "r", encoding="utf-8") as f:
    content = f.read()

if "import uuid" not in content:
    content = "import uuid\n" + content

with open("app/services/vnpt_api.py", "w", encoding="utf-8") as f:
    f.write(content)
