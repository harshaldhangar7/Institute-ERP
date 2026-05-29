from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.attendance import Attendance
from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.lecture import Lecture
from app.models.marks import Marks
from app.models.module import Module
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/trainer",
    tags=["trainer"],
    dependencies=[Depends(authenticate), Depends(role_guard(["TRAINER"]))],
)


@router.get("/dashboard")
async def dashboard(
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer:
        return error_response("Trainer profile not found", 404)

    # Get trainer's batches
    trainer_batches = db.query(TrainerBatch).filter(TrainerBatch.trainerId == trainer.id).all()
    batch_ids = [tb.batchId for tb in trainer_batches]

    # Count students across all batches
    student_count = db.query(Student).filter(Student.batchId.in_(batch_ids)).count() if batch_ids else 0

    # Count lectures
    lecture_count = db.query(Lecture).filter(Lecture.trainerId == trainer.id).count()

    # Get upcoming lectures (date >= today)
    today = date.today()
    upcoming = db.query(Lecture).options(
        joinedload(Lecture.batch),
    ).filter(
        Lecture.trainerId == trainer.id,
        Lecture.date >= datetime.combine(today, datetime.min.time()),
    ).order_by(Lecture.date.asc()).limit(5).all()

    upcoming_data = [{
        "topic": l.topics or "No topic",
        "date": l.date.isoformat() if l.date else None,
        "batch": l.batch.name if l.batch else None,
    } for l in upcoming]

    return success_response(data={
        "batches": len(batch_ids),
        "students": student_count,
        "lectures": lecture_count,
        "upcomingLectures": upcoming_data,
    })


@router.get("/batches")
async def get_batches(
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer:
        return error_response("Trainer profile not found", 404)

    trainer_batches = db.query(TrainerBatch).filter(TrainerBatch.trainerId == trainer.id).all()
    batch_ids = [tb.batchId for tb in trainer_batches]
    batches = db.query(Batch).filter(Batch.id.in_(batch_ids)).all()

    data = []
    for b in batches:
        student_count = db.query(Student).filter(Student.batchId == b.id).count()
        data.append({
            "id": b.id,
            "name": b.name,
            "startDate": b.startDate.isoformat() if b.startDate else None,
            "endDate": b.endDate.isoformat() if b.endDate else None,
            "isActive": b.isActive,
            "status": "ACTIVE" if b.isActive else "COMPLETED",
            "studentCount": student_count,
        })

    return success_response(data=data)


@router.get("/batches/{batch_id}/students")
async def get_batch_students(
    batch_id: str,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    students = db.query(Student).filter(Student.batchId == batch_id).all()
    data = []
    for student in students:
        # Calculate attendance percentage
        total_lectures = db.query(Lecture).filter(Lecture.batchId == batch_id).count()
        present_count = db.query(Attendance).filter(
            Attendance.studentId == student.id,
            Attendance.status == "PRESENT",
        ).count()
        attendance_pct = (present_count / total_lectures * 100) if total_lectures > 0 else 0

        # Calculate average marks
        avg_marks = db.query(func.avg(Marks.score)).filter(
            Marks.studentId == student.id
        ).scalar() or 0

        data.append({
            "id": student.id,
            "userId": student.userId,
            "batchId": student.batchId,
            "mode": student.mode,
            "enrollmentDate": student.enrollmentDate.isoformat() if student.enrollmentDate else None,
            "user": {
                "id": student.user.id,
                "name": student.user.name,
                "email": student.user.email,
                "phone": student.user.phone,
            } if student.user else None,
            "attendancePercentage": round(attendance_pct, 2),
            "avgMarks": round(float(avg_marks), 2),
        })

    return success_response(data=data)


@router.get("/batches/{batch_id}/modules")
async def get_batch_modules(
    batch_id: str,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    batch_modules = db.query(BatchModule).filter(BatchModule.batchId == batch_id).all()
    data = []
    for bm in batch_modules:
        module = bm.module
        data.append({
            "id": bm.id,
            "batchId": bm.batchId,
            "moduleId": bm.moduleId,
            "status": bm.status,
            "completionPercent": bm.completionPercent,
            "module": {
                "id": module.id,
                "name": module.name,
                "description": module.description,
                "duration": module.duration,
            } if module else None,
        })

    return success_response(data=data)


@router.post("/lectures")
async def create_lecture(
    request: Request,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer:
        return error_response("Trainer profile not found", 404)

    batch_id = body.get("batchId")
    module_id = body.get("moduleId")
    date_str = body.get("date")
    start_time = body.get("startTime")
    topics = body.get("topics")

    if not batch_id or not module_id or not date_str or not start_time:
        return error_response("batchId, moduleId, date, and startTime are required", 400)

    lecture = Lecture(
        batchId=batch_id,
        moduleId=module_id,
        trainerId=trainer.id,
        date=datetime.fromisoformat(date_str) if isinstance(date_str, str) else date_str,
        startTime=start_time,
        endTime="",
        topics=topics,
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    return success_response(data={
        "id": lecture.id,
        "batchId": lecture.batchId,
        "moduleId": lecture.moduleId,
        "trainerId": lecture.trainerId,
        "date": lecture.date.isoformat() if lecture.date else None,
        "startTime": lecture.startTime,
        "endTime": lecture.endTime,
        "duration": lecture.duration,
        "topics": lecture.topics,
        "sessionToken": lecture.sessionToken,
    }, message="Lecture created successfully", status_code=201)


@router.put("/lectures/{lecture_id}/end")
async def end_lecture(
    lecture_id: str,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        return error_response("Lecture not found", 404)

    # Calculate duration from startTime to now
    now = datetime.now(timezone.utc)
    end_time_str = now.strftime("%H:%M")
    try:
        start_parts = lecture.startTime.split(":")
        start_hour = int(start_parts[0])
        start_min = int(start_parts[1])
        end_parts = end_time_str.split(":")
        end_hour = int(end_parts[0])
        end_min = int(end_parts[1])
        duration_minutes = (end_hour * 60 + end_min) - (start_hour * 60 + start_min)
        if duration_minutes < 0:
            duration_minutes = 0
    except (ValueError, IndexError):
        duration_minutes = 0

    lecture.endTime = end_time_str
    lecture.duration = duration_minutes
    db.commit()
    db.refresh(lecture)

    hours = duration_minutes // 60
    minutes = duration_minutes % 60
    duration_display = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

    return success_response(data={
        "id": lecture.id,
        "batchId": lecture.batchId,
        "moduleId": lecture.moduleId,
        "trainerId": lecture.trainerId,
        "date": lecture.date.isoformat() if lecture.date else None,
        "startTime": lecture.startTime,
        "endTime": lecture.endTime,
        "duration": lecture.duration,
        "durationDisplay": duration_display,
        "topics": lecture.topics,
    }, message=f"Lecture ended. Duration: {duration_display}")


@router.get("/lectures")
async def get_lectures(
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer:
        return error_response("Trainer profile not found", 404)

    lectures = db.query(Lecture).filter(Lecture.trainerId == trainer.id).order_by(Lecture.date.desc()).all()
    data = [{
        "id": l.id,
        "batchId": l.batchId,
        "moduleId": l.moduleId,
        "trainerId": l.trainerId,
        "date": l.date.isoformat() if l.date else None,
        "startTime": l.startTime,
        "endTime": l.endTime,
        "duration": l.duration,
        "topics": l.topics,
        "batch": {
            "id": l.batch.id,
            "name": l.batch.name,
        } if l.batch else None,
        "module": {
            "id": l.module.id,
            "name": l.module.name,
        } if l.module else None,
    } for l in lectures]

    return success_response(data=data)
