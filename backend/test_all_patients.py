from app.db.database import engine
from sqlalchemy import text
with engine.connect() as c:
  r = c.execute(text("SELECT name, cccd FROM patients"))
  for row in r:
    print(str(row).encode('utf-8'))
