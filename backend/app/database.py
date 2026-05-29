from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Run lightweight schema migrations for SQLite."""
    with engine.connect() as conn:
        # Add trainerId column to batch_modules if it doesn't exist
        result = conn.execute(text("PRAGMA table_info(batch_modules)"))
        columns = [row[1] for row in result.fetchall()]
        if "trainerId" not in columns:
            conn.execute(text("ALTER TABLE batch_modules ADD COLUMN trainerId VARCHAR REFERENCES trainers(id)"))
            conn.commit()
