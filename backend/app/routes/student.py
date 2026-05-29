from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.assignment import Assignment, Submission
from app.models.attendance import Attendance
from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.lecture import Lecture
from app.models.marks import Marks
from app.models.mock_interview import MockInterview
from app.models.notification import Notification
from app.models.resource import Resource
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/student",
    tags=["student"],
    dependencies=[Depends(authenticate), Depends(role_guard(["STUDENT"]))],
)


@router.get("/dashboard")
async def dashboard(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    batch_info = None
    trainers_list = []
    module_progress = []

    if student.batchId:
        batch = db.query(Batch).filter(Batch.id == student.batchId).first()
        if batch:
            batch_info = {
                "id": batch.id,
                "name": batch.name,
                "startDate": batch.startDate.isoformat() if batch.startDate else None,
                "endDate": batch.endDate.isoformat() if batch.endDate else None,
                "isActive": batch.isActive,
            }

        # Get all trainers assigned to this batch
        trainer_batches = db.query(TrainerBatch).filter(TrainerBatch.batchId == student.batchId).all()
        for tb in trainer_batches:
            trainer = db.query(Trainer).filter(Trainer.id == tb.trainerId).first()
            if trainer and trainer.user:
                trainers_list.append({
                    "id": trainer.id,
                    "name": trainer.user.name,
                    "specialization": trainer.specialization,
                })

        # Module progress with trainer info
        batch_modules = db.query(BatchModule).filter(BatchModule.batchId == student.batchId).all()
        for bm in batch_modules:
            trainer_info = None
            if bm.trainerId and bm.trainer and bm.trainer.user:
                trainer_info = {
                    "id": bm.trainer.id,
                    "name": bm.trainer.user.name,
                }
            module_progress.append({
                "moduleId": bm.moduleId,
                "name": bm.module.name if bm.module else None,
                "status": bm.status,
                "progress": bm.completionPercent,
                "trainer": trainer_info,
            })

    # Attendance percentage
    total_lectures = 0
    if student.batchId:
        total_lectures = db.query(Lecture).filter(Lecture.batchId == student.batchId).count()
    present_count = db.query(Attendance).filter(
        Attendance.studentId == student.id,
        Attendance.status == "PRESENT",
    ).count()
    attendance_pct = (present_count / total_lectures * 100) if total_lectures > 0 else 0

    # Add trainers to batch_info
    if batch_info:
        batch_info["trainers"] = trainers_list

    return success_response(data={
        "batch": batch_info,
        "attendance": round(attendance_pct, 2),
        "modules": module_progress,
    })


@router.get("/attendance")
async def get_attendance(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    attendances = db.query(Attendance).filter(Attendance.studentId == student.id).all()

    total = len(attendances)
    present = sum(1 for a in attendances if a.status == "PRESENT")
    absent = sum(1 for a in attendances if a.status == "ABSENT")
    percentage = (present / total * 100) if total > 0 else 0

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
            "module": {
                "id": a.lecture.module.id,
                "name": a.lecture.module.name,
            } if a.lecture.module else None,
        } if a.lecture else None,
    } for a in attendances]

    return success_response(data={
        "records": records,
        "stats": {
            "total": total,
            "present": present,
            "absent": absent,
            "percentage": round(percentage, 2),
        },
    })


@router.get("/marks")
async def get_marks(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    marks = db.query(Marks).filter(Marks.studentId == student.id).all()

    # Group by module
    grouped = {}
    for m in marks:
        module_id = m.moduleId
        if module_id not in grouped:
            grouped[module_id] = {
                "moduleId": module_id,
                "moduleName": m.module.name if m.module else None,
                "theory": [],
                "practical": [],
                "project": [],
            }
        entry = {
            "id": m.id,
            "score": m.score,
            "maxScore": m.maxScore,
            "remarks": m.remarks,
        }
        mark_type = m.type.upper() if m.type else ""
        if mark_type == "THEORY":
            grouped[module_id]["theory"].append(entry)
        elif mark_type == "PRACTICAL":
            grouped[module_id]["practical"].append(entry)
        elif mark_type == "PROJECT":
            grouped[module_id]["project"].append(entry)

    return success_response(data=list(grouped.values()))


@router.get("/mock-interviews")
async def get_mock_interviews(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    interviews = db.query(MockInterview).filter(MockInterview.studentId == student.id).all()
    data = [{
        "id": mi.id,
        "studentId": mi.studentId,
        "trainerId": mi.trainerId,
        "date": mi.date.isoformat() if mi.date else None,
        "communication": mi.communication,
        "technical": mi.technical,
        "confidence": mi.confidence,
        "overallScore": mi.overallScore,
        "feedback": mi.feedback,
        "trainer": {
            "id": mi.trainer.id,
            "user": {
                "name": mi.trainer.user.name,
            } if mi.trainer.user else None,
        } if mi.trainer else None,
    } for mi in interviews]

    return success_response(data=data)


@router.get("/assignments")
async def get_assignments(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    if not student.batchId:
        return success_response(data=[])

    assignments = db.query(Assignment).filter(Assignment.batchId == student.batchId).all()
    data = []
    for a in assignments:
        submission = db.query(Submission).filter(
            Submission.assignmentId == a.id,
            Submission.studentId == student.id,
        ).first()

        data.append({
            "id": a.id,
            "moduleId": a.moduleId,
            "batchId": a.batchId,
            "trainerId": a.trainerId,
            "title": a.title,
            "description": a.description,
            "dueDate": a.dueDate.isoformat() if a.dueDate else None,
            "filePath": a.filePath,
            "module": {
                "id": a.module.id,
                "name": a.module.name,
            } if a.module else None,
            "submission": {
                "id": submission.id,
                "filePath": submission.filePath,
                "submittedAt": submission.submittedAt.isoformat() if submission.submittedAt else None,
                "grade": submission.grade,
                "feedback": submission.feedback,
            } if submission else None,
        })

    return success_response(data=data)


@router.get("/resources")
async def get_resources(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    if not student.batchId:
        return success_response(data=[])

    batch_modules = db.query(BatchModule).filter(BatchModule.batchId == student.batchId).all()
    module_ids = [bm.moduleId for bm in batch_modules]

    resources = db.query(Resource).filter(Resource.moduleId.in_(module_ids)).all() if module_ids else []
    data = [{
        "id": r.id,
        "moduleId": r.moduleId,
        "trainerId": r.trainerId,
        "title": r.title,
        "filePath": r.filePath,
        "uploadedAt": r.uploadedAt.isoformat() if r.uploadedAt else None,
        "module": {
            "id": r.module.id,
            "name": r.module.name,
        } if r.module else None,
    } for r in resources]

    return success_response(data=data)


@router.get("/lectures")
async def get_lectures(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    if not student.batchId:
        return success_response(data=[])

    lectures = db.query(Lecture).filter(Lecture.batchId == student.batchId).order_by(Lecture.date.desc()).all()
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
        "module": {
            "id": l.module.id,
            "name": l.module.name,
        } if l.module else None,
        "trainer": {
            "user": {
                "name": l.trainer.user.name,
            } if l.trainer and l.trainer.user else None,
        } if l.trainer else None,
    } for l in lectures]

    return success_response(data=data)


@router.get("/notifications")
async def get_notifications(
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    notifications = db.query(Notification).filter(
        Notification.userId == current_user["userId"]
    ).order_by(Notification.createdAt.desc()).all()

    data = [{
        "id": n.id,
        "userId": n.userId,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "isRead": n.isRead,
        "createdAt": n.createdAt.isoformat() if n.createdAt else None,
    } for n in notifications]

    return success_response(data=data)
