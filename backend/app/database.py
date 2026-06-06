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

        # Add courseId column to batches if it doesn't exist
        result = conn.execute(text("PRAGMA table_info(batches)"))
        columns = [row[1] for row in result.fetchall()]
        if "courseId" not in columns:
            conn.execute(text("ALTER TABLE batches ADD COLUMN courseId VARCHAR REFERENCES courses(id)"))
            conn.commit()

        # Create courses table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS courses (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                description TEXT,
                duration INTEGER
            )
        """))
        conn.commit()

        # Create course_modules table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_modules (
                id VARCHAR PRIMARY KEY,
                courseId VARCHAR NOT NULL REFERENCES courses(id),
                moduleId VARCHAR NOT NULL REFERENCES modules(id),
                orderIndex INTEGER DEFAULT 0,
                UNIQUE(courseId, moduleId)
            )
        """))
        conn.commit()
