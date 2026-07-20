from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT extracted_data FROM smart_reader_docs ORDER BY id DESC LIMIT 1')).fetchone()
    print(result[0].get('raw_ocr') if result else 'No doc')
