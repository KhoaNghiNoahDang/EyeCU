from app.db.database import engine
from sqlalchemy import text
with engine.connect() as c:
  r = c.execute(text("SELECT name, cccd FROM patients WHERE cccd='123456789'"))
  for row in r:
    print(row)
