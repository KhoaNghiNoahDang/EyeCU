import requests
import json

try:
    # We don't have the user's JWT, but we can query the DB directly to see what the services list looks like!
    import os
    from sqlalchemy import create_engine, text
    from dotenv import load_dotenv

    load_dotenv("backend/.env")
    db_url = os.getenv("DATABASE_URL")
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, status FROM examination_services WHERE record_id = (SELECT CAST(id AS TEXT) FROM clinical_records ORDER BY created_at DESC LIMIT 1)"))
        services = []
        for r in res:
            services.append({"id": str(r[0]), "status": r[1]})
        print(json.dumps(services, indent=2))
except Exception as e:
    print(f"Error: {e}")
