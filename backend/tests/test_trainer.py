import uuid
from datetime import datetime

from passlib.context import CryptContext

from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.lecture import Lecture
from app.models.module import Module
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestTrainerBatches:
    def test_get_batches(self, client, trainer_user, trainer_token, db_session):
        """GET /api/trainer/batches should return trainer's assigned batches."""
        trainer = db_session.query(Trainer).filter(Trainer.userId == trainer_user.id).first()

        batch = Batch(
            id=str(uuid.uuid4()),
            name="Trainer Test Batch",
            startDate=datetime(2024, 1, 15),
            endDate=datetime(2024, 7, 15),
            isActive=True,
        )
        db_session.add(batch)
        db_session.flush()

        tb = TrainerBatch(id=str(uuid.uuid4()), trainerId=trainer.id, batchId=batch.id)
        db_session.add(tb)
        db_session.flush()

        response = client.get(
            "/api/trainer/batches",
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 1
        batch_names = [b["name"] for b in data["data"]]
        assert "Trainer Test Batch" in batch_names

    def test_get_batch_students(self, client, trainer_user, trainer_token, db_session):
        """GET /api/trainer/batches/:id/students should return students in the batch."""
        trainer = db_session.query(Trainer).filter(Trainer.userId == trainer_user.id).first()

        batch = Batch(
            id=str(uuid.uuid4()),
            name="Students Test Batch",
            startDate=datetime(2024, 1, 15),
            endDate=datetime(2024, 7, 15),
            isActive=True,
        )
        db_session.add(batch)
        db_session.flush()

        tb = TrainerBatch(id=str(uuid.uuid4()), trainerId=trainer.id, batchId=batch.id)
        db_session.add(tb)
        db_session.flush()

        # Add a student to the batch
        student_user_obj = User(
            id=str(uuid.uuid4()),
            email=f"batch_student_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("student123"),
            role="STUDENT",
            name="Batch Student",
            isActive=True,
        )
        db_session.add(student_user_obj)
        db_session.flush()
        student = Student(id=str(uuid.uuid4()), userId=student_user_obj.id, batchId=batch.id, mode="OFFLINE")
        db_session.add(student)
        db_session.flush()

        response = client.get(
            f"/api/trainer/batches/{batch.id}/students",
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 1
        assert data["data"][0]["user"]["name"] == "Batch Student"


class TestTrainerLectures:
    def test_create_lecture(self, client, trainer_user, trainer_token, db_session):
        """POST /api/trainer/lectures should create a lecture (201)."""
        trainer = db_session.query(Trainer).filter(Trainer.userId == trainer_user.id).first()

        batch = Batch(
            id=str(uuid.uuid4()),
            name="Lecture Batch",
            startDate=datetime(2024, 1, 15),
            endDate=datetime(2024, 7, 15),
            isActive=True,
        )
        db_session.add(batch)
        db_session.flush()

        module = Module(id=str(uuid.uuid4()), name="Lecture Module", duration=40)
        db_session.add(module)
        db_session.flush()

        response = client.post(
            "/api/trainer/lectures",
            json={
                "batchId": batch.id,
                "moduleId": module.id,
                "date": "2024-02-15T00:00:00",
                "startTime": "10:00",
                "endTime": "12:00",
                "topics": "Introduction to Testing",
            },
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["batchId"] == batch.id
        assert data["data"]["moduleId"] == module.id
        assert data["data"]["trainerId"] == trainer.id

    def test_get_lectures(self, client, trainer_user, trainer_token, db_session):
        """GET /api/trainer/lectures should return trainer's lectures."""
        trainer = db_session.query(Trainer).filter(Trainer.userId == trainer_user.id).first()

        batch = Batch(
            id=str(uuid.uuid4()),
            name="Get Lectures Batch",
            startDate=datetime(2024, 1, 15),
            endDate=datetime(2024, 7, 15),
            isActive=True,
        )
        db_session.add(batch)
        db_session.flush()

        module = Module(id=str(uuid.uuid4()), name="Get Lectures Module", duration=40)
        db_session.add(module)
        db_session.flush()

        lecture = Lecture(
            id=str(uuid.uuid4()),
            batchId=batch.id,
            moduleId=module.id,
            trainerId=trainer.id,
            date=datetime(2024, 2, 15),
            startTime="10:00",
            endTime="12:00",
            duration=120,
            topics="Existing Lecture",
        )
        db_session.add(lecture)
        db_session.flush()

        response = client.get(
            "/api/trainer/lectures",
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 1

    def test_end_lecture(self, client, trainer_user, trainer_token, db_session):
        """PUT /api/trainer/lectures/:id/end should end the lecture."""
        trainer = db_session.query(Trainer).filter(Trainer.userId == trainer_user.id).first()

        batch = Batch(
            id=str(uuid.uuid4()),
            name="End Lecture Batch",
            startDate=datetime(2024, 1, 15),
            endDate=datetime(2024, 7, 15),
            isActive=True,
        )
        db_session.add(batch)
        db_session.flush()

        module = Module(id=str(uuid.uuid4()), name="End Lecture Module", duration=40)
        db_session.add(module)
        db_session.flush()

        lecture = Lecture(
            id=str(uuid.uuid4()),
            batchId=batch.id,
            moduleId=module.id,
            trainerId=trainer.id,
            date=datetime(2024, 2, 15),
            startTime="10:00",
            endTime="12:00",
            duration=None,
            topics="Lecture to End",
        )
        db_session.add(lecture)
        db_session.flush()

        response = client.put(
            f"/api/trainer/lectures/{lecture.id}/end",
            headers={"Authorization": f"Bearer {trainer_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["duration"] is not None
