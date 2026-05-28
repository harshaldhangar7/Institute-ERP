import uuid

from passlib.context import CryptContext

from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestLogin:
    def test_login_valid_credentials(self, client, db_session):
        """POST /api/auth/login with valid admin credentials should return 200 and a token."""
        user = User(
            id=str(uuid.uuid4()),
            email=f"login_valid_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("admin123"),
            role="ADMIN",
            name="Login Test User",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()

        response = client.post("/api/auth/login", json={
            "email": user.email,
            "password": "admin123",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert "user" in data["data"]
        assert data["data"]["user"]["email"] == user.email

    def test_login_invalid_password(self, client, db_session):
        """POST /api/auth/login with invalid password should return 401."""
        user = User(
            id=str(uuid.uuid4()),
            email=f"login_invalid_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("correct_pass"),
            role="ADMIN",
            name="Invalid Pass Test",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()

        response = client.post("/api/auth/login", json={
            "email": user.email,
            "password": "wrong_password",
        })
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False

    def test_login_nonexistent_user(self, client):
        """POST /api/auth/login with non-existent email should return 401."""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anything",
        })
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False


class TestRegister:
    def test_register_as_admin(self, client, admin_token):
        """POST /api/auth/register with admin token should create a new user (201)."""
        new_email = f"newuser_{uuid.uuid4().hex[:8]}@test.com"
        response = client.post(
            "/api/auth/register",
            json={
                "email": new_email,
                "password": "newpass123",
                "name": "New User",
                "role": "STUDENT",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == new_email

    def test_register_without_token(self, client):
        """POST /api/auth/register without token should return 401."""
        response = client.post("/api/auth/register", json={
            "email": "no_token@test.com",
            "password": "pass123",
            "name": "No Token User",
        })
        assert response.status_code == 401

    def test_register_as_student_rejected(self, client, student_token):
        """POST /api/auth/register with student token should return 403."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "student_reg@test.com",
                "password": "pass123",
                "name": "Student Reg",
            },
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 403

    def test_register_duplicate_email(self, client, admin_token, db_session):
        """POST /api/auth/register with existing email should return 400."""
        existing_email = f"existing_{uuid.uuid4().hex[:8]}@test.com"
        user = User(
            id=str(uuid.uuid4()),
            email=existing_email,
            password=pwd_context.hash("pass"),
            role="STUDENT",
            name="Existing User",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()

        response = client.post(
            "/api/auth/register",
            json={
                "email": existing_email,
                "password": "pass123",
                "name": "Duplicate",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestGetMe:
    def test_get_me(self, client, admin_user, admin_token):
        """GET /api/auth/me with valid token should return user data."""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == admin_user.email
        assert data["data"]["name"] == admin_user.name

    def test_get_me_unauthenticated(self, client):
        """GET /api/auth/me without token should return 401."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401


class TestChangePassword:
    def test_change_password(self, client, db_session):
        """POST /api/auth/change-password with correct current password should succeed."""
        user = User(
            id=str(uuid.uuid4()),
            email=f"chgpwd_{uuid.uuid4().hex[:8]}@test.com",
            password=pwd_context.hash("oldpass123"),
            role="ADMIN",
            name="Change Pass User",
            isActive=True,
        )
        db_session.add(user)
        db_session.flush()

        from app.config import settings
        from jose import jwt
        from datetime import datetime, timedelta

        token = jwt.encode(
            {"userId": user.id, "email": user.email, "role": user.role, "exp": datetime.utcnow() + timedelta(hours=24)},
            settings.JWT_SECRET,
            algorithm="HS256",
        )

        response = client.post(
            "/api/auth/change-password",
            json={
                "currentPassword": "oldpass123",
                "newPassword": "newpass456",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify new password works
        login_response = client.post("/api/auth/login", json={
            "email": user.email,
            "password": "newpass456",
        })
        assert login_response.status_code == 200

    def test_change_password_wrong_current(self, client, admin_user, admin_token):
        """POST /api/auth/change-password with wrong current password should return 400."""
        response = client.post(
            "/api/auth/change-password",
            json={
                "currentPassword": "totally_wrong",
                "newPassword": "newpass456",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
