import sqlite3
import os

db_path = "eyecu.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE patients ADD COLUMN gender VARCHAR(10)")
    print("Added gender to patients")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("gender already exists in patients")
    else:
        print(f"Error patients: {e}")

conn.commit()
conn.close()
