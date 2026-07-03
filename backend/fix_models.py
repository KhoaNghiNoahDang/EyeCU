import re

with open('app/db/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    prefix = match.group(1)
    tablename_line = match.group(2)
    
    # Don't add if already there
    if '__table_args__' in content[match.end():match.end()+50]:
        return match.group(0)
        
    return f'{prefix}{tablename_line}\n{prefix}__table_args__ = {{"extend_existing": True}}'

new_content = re.sub(r'(^ +)(__tablename__ = [\"\'][\w_]+[\"\'])', replacer, content, flags=re.MULTILINE)

with open('app/db/models.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done updating models.py")
