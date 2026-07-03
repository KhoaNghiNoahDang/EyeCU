from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check current columns
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'dispatch_records'"))
    cols = [r[0] for r in res]
    print("Current columns:", cols)
    
    # Add columns if not exist
    new_cols = {
        "bhxh_code": "VARCHAR",
        "emergency_contact_name": "VARCHAR",
        "emergency_contact_phone": "VARCHAR",
        "pre_alert_text": "TEXT"
    }
    for col, col_type in new_cols.items():
        if col not in cols:
            print(f"Adding column {col}...")
            conn.execute(text(f"ALTER TABLE dispatch_records ADD COLUMN {col} {col_type}"))
    conn.commit()
    print("Database columns fixed.")
