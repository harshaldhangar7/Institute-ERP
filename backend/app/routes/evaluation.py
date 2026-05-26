from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.marks import Marks
from app.models.student import Student
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/evaluation",
    tags=["evaluation"],
    dependencies=[Depends(authenticate), Depends(role_guard(["TRAINER", "ADMIN"]))],
)


def serialize_marks(m: Marks) -> dict:
    return {
        "id": m.id,
        "studentId": m.studentId,
        "moduleId": m.moduleId,
        "type": m.type,
        "score": m.score,
        "maxScore": m.maxScore,
        "remarks": m.remarks,
        "module": {
            "id": m.module.id,
            "name": m.module.name,
        } if m.module else None,
        "student": {
            "id": m.student.id,
            "user": {
                "id": m.student.user.id,
                "name": m.student.user.name,
            } if m.student.user else None,
        } if m.student else None,
    }


@router.post("/marks")
async def create_marks(
    request: Request,
    current_user: dict = Depends(role_guard(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    student_id = body.get("studentId")
    module_id = body.get("moduleId")
    mark_type = body.get("type")
    score = body.get("score")
    max_score = body.get("maxScore")
    remarks = body.get("remarks")

    if not student_id or not module_id or not mark_type or score is None or max_score is None:
        return error_response("studentId, moduleId, type, score, and maxScore are required", 400)

    marks = Marks(
        studentId=student_id,
        moduleId=module_id,
        type=mark_type,
        score=score,
        maxScore=max_score,
        remarks=remarks,
    )
    db.add(marks)
    db.commit()
    db.refresh(marks)

    return success_response(data=serialize_marks(marks), message="Marks recorded successfully", status_code=201)


@router.get("/marks/{student_id}")
async def get_student_marks(
    student_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db),
):
    marks = db.query(Marks).filter(Marks.studentId == student_id).all()
    data = [serialize_marks(m) for m in marks]
    return success_response(data=data)


@router.get("/marks/batch/{batch_id}")
async def get_batch_marks(
    batch_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db),
):
    students = db.query(Student).filter(Student.batchId == batch_id).all()
    student_ids = [s.id for s in students]

    marks = db.query(Marks).filter(Marks.studentId.in_(student_ids)).all() if student_ids else []
    data = [serialize_marks(m) for m in marks]
    return success_response(data=data)


@router.put("/marks/{marks_id}")
async def update_marks(
    marks_id: str,
    request: Request,
    current_user: dict = Depends(role_guard(["TRAINER", "ADMIN"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    marks = db.query(Marks).filter(Marks.id == marks_id).first()
    if not marks:
        return error_response("Marks record not found", 404)

    if "score" in body:
        marks.score = body["score"]
    if "maxScore" in body:
        marks.maxScore = body["maxScore"]
    if "type" in body:
        marks.type = body["type"]
    if "remarks" in body:
        marks.remarks = body["remarks"]

    db.commit()
    db.refresh(marks)

    return success_response(data=serialize_marks(marks), message="Marks updated successfully")
