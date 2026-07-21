import os
import sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
from app.db.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
results = db.execute(text('SELECT DISTINCT test_result FROM blood_bags')).fetchall()
print('Unique test_result values before:', [r[0] for r in results])
db.execute(text("UPDATE blood_bags SET test_result = 'Đang xét nghiệm' WHERE test_result = 'Ä ang xÃ©t nghiá»‡m'"))
db.execute(text("UPDATE blood_bags SET test_result = 'An toàn' WHERE test_result = 'An toÃ n'"))
db.commit()

results_after = db.execute(text('SELECT DISTINCT test_result FROM blood_bags')).fetchall()
print('Unique test_result values after:', [r[0] for r in results_after])
