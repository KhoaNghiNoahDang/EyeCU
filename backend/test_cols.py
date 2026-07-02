from app.db.database import engine
from sqlalchemy import text
with engine.connect() as c:
  r = c.execute(text("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name='patients'"))
  for row in r:
    print(f'{row[0]}: {row[1]} {row[2]}')
