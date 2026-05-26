from typing import List

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.utils.response import error_response

security = HTTPBearer(auto_error=False)


def authenticate(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> dict:
    """JWT authentication dependency. Returns user payload {userId, email, role}."""
    if not credentials:
        raise AuthException("Access denied. No token provided.", 401)

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise AuthException("Invalid or expired token.", 401)

    user_id = payload.get("userId")
    if not user_id:
        raise AuthException("Invalid or expired token.", 401)

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.isActive:
        raise AuthException("Account is deactivated.", 401)

    return {"userId": user.id, "email": user.email, "role": user.role}


def role_guard(allowed_roles: List[str]):
    """Factory function that returns a dependency checking if user.role is in allowed_roles."""

    def guard(current_user: dict = Depends(authenticate)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise AuthException("Access denied. Insufficient permissions.", 403)
        return current_user

    return guard


class AuthException(Exception):
    """Custom exception for authentication/authorization failures."""

    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)
