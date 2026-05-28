import os
import uuid

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.counsellor import Counsellor
from app.models.module import Module
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.models.user import User
from app.utils.auth import hash_password

# Use a separate test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Clean up test.db file
    if os.path.exists("./test.db"):
        os.remove("./test.db")


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    yield session
    session.rollback()
    session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _generate_token(user_id, email, role):
    from datetime import datetime, timedelta, timezone

    return jwt.encode(
        {
            "userId": user_id,
            "email": email,
            "role": role,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )


@pytest.fixture
def admin_user(db_session):
    user = User(
        id=str(uuid.uuid4()),
        email=f"admin_{uuid.uuid4().hex[:8]}@test.com",
        password=hash_password("admin123"),
        role="ADMIN",
        name="Test Admin",
        phone="9000000001",
        isActive=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture
def admin_token(admin_user):
    return _generate_token(admin_user.id, admin_user.email, admin_user.role)


@pytest.fixture
def trainer_user(db_session):
    user = User(
        id=str(uuid.uuid4()),
        email=f"trainer_{uuid.uuid4().hex[:8]}@test.com",
        password=hash_password("trainer123"),
        role="TRAINER",
        name="Test Trainer",
        phone="9000000002",
        isActive=True,
    )
    db_session.add(user)
    db_session.flush()

    trainer = Trainer(
        id=str(uuid.uuid4()),
        userId=user.id,
        specialization="Full Stack Development",
    )
    db_session.add(trainer)
    db_session.flush()
    user._trainer = trainer
    return user


@pytest.fixture
def trainer_token(trainer_user):
    return _generate_token(trainer_user.id, trainer_user.email, trainer_user.role)


@pytest.fixture
def student_user(db_session):
    user = User(
        id=str(uuid.uuid4()),
        email=f"student_{uuid.uuid4().hex[:8]}@test.com",
        password=hash_password("student123"),
        role="STUDENT",
        name="Test Student",
        phone="9000000003",
        isActive=True,
    )
    db_session.add(user)
    db_session.flush()

    student = Student(
        id=str(uuid.uuid4()),
        userId=user.id,
        mode="OFFLINE",
    )
    db_session.add(student)
    db_session.flush()
    user._student = student
    return user


@pytest.fixture
def student_token(student_user):
    return _generate_token(student_user.id, student_user.email, student_user.role)


@pytest.fixture
def sample_batch(db_session):
    from datetime import datetime

    batch = Batch(
        id=str(uuid.uuid4()),
        name="Test Batch",
        startDate=datetime(2024, 1, 15),
        endDate=datetime(2024, 7, 15),
        isActive=True,
    )
    db_session.add(batch)
    db_session.flush()
    return batch


@pytest.fixture
def sample_module(db_session):
    module = Module(
        id=str(uuid.uuid4()),
        name="Test Module",
        description="Test module description",
        duration=40,
    )
    db_session.add(module)
    db_session.flush()
    return module
