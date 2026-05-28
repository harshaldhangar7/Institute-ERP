from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.mock_interview import MockInterview
from app.models.student import Student
from app.models.trainer import Trainer
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/mock-interviews",
    tags=["mock-interviews"],
    dependencies=[Depends(authenticate), Depends(role_guard(["TRAINER"]))],
)


def serialize_interview(mi: MockInterview) -> dict:
    return {
        "id": mi.id,
        "studentId": mi.studentId,
        "trainerId": mi.trainerId,
        "date": mi.date.isoformat() if mi.date else None,
        "communication": mi.communication,
        "technical": mi.technical,
        "confidence": mi.confidence,
        "overallScore": mi.overallScore,
        "feedback": mi.feedback,
        "student": {
            "id": mi.student.id,
            "user": {
                "id": mi.student.user.id,
                "name": mi.student.user.name,
            } if mi.student.user else None,
        } if mi.student else None,
        "trainer": {
            "id": mi.trainer.id,
            "user": {
                "id": mi.trainer.user.id,
                "name": mi.trainer.user.name,
            } if mi.trainer.user else None,
        } if mi.trainer else None,
    }


@router.post("/")
async def create_mock_interview(
    request: Request,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    student_id = body.get("studentId")
    date_str = body.get("date")
    communication = body.get("communication")
    technical = body.get("technical")
    confidence = body.get("confidence")
    feedback = body.get("feedback")

    if not student_id or not date_str:
        return error_response("studentId and date are required", 400)

    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer:
        return error_response("Trainer profile not found", 404)

    # Calculate overall score as average of provided scores
    scores = [s for s in [communication, technical, confidence] if s is not None]
    overall_score = sum(scores) / len(scores) if scores else None

    mi = MockInterview(
        studentId=student_id,
        trainerId=trainer.id,
        date=datetime.fromisoformat(date_str) if isinstance(date_str, str) else date_str,
        communication=communication,
        technical=technical,
        confidence=confidence,
        overallScore=overall_score,
        feedback=feedback,
    )
    db.add(mi)
    db.commit()
    db.refresh(mi)

    return success_response(data=serialize_interview(mi), message="Mock interview recorded", status_code=201)


@router.get("/{student_id}")
async def get_student_interviews(
    student_id: str,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    interviews = db.query(MockInterview).filter(MockInterview.studentId == student_id).all()
    data = [serialize_interview(mi) for mi in interviews]
    return success_response(data=data)


@router.get("/batch/{batch_id}")
async def get_batch_interviews(
    batch_id: str,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    students = db.query(Student).filter(Student.batchId == batch_id).all()
    student_ids = [s.id for s in students]

    interviews = db.query(MockInterview).filter(
        MockInterview.studentId.in_(student_ids)
    ).all() if student_ids else []

    data = [serialize_interview(mi) for mi in interviews]
    return success_response(data=data)
