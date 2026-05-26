from datetime import datetime

from fastapi import APIRouter, Depends, Form, Request, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.assignment import Assignment, Submission
from app.models.student import Student
from app.models.trainer import Trainer
from app.utils.response import error_response, success_response
from app.utils.upload import save_upload_file

router = APIRouter(
    prefix="/api/assignments",
    tags=["assignments"],
    dependencies=[Depends(authenticate), Depends(role_guard(["TRAINER", "STUDENT"]))],
)


def serialize_assignment(a: Assignment) -> dict:
    return {
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
        "trainer": {
            "id": a.trainer.id,
            "user": {
                "name": a.trainer.user.name,
            } if a.trainer.user else None,
        } if a.trainer else None,
    }


def serialize_submission(s: Submission) -> dict:
    return {
        "id": s.id,
        "assignmentId": s.assignmentId,
        "studentId": s.studentId,
        "filePath": s.filePath,
        "submittedAt": s.submittedAt.isoformat() if s.submittedAt else None,
        "grade": s.grade,
        "feedback": s.feedback,
        "student": {
            "id": s.student.id,
            "user": {
                "id": s.student.user.id,
                "name": s.student.user.name,
            } if s.student and s.student.user else None,
        } if s.student else None,
    }


@router.post("/")
async def create_assignment(
    moduleId: str = Form(...),
    batchId: str = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    dueDate: str = Form(None),
    file: UploadFile = File(None),
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    trainer = db.query(Trainer).filter(Trainer.userId == current_user["userId"]).first()
    if not trainer:
        return error_response("Trainer profile not found", 404)

    file_path = None
    if file:
        try:
            file_path = await save_upload_file(file)
        except ValueError as e:
            return error_response(str(e), 400)

    assignment = Assignment(
        moduleId=moduleId,
        batchId=batchId,
        trainerId=trainer.id,
        title=title,
        description=description,
        dueDate=datetime.fromisoformat(dueDate) if dueDate else None,
        filePath=file_path,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return success_response(data=serialize_assignment(assignment), message="Assignment created successfully", status_code=201)


@router.get("/batch/{batch_id}")
async def get_batch_assignments(
    batch_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "STUDENT"])),
    db: Session = Depends(get_db),
):
    assignments = db.query(Assignment).filter(Assignment.batchId == batch_id).all()
    data = [serialize_assignment(a) for a in assignments]
    return success_response(data=data)


@router.post("/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    file: UploadFile = File(None),
    current_user: dict = Depends(role_guard(["STUDENT"])),
    db: Session = Depends(get_db),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        return error_response("Assignment not found", 404)

    student = db.query(Student).filter(Student.userId == current_user["userId"]).first()
    if not student:
        return error_response("Student profile not found", 404)

    # Check if already submitted
    existing = db.query(Submission).filter(
        Submission.assignmentId == assignment_id,
        Submission.studentId == student.id,
    ).first()
    if existing:
        return error_response("Assignment already submitted", 400)

    file_path = None
    if file:
        try:
            file_path = await save_upload_file(file)
        except ValueError as e:
            return error_response(str(e), 400)

    submission = Submission(
        assignmentId=assignment_id,
        studentId=student.id,
        filePath=file_path,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return success_response(data=serialize_submission(submission), message="Assignment submitted successfully", status_code=201)


@router.get("/{assignment_id}/submissions")
async def get_submissions(
    assignment_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "STUDENT"])),
    db: Session = Depends(get_db),
):
    submissions = db.query(Submission).filter(Submission.assignmentId == assignment_id).all()
    data = [serialize_submission(s) for s in submissions]
    return success_response(data=data)


@router.put("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    request: Request,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        return error_response("Submission not found", 404)

    if "grade" in body:
        submission.grade = body["grade"]
    if "feedback" in body:
        submission.feedback = body["feedback"]

    db.commit()
    db.refresh(submission)

    return success_response(data=serialize_submission(submission), message="Submission graded successfully")
