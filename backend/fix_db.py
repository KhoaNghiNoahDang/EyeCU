from sqlalchemy import text
from app.db.database import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE staffs DROP CONSTRAINT IF EXISTS staffs_cccd_key;"))
        conn.execute(text("DROP INDEX IF EXISTS ix_staffs_cccd;"))
        conn.commit()
        print("Dropped unique constraint on cccd.")
    except Exception as e:
        print(f"Error: {e}")
