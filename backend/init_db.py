import os
import sys

# Add the backend dir to PYTHONPATH so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel
from app.db.database import engine
# Import models so SQLModel metadata is populated
from app.db.models import *

def init_db():
    print("Creating tables in Supabase PostgreSQL database...")
    SQLModel.metadata.create_all(engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    init_db()
