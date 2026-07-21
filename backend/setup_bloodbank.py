import os, sys, psycopg2, re
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("ERROR: DATABASE_URL not found")
    sys.exit(1)

SQL_FILE = os.path.join(os.path.dirname(BASE_DIR), 'database', 'blood_bank_schema.sql')

def run_sql():
    print("Connecting to Supabase to setup blood bank...")
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        with open(SQL_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        sql_content = re.sub(r'--[^\n]*', '', sql_content)
        
        cursor.execute(sql_content)
        conn.commit()
        
        cursor.execute("SELECT COUNT(*) FROM blood_bags")
        count = cursor.fetchone()[0]
        print(f"SUCCESS: blood_bags has {count} rows")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run_sql()
