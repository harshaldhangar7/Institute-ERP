from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.counsellor import Counsellor
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.user import User
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "photo": user.photo,
        "isActive": user.isActive,
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "updatedAt": user.updatedAt.isoformat() if user.updatedAt else None,
    }


@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return error_response("Email and password are required", 400)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        return error_response("Invalid credentials", 401)

    if not pwd_context.verify(password, user.password):
        return error_response("Invalid credentials", 401)

    if not user.isActive:
        return error_response("Account is deactivated", 401)

    token = jwt.encode(
        {
            "userId": user.id,
            "email": user.email,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=24),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )

    return success_response(data={"token": token, "user": serialize_user(user)})


@router.post("/register")
async def register(
    request: Request,
    current_user: dict = Depends(role_guard(["ADMIN"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    role = body.get("role", "STUDENT")
    phone = body.get("phone")

    if not email or not password or not name:
        return error_response("Email, password, and name are required", 400)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return error_response("Email already exists", 400)

    hashed_password = pwd_context.hash(password)
    user = User(
        email=email,
        password=hashed_password,
        name=name,
        role=role,
        phone=phone,
    )
    db.add(user)
    db.flush()

    if role == "STUDENT":
        student = Student(userId=user.id, batchId=body.get("batchId"))
        db.add(student)
    elif role == "TRAINER":
        trainer = Trainer(userId=user.id, specialization=body.get("specialization"))
        db.add(trainer)
    elif role == "COUNSELLOR":
        counsellor = Counsellor(userId=user.id)
        db.add(counsellor)

    db.commit()
    db.refresh(user)

    return success_response(data=serialize_user(user), message="User registered successfully", status_code=201)


@router.get("/me")
async def get_me(
    current_user: dict = Depends(authenticate),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user["userId"]).first()
    if not user:
        return error_response("User not found", 404)

    return success_response(data=serialize_user(user))


@router.post("/change-password")
async def change_password(
    request: Request,
    current_user: dict = Depends(authenticate),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    current_password = body.get("currentPassword")
    new_password = body.get("newPassword")

    if not current_password or not new_password:
        return error_response("Current password and new password are required", 400)

    user = db.query(User).filter(User.id == current_user["userId"]).first()
    if not user:
        return error_response("User not found", 404)

    if not pwd_context.verify(current_password, user.password):
        return error_response("Current password is incorrect", 400)

    user.password = pwd_context.hash(new_password)
    user.updatedAt = datetime.utcnow()
    db.commit()

    return success_response(message="Password changed successfully")
