import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import text
from app.db.database import engine

def count_tables():
    try:
        with engine.connect() as conn:
            query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            result = conn.execute(query).fetchall()
            tables = [row[0] for row in result]
            print(f"TOTAL_TABLES: {len(tables)}")
            print("TABLE_NAMES: " + ", ".join(tables))
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    count_tables()
