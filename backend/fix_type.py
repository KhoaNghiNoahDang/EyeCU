import re

with open("app/services/vnpt_api.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"type": 7', '"type": -1')

with open("app/services/vnpt_api.py", "w", encoding="utf-8") as f:
    f.write(content)
