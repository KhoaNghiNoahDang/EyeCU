from app.db.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    print('DB URL:', str(engine.url).replace(engine.url.password, '***'))
