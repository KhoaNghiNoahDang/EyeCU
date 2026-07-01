from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# Supabase connection uses postgresql://, which SQLAlchemy handles fine.
# We ensure we have pool pre-ping to handle connection drops.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Alias de tuong thich voi code dung Base.metadata.create_all()
Base = SQLModel


def get_db():
    with Session(engine) as session:
        yield session
