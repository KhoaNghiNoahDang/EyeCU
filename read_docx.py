import docx
doc = docx.Document(r'C:\Users\Admin\EyeCU\TÀI LI?U\[VNPT AI Hackathon 2025] VNPT SmartBot\Tài li?u tích h?p Smartbot d?ng streaming - Hackathon Track 1.docx')
with open('out.txt', 'w', encoding='utf8') as f: f.write('\n'.join([p.text for p in doc.paragraphs]))
