import logging
import os

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import run_migrations
from app.dependencies import AuthException, authenticate
from app.utils.response import success_response, error_response

logger = logging.getLogger(__name__)

# Run database migrations
run_migrations()

# Import models to ensure they are registered with Base
import app.models  # noqa: F401

# Import route modules
from app.routes import (
    admin,
    assignments,
    attendance,
    auth,
    counsellor,
    evaluation,
    mock_interview,
    notifications,
    reports,
    resources,
    student,
    trainer,
)

app = FastAPI(title="Institute ERP API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(AuthException)
async def auth_exception_handler(request: Request, exc: AuthException):
    return error_response(exc.message, exc.status_code)


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return error_response("Internal server error", 500)


# Health check endpoint
@app.get("/api/health")
async def health_check():
    return success_response(data={"status": "ok"}, message="Server is running")


# Include all routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(trainer.router)
app.include_router(counsellor.router)
app.include_router(student.router)
app.include_router(attendance.router)
app.include_router(evaluation.router)
app.include_router(mock_interview.router)
app.include_router(assignments.router)
app.include_router(resources.router)
app.include_router(notifications.router)
app.include_router(reports.router)


# Serve uploaded files with JWT authentication (matching Node.js behavior)
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


@app.get("/uploads/{file_path:path}")
async def serve_upload(file_path: str, current_user: dict = Depends(authenticate)):
    """Serve files from uploads/ only after verifying the JWT token."""
    full_path = os.path.join(uploads_dir, file_path)
    # Prevent path traversal
    if not os.path.realpath(full_path).startswith(os.path.realpath(uploads_dir)):
        return error_response("Access denied", 403)
    if not os.path.isfile(full_path):
        return error_response("File not found", 404)
    return FileResponse(full_path)


# Serve frontend static files in production
if settings.NODE_ENV == "production":
    frontend_dist = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist"
    )
    if os.path.exists(frontend_dist):
        app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="frontend_assets")

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """Catch-all route to serve the frontend SPA."""
            file_path = os.path.join(frontend_dist, full_path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(frontend_dist, "index.html"))
