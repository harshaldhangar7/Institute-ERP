import uuid

from passlib.context import CryptContext

from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.module import Module
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestDashboard:
    def test_get_dashboard(self, client, admin_token):
        """GET /api/admin/dashboard with admin token should return stats."""
        response = client.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "totalStudents" in data["data"]
        assert "activeBatches" in data["data"]
        assert "totalTrainers" in data["data"]
        assert "totalCounsellors" in data["data"]
        assert "attendanceOverview" in data["data"]
        assert "feeCollectionStatus" in data["data"]


class TestStudentsCRUD:
    def test_create_student(self, client, admin_token, sample_batch):
        """POST /api/admin/students should create a student (201)."""
        email = f"new_student_{uuid.uuid4().hex[:8]}@test.com"
        response = client.post(
            "/api/admin/students",
            json={
                "email": email,
                "password": "student123",
                "name": "New Student",
                "phone": "9876543210",
                "batchId": sample_batch.id,
                "mode": "OFFLINE",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["user"]["email"] == email

    def test_get_students_paginated(self, client, admin_token, db_session):
        """GET /api/admin/students?page=1&limit=5 should return paginated results."""
        # Create a few students
        for i in range(3):
            user = User(
                id=str(uuid.uuid4()),
                email=f"paginate_{uuid.uuid4().hex[:8]}@test.com",
                password=pwd_context.hash("pass"),
                role="STUDENT",
                name=f"Paginate Student {i}",
                isActive=True,
            )
            db_session.add(user)
            db_session.flush()
            student = Student(id=str(uuid.uuid4()), userId=user.id, mode="OFFLINE")
            db_session.add(student)
        db_session.flush()

        response = client.get(
            "/api/admin/students?page=1&limit=5",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "totalPages" in data
        assert data["page"] == 1
        assert data["limit"] == 5

    def test_update_student(self, client, admin_token, db_session):
        """PUT /api/admin/students/:id should update a student."""
        user = User(
            id=str(uuid.uuid4()),
            email=f"update_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("pass"),
            role="STUDENT",
            name="Update Me",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()
        student = Student(id=str(uuid.uuid4()), userId=user.id, mode="OFFLINE")
        db_session.add(student)
        db_session.flush()

        response = client.put(
            f"/api/admin/students/{student.id}",
            json={"name": "Updated Name", "mode": "ONLINE"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["user"]["name"] == "Updated Name"
        assert data["data"]["mode"] == "ONLINE"

    def test_delete_student(self, client, admin_token, db_session):
        """DELETE /api/admin/students/:id should delete a student."""
        user = User(
            id=str(uuid.uuid4()),
            email=f"delete_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("pass"),
            role="STUDENT",
            name="Delete Me",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()
        student = Student(id=str(uuid.uuid4()), userId=user.id, mode="OFFLINE")
        db_session.add(student)
        db_session.flush()

        response = client.delete(
            f"/api/admin/students/{student.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestBatchesCRUD:
    def test_create_batch(self, client, admin_token):
        """POST /api/admin/batches should create a batch (201)."""
        response = client.post(
            "/api/admin/batches",
            json={
                "name": "New Test Batch",
                "startDate": "2024-05-01T00:00:00",
                "endDate": "2024-11-01T00:00:00",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "New Test Batch"

    def test_get_batches(self, client, admin_token, sample_batch):
        """GET /api/admin/batches should return a list of batches."""
        response = client.get(
            "/api/admin/batches",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "total" in data


class TestModulesCRUD:
    def test_create_module(self, client, admin_token):
        """POST /api/admin/modules should create a module (201)."""
        response = client.post(
            "/api/admin/modules",
            json={
                "name": "New Test Module",
                "description": "A test module",
                "duration": 30,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "New Test Module"


class TestAssignments:
    def test_assign_trainer_batch(self, client, admin_token, db_session, sample_batch):
        """POST /api/admin/assign-trainer-batch should assign a trainer to a batch."""
        user = User(
            id=str(uuid.uuid4()),
            email=f"assign_tr_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("pass"),
            role="TRAINER",
            name="Assign Trainer",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()
        trainer = Trainer(id=str(uuid.uuid4()), userId=user.id, specialization="Test")
        db_session.add(trainer)
        db_session.flush()

        response = client.post(
            "/api/admin/assign-trainer-batch",
            json={"trainerId": trainer.id, "batchId": sample_batch.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    def test_assign_module_batch(self, client, admin_token, sample_batch, sample_module):
        """POST /api/admin/assign-module-batch should assign a module to a batch."""
        response = client.post(
            "/api/admin/assign-module-batch",
            json={"moduleId": sample_module.id, "batchId": sample_batch.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True


class TestAccessControl:
    def test_admin_endpoints_reject_non_admin(self, client, student_token):
        """Admin endpoints should reject student tokens with 403."""
        response = client.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 403

        response = client.get(
            "/api/admin/students",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 403

        response = client.post(
            "/api/admin/batches",
            json={"name": "Unauthorized", "startDate": "2024-01-01T00:00:00"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 403
