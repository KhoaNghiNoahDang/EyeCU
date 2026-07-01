from app.db.database import engine
from sqlalchemy import text
with engine.connect() as c:
  r = c.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='patients'"))
  print([row[0] for row in r])
