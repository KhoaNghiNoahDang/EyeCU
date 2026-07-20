#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, re
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env")
    sys.exit(1)

SQL_FILE = os.path.join(os.path.dirname(__file__), '..', 'database', 'medical_inventory_schema.sql')

def run_sql_file():
    print("Connecting to Supabase...")
    db_url = DATABASE_URL
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        cursor = conn.cursor()
        print("Connection OK!")
        
        with open(SQL_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Strip single-line comments to avoid parsing issues
        sql_content = re.sub(r'--[^\n]*', '', sql_content)
        
        print("Running SQL: creating tables and seeding demo data...")
        cursor.execute(sql_content)
        conn.commit()
        
        print("\nDone! Row counts:")
        tables = ['equipment_categories', 'medical_equipment', 'medical_supplies', 
                  'equipment_maintenance_logs', 'supply_transactions']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count} rows")
        
        cursor.close()
        conn.close()
        print("\nSUCCESS: Database ready for frontend!")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nFallback: Open Supabase Dashboard -> SQL Editor")
        print("Copy & paste content from database/medical_inventory_schema.sql and Run")

if __name__ == "__main__":
    run_sql_file()
