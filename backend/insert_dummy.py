import os, sys, psycopg2
from dotenv import load_dotenv

load_dotenv('d:/HACKAITHON/demo_eyecu/backend/.env')
db_url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

queries = [
    """
    INSERT INTO medical_supplies (name, category, unit, quantity, min_quantity, supplier, unit_price, expiration_date, location, department_id, notes)
    VALUES ('Găng tay y tế nitrile size M (hộp 100 cái)', 'consumables', 'hộp', 150, 20, 'Công ty CP Thiết bị Y tế Việt', 82000, '2028-06-15', 'Kho vật tư - Kệ A1', NULL, 'Nhập lô mới giá tốt hơn')
    """,
    """
    INSERT INTO medical_supplies (name, category, unit, quantity, min_quantity, supplier, unit_price, expiration_date, location, department_id, notes)
    VALUES ('Găng tay y tế nitrile size M (hộp 100 cái)', 'consumables', 'hộp', 80, 20, 'Medical Supply Co. Ltd', 90000, '2025-08-30', 'Kho cấp cứu - Tủ C1', (SELECT id FROM departments WHERE name='Khoa Cấp cứu' LIMIT 1), 'Dự trữ khẩn cấp sắp hết hạn')
    """,
    """
    INSERT INTO medical_supplies (name, category, unit, quantity, min_quantity, supplier, unit_price, expiration_date, location, department_id, notes)
    VALUES ('Kim tiêm 23G (hộp 100 cái)', 'consumables', 'hộp', 200, 15, 'Công ty Thiết bị Y tế Danameco', 27500, '2029-01-01', 'Kho vật tư - Kệ B2', NULL, 'Hàng mới nhập')
    """,
    """
    INSERT INTO medical_supplies (name, category, unit, quantity, min_quantity, supplier, unit_price, expiration_date, location, department_id, notes)
    VALUES ('Kim tiêm 23G (hộp 100 cái)', 'consumables', 'hộp', 5, 15, 'Nhà phân phối Y tế Toàn Cầu', 30000, '2024-12-10', 'Tủ vật tư - Ngăn B3', (SELECT id FROM departments WHERE name='Khoa Nội tổng hợp' LIMIT 1), 'ĐÃ HẾT HẠN, cần hủy')
    """
]

for q in queries:
    cursor.execute(q)

conn.commit()
cursor.close()
conn.close()
print('Inserted dummy data successfully')
