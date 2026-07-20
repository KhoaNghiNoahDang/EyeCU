import re

text = 'chẩn đoán bệnh e05.0 - cường giáp (bệnh basedow) / thiếu hụt vitamin d nhẹ kết ghi quy tên xét nghiệm quả chú csbt / đơn vị máy xn trình tổng phân tích tế bào máu số lượng hồng cầu (rbc) 4.12 [4 - 4.9] / t/l yh2500-1 1 lượng huyết sắc tố (hgb) 118 l [125 - 145] / g/l yh2500-1 1 thể tích khối hồng cầu trong máu (hct) 35.8 l [37 - 42] / % yh2500-1 1 thể tích trung bình của hồng cầu (mcv) 86.9 [80 - 100] / fl yh2500- 1 1 lượng huyết sắc tố trung bình trong hồng cầu (mch) 28.6 [28 - 32] / pg yh2500-1 1 nồng độ huyết sắc tố trung bình (mchc) 330 [320 - 360] / g/l yh2500-1 1 dải phân bố kích thước hc % (rdw) 13.2 [10 - 15] / % yh2500-1 1 số lượng bạch cầu (wbc) 3.85 l [4 - 10] / g/l yh2500-1 1 tỷ lệ bạch cầu trung tính (neut%) 52.3 [45 - 75] / % yh2500-1 1 tỷ lệ bạch cầu lympho (lym%) 37.2 [25 - 45] / % yh2500-1 1 tỷ lệ bạch cầu mono (mono%) 6.5 [0 - 8] / % yh2500-1 1 tỷ lệ bạch cầu ưa acid (eos%) 3.6 yh2500-1 1 tỷ lệ bạch cầu ưa base (baso%) 0.4 yh2500-1 1 số lượng bạch cầu trung tính (neut) 02.01 [1.8 - 7.5] / g/l yh2500-1 1 sô lượng bạch cầu lympho (lymph) 1.43 [1 - 4.5] / g/l yh2500-1 1 số lượng bạch cầu mono (mono) 0.25 [0 - 0.8] / g/l yh2500-1 1 số lượng bạch cầu ưa acid (eos) 0.14 [0 - 0.8] / g/l yh2500-1 1 số lượng bạch cầu ưa base (baso) 0.02 [0 - 0.1] / g/l yh2500-1 1 số lượng tiểu cầu (plt) 224 [150 - 400] / g/l yh2500-1 1 thể tích trung bình tiểu cầu (mpv) 9.8 [7 - 11] / fl yh2500-1 1 kết quả xét nghiệm chẩn đoán  cường giáp (bệnh basedow) / thiếu hụt vitamin d nhẹ'

match = re.search(r"chẩn đoán(?: bệnh)?[^\w]*([a-z]\d{2}(?:\.\d)?\s*-\s*.*?)(?=\s*(?:kết|ghi|tên|xét|quả|đơn vị|máy|trình|tổng phân|lời|dặn|bác|sĩ|số lượng|[\d\.]+))", text)
if match:
    print("MATCH 1:", match.group(1))
else:
    print("NO MATCH 1")
    
match2 = re.search(r"chẩn đoán[^\w]*([^\n;]+)", text)
if match2:
    print("MATCH 2:", match2.group(1))
else:
    print("NO MATCH 2")
