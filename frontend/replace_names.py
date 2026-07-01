import codecs
with codecs.open('src/routes/index.tsx', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace('\"Nguyễn Văn A\"', '{user?.name || \"Bệnh nhân\"}')
content = content.replace('Xin chào bạn Nguyễn Văn A', 'Xin chào bạn {user?.name || \"Bệnh nhân\"}')
content = content.replace('Xin chào bác Nguyễn Văn A.', 'Xin chào bác {user?.name || \"Bệnh nhân\"}.')
content = content.replace('Họ tên:</span> Nguyễn Văn A', 'Họ tên:</span> {user?.name || \"Bệnh nhân\"}')
content = content.replace('\"Nguyễn Văn A, Nam · 62t\"', '`${user?.name || \"Bệnh nhân\"}, Nam · 62t`')
content = content.replace('\"Nguyễn Văn A (Nam, 62 tuổi)\"', '`${user?.name || \"Bệnh nhân\"} (Nam, 62 tuổi)`')

with codecs.open('src/routes/index.tsx', 'w', 'utf-8') as f:
    f.write(content)
