from app.db.database import engine
from sqlalchemy import text
with engine.connect() as c:
  c.execute(text("DELETE FROM patients WHERE name LIKE 'test_err%'"))
  c.commit()
