"""Script kiem tra va sua bang lpr_logs trong DB."""
import sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.tmjcsqwprlgqqzcubkeb:hackaithon2026%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Kiem tra cac cot hien co
    res = conn.execute(text(
        "SELECT column_name, data_type FROM information_schema.columns "
        "WHERE table_name='lpr_logs' ORDER BY ordinal_position"
    ))
    rows = res.fetchall()
    print("Cot hien tai trong lpr_logs:")
    existing_cols = set()
    for row in rows:
        print(f"  {row[0]}: {row[1]}")
        existing_cols.add(row[0])

    # Them cac cot con thieu
    migrations = []
    if "confidence" not in existing_cols:
        migrations.append("ALTER TABLE lpr_logs ADD COLUMN confidence FLOAT")
    if "image_url" not in existing_cols:
        migrations.append("ALTER TABLE lpr_logs ADD COLUMN image_url TEXT")
    if "timestamp" not in existing_cols:
        migrations.append("ALTER TABLE lpr_logs ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW()")

    if migrations:
        print("\nDang them cac cot con thieu...")
        for sql in migrations:
            print(f"  SQL: {sql}")
            conn.execute(text(sql))
        conn.commit()
        print("Hoan thanh! Chay lai test_lpr_endpoint.py ngay bay gio.")
    else:
        print("\nBang lpr_logs da co du cac cot can thiet.")
