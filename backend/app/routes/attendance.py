import hashlib
import hmac
import time
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.attendance import Attendance
from app.models.lecture import Lecture
from app.models.student import Student
from app.models.trainer import Trainer
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/attendance",
    tags=["attendance"],
    dependencies=[Depends(authenticate), Depends(role_guard(["TRAINER", "STUDENT"]))],
)


@router.post("/generate-qr")
async def generate_qr(
    request: Request,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    lecture_id = body.get("lectureId")
    if not lecture_id:
        return error_response("Lecture ID is required", 400)

    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        return error_response("Lecture not found", 404)

    # Verify trainer owns this lecture
    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer or lecture.trainerId != trainer.id:
        return error_response("Access denied", 403)

    timestamp = str(int(time.time()))
    message = f"{lecture_id}:{timestamp}"
    token = hmac.new(
        settings.QR_HMAC_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    # Store session token in lecture
    lecture.sessionToken = token
    db.commit()

    return success_response(data={
        "lectureId": lecture_id,
        "token": token,
        "timestamp": timestamp,
        "expiresIn": 10,
    })


@router.post("/mark-qr")
async def mark_qr(
    request: Request,
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    lecture_id = body.get("lectureId")
    token = body.get("token")
    timestamp = body.get("timestamp")

    if not lecture_id or not token or not timestamp:
        return error_response("lectureId, token, and timestamp are required", 400)

    # Validate token age (must be < 10 seconds old)
    current_time = int(time.time())
    token_time = int(timestamp)
    if current_time - token_time > 10:
        return error_response("QR code has expired", 400)

    # Validate HMAC token
    message = f"{lecture_id}:{timestamp}"
    expected_token = hmac.new(
        settings.QR_HMAC_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(token, expected_token):
        return error_response("Invalid QR token", 400)

    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        return error_response("Lecture not found", 404)

    # Check attendance window: must be within 5 minutes after lecture end
    if lecture.date and lecture.endTime:
        try:
            end_time_parts = lecture.endTime.split(":")
            lecture_end = lecture.date.replace(
                hour=int(end_time_parts[0]),
                minute=int(end_time_parts[1]),
                second=0,
                microsecond=0,
            )
            window_end = lecture_end.timestamp() + (5 * 60)  # 5 minutes after lecture end
            if current_time > window_end:
                return error_response("Attendance window has closed", 400)
        except (ValueError, IndexError):
            pass  # If time parsing fails, skip window check

    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    # Check if already marked
    existing = db.query(Attendance).filter(
        Attendance.studentId == student.id,
        Attendance.lectureId == lecture_id,
    ).first()
    if existing:
        return error_response("Attendance already marked for this lecture", 400)

    attendance = Attendance(
        studentId=student.id,
        lectureId=lecture_id,
        status="PRESENT",
        method="QR",
    )
    db.add(attendance)
    db.commit()

    return success_response(message="Attendance marked successfully", status_code=201)


@router.post("/mark-online")
async def mark_online(
    request: Request,
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    lecture_id = body.get("lectureId")
    join_duration = body.get("joinDuration")

    if not lecture_id or join_duration is None:
        return error_response("lectureId and joinDuration are required", 400)

    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        return error_response("Lecture not found", 404)

    # Require 70% of lecture duration (default to 60 minutes if not set)
    lecture_duration = lecture.duration or 60
    required_duration = lecture_duration * 0.7
    if join_duration < required_duration:
        return error_response(
            f"Insufficient attendance. Required: {required_duration:.0f} min, attended: {join_duration} min",
            400,
        )

    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    # Check if already marked
    existing = db.query(Attendance).filter(
        Attendance.studentId == student.id,
        Attendance.lectureId == lecture_id,
    ).first()
    if existing:
        return error_response("Attendance already marked for this lecture", 400)

    attendance = Attendance(
        studentId=student.id,
        lectureId=lecture_id,
        status="PRESENT",
        method="ONLINE",
    )
    db.add(attendance)
    db.commit()

    return success_response(message="Attendance marked successfully", status_code=201)


@router.get("/history/{student_id}")
async def get_history(
    student_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)

    attendances = db.query(Attendance).filter(Attendance.studentId == student_id).all()

    total_lectures = 0
    if student.batchId:
        total_lectures = db.query(Lecture).filter(Lecture.batchId == student.batchId).count()

    present_count = sum(1 for a in attendances if a.status == "PRESENT")
    percentage = (present_count / total_lectures * 100) if total_lectures > 0 else 0

    records = [{
        "id": a.id,
        "studentId": a.studentId,
        "lectureId": a.lectureId,
        "status": a.status,
        "markedAt": a.markedAt.isoformat() if a.markedAt else None,
        "method": a.method,
        "lecture": {
            "id": a.lecture.id,
            "date": a.lecture.date.isoformat() if a.lecture.date else None,
            "startTime": a.lecture.startTime,
            "endTime": a.lecture.endTime,
            "topics": a.lecture.topics,
        } if a.lecture else None,
    } for a in attendances]

    return success_response(data={
        "records": records,
        "totalLectures": total_lectures,
        "presentCount": present_count,
        "percentage": round(percentage, 2),
    })


@router.get("/batch/{batch_id}/{lecture_id}")
async def get_batch_attendance(
    batch_id: str,
    lecture_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "STUDENT"])),
    db: Session = Depends(get_db),
):
    attendances = db.query(Attendance).filter(Attendance.lectureId == lecture_id).all()

    data = [{
        "id": a.id,
        "studentId": a.studentId,
        "lectureId": a.lectureId,
        "status": a.status,
        "markedAt": a.markedAt.isoformat() if a.markedAt else None,
        "method": a.method,
        "student": {
            "id": a.student.id,
            "user": {
                "id": a.student.user.id,
                "name": a.student.user.name,
                "email": a.student.user.email,
            } if a.student.user else None,
        } if a.student else None,
    } for a in attendances]

    return success_response(data=data)
