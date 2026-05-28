from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.assignment import Assignment, Submission
from app.models.attendance import Attendance
from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.counsellor import Counsellor
from app.models.counsellor_student import CounsellorStudent
from app.models.fee import Fee
from app.models.marks import Marks
from app.models.mock_interview import MockInterview
from app.models.module import Module
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.models.user import User
from app.utils.auth import hash_password
from app.utils.response import error_response, paginated_response, success_response

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(authenticate), Depends(role_guard(["ADMIN"]))],
)


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


def serialize_student(student: Student) -> dict:
    result = {
        "id": student.id,
        "userId": student.userId,
        "batchId": student.batchId,
        "counsellorId": student.counsellorId,
        "enrollmentDate": student.enrollmentDate.isoformat() if student.enrollmentDate else None,
        "mode": student.mode,
    }
    if student.user:
        result["user"] = serialize_user(student.user)
    if student.batch:
        result["batch"] = {
            "id": student.batch.id,
            "name": student.batch.name,
            "startDate": student.batch.startDate.isoformat() if student.batch.startDate else None,
            "endDate": student.batch.endDate.isoformat() if student.batch.endDate else None,
            "isActive": student.batch.isActive,
        }
    return result


def serialize_trainer(trainer: Trainer) -> dict:
    result = {
        "id": trainer.id,
        "userId": trainer.userId,
        "specialization": trainer.specialization,
    }
    if trainer.user:
        result["user"] = serialize_user(trainer.user)
    return result


def serialize_counsellor(counsellor: Counsellor) -> dict:
    result = {
        "id": counsellor.id,
        "userId": counsellor.userId,
    }
    if counsellor.user:
        result["user"] = serialize_user(counsellor.user)
    return result


def serialize_batch(batch: Batch) -> dict:
    # Get trainer from trainerBatches relationship
    trainer_data = None
    if batch.trainerBatches:
        tb = next((t for t in batch.trainerBatches if t.trainer and t.trainer.user), None)
        if tb:
            trainer_data = {"id": tb.trainer.id, "user": {"name": tb.trainer.user.name}}

    return {
        "id": batch.id,
        "name": batch.name,
        "startDate": batch.startDate.isoformat() if batch.startDate else None,
        "endDate": batch.endDate.isoformat() if batch.endDate else None,
        "isActive": batch.isActive,
        "status": "ACTIVE" if batch.isActive else "COMPLETED",
        "studentCount": len(batch.students) if batch.students else 0,
        "modules": [
            {
                "id": bm.module.id,
                "name": bm.module.name,
                "status": bm.status,
                "completionPercent": bm.completionPercent,
            }
            for bm in (batch.batchModules or [])
            if bm.module
        ],
        "trainer": trainer_data,
    }


def serialize_module(module: Module) -> dict:
    result = {
        "id": module.id,
        "name": module.name,
        "description": module.description,
        "duration": module.duration,
    }
    if hasattr(module, 'batchModules') and module.batchModules:
        result["batches"] = [{"id": bm.batch.id, "name": bm.batch.name} for bm in module.batchModules if bm.batch]
    else:
        result["batches"] = []
    return result


# Dashboard
@router.get("/dashboard")
async def dashboard(db: Session = Depends(get_db)):
    total_students = db.query(Student).count()
    active_batches = db.query(Batch).filter(Batch.isActive == True).count()
    total_trainers = db.query(Trainer).count()
    total_counsellors = db.query(Counsellor).count()

    present = db.query(Attendance).filter(Attendance.status == "PRESENT").count()
    absent = db.query(Attendance).filter(Attendance.status == "ABSENT").count()
    late = db.query(Attendance).filter(Attendance.status == "LATE").count()

    total_fee_amount = db.query(func.coalesce(func.sum(Fee.totalAmount), 0)).scalar()
    paid_amount = db.query(func.coalesce(func.sum(Fee.paidAmount), 0)).scalar()
    pending_amount = db.query(func.coalesce(func.sum(Fee.pendingAmount), 0)).scalar()

    return success_response(data={
        "totalStudents": total_students,
        "activeBatches": active_batches,
        "totalTrainers": total_trainers,
        "totalCounsellors": total_counsellors,
        "attendanceOverview": {
            "present": present,
            "absent": absent,
            "late": late,
        },
        "feeCollectionStatus": {
            "totalAmount": total_fee_amount,
            "paidAmount": paid_amount,
            "pendingAmount": pending_amount,
        },
    })


# Students CRUD
@router.get("/students")
async def get_students(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(Student).count()
    students = db.query(Student).offset(offset).limit(limit).all()
    data = [serialize_student(s) for s in students]
    return paginated_response(data, total, page, limit)


@router.post("/students")
async def create_student(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    phone = body.get("phone")
    batch_id = body.get("batchId")
    mode = body.get("mode", "OFFLINE")

    if not email or not password or not name:
        return error_response("Email, password, and name are required", 400)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return error_response("Email already exists", 400)

    hashed_password = hash_password(password)
    user = User(email=email, password=hashed_password, name=name, role="STUDENT", phone=phone)
    db.add(user)
    db.flush()

    student = Student(userId=user.id, batchId=batch_id, mode=mode)
    db.add(student)
    db.commit()
    db.refresh(student)

    return success_response(data=serialize_student(student), message="Student created successfully", status_code=201)


@router.put("/students/{student_id}")
async def update_student(student_id: str, request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)

    user = student.user

    if "name" in body:
        user.name = body["name"]
    if "email" in body:
        user.email = body["email"]
    if "phone" in body:
        user.phone = body["phone"]
    if "isActive" in body:
        user.isActive = body["isActive"]
    if "batchId" in body:
        student.batchId = body["batchId"]
    if "mode" in body:
        student.mode = body["mode"]
    if "counsellorId" in body:
        student.counsellorId = body["counsellorId"]

    user.updatedAt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)

    return success_response(data=serialize_student(student), message="Student updated successfully")


@router.delete("/students/{student_id}")
async def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)

    user_id = student.userId

    # NOTE: Manual cascade deletion - if new FK relationships are added to Student,
    # they must be deleted here too or a foreign key constraint error will occur.
    # Consider adding ON DELETE CASCADE to model definitions in the future.
    db.query(Attendance).filter(Attendance.studentId == student_id).delete()
    db.query(Marks).filter(Marks.studentId == student_id).delete()
    db.query(MockInterview).filter(MockInterview.studentId == student_id).delete()
    db.query(Submission).filter(Submission.studentId == student_id).delete()
    db.query(Fee).filter(Fee.studentId == student_id).delete()
    db.query(CounsellorStudent).filter(CounsellorStudent.studentId == student_id).delete()
    db.query(Student).filter(Student.id == student_id).delete()
    db.query(User).filter(User.id == user_id).delete()

    db.commit()

    return success_response(message="Student deleted successfully")


# Trainers CRUD
@router.get("/trainers")
async def get_trainers(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(Trainer).count()
    trainers = db.query(Trainer).offset(offset).limit(limit).all()
    data = [serialize_trainer(t) for t in trainers]
    return paginated_response(data, total, page, limit)


@router.post("/trainers")
async def create_trainer(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    phone = body.get("phone")
    specialization = body.get("specialization")

    if not email or not password or not name:
        return error_response("Email, password, and name are required", 400)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return error_response("Email already exists", 400)

    hashed_password = hash_password(password)
    user = User(email=email, password=hashed_password, name=name, role="TRAINER", phone=phone)
    db.add(user)
    db.flush()

    trainer = Trainer(userId=user.id, specialization=specialization)
    db.add(trainer)
    db.commit()
    db.refresh(trainer)

    return success_response(data=serialize_trainer(trainer), message="Trainer created successfully", status_code=201)


@router.put("/trainers/{trainer_id}")
async def update_trainer(trainer_id: str, request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        return error_response("Trainer not found", 404)

    user = trainer.user

    if "name" in body:
        user.name = body["name"]
    if "email" in body:
        user.email = body["email"]
    if "phone" in body:
        user.phone = body["phone"]
    if "isActive" in body:
        user.isActive = body["isActive"]
    if "specialization" in body:
        trainer.specialization = body["specialization"]

    user.updatedAt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trainer)

    return success_response(data=serialize_trainer(trainer), message="Trainer updated successfully")


@router.delete("/trainers/{trainer_id}")
async def delete_trainer(trainer_id: str, db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        return error_response("Trainer not found", 404)

    user_id = trainer.userId
    # NOTE: Manual cascade deletion - if new FK relationships are added to Trainer,
    # they must be deleted here too or a foreign key constraint error will occur.
    db.query(TrainerBatch).filter(TrainerBatch.trainerId == trainer_id).delete()
    db.query(Trainer).filter(Trainer.id == trainer_id).delete()
    db.query(User).filter(User.id == user_id).delete()
    db.commit()

    return success_response(message="Trainer deleted successfully")


# Counsellors CRUD
@router.get("/counsellors")
async def get_counsellors(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(Counsellor).count()
    counsellors = db.query(Counsellor).offset(offset).limit(limit).all()
    data = [serialize_counsellor(c) for c in counsellors]
    return paginated_response(data, total, page, limit)


@router.post("/counsellors")
async def create_counsellor(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    phone = body.get("phone")

    if not email or not password or not name:
        return error_response("Email, password, and name are required", 400)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return error_response("Email already exists", 400)

    hashed_password = hash_password(password)
    user = User(email=email, password=hashed_password, name=name, role="COUNSELLOR", phone=phone)
    db.add(user)
    db.flush()

    counsellor = Counsellor(userId=user.id)
    db.add(counsellor)
    db.commit()
    db.refresh(counsellor)

    return success_response(data=serialize_counsellor(counsellor), message="Counsellor created successfully", status_code=201)


@router.put("/counsellors/{counsellor_id}")
async def update_counsellor(counsellor_id: str, request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    counsellor = db.query(Counsellor).filter(Counsellor.id == counsellor_id).first()
    if not counsellor:
        return error_response("Counsellor not found", 404)

    user = counsellor.user

    if "name" in body:
        user.name = body["name"]
    if "email" in body:
        user.email = body["email"]
    if "phone" in body:
        user.phone = body["phone"]
    if "isActive" in body:
        user.isActive = body["isActive"]

    user.updatedAt = datetime.now(timezone.utc)
    db.commit()
    db.refresh(counsellor)

    return success_response(data=serialize_counsellor(counsellor), message="Counsellor updated successfully")


@router.delete("/counsellors/{counsellor_id}")
async def delete_counsellor(counsellor_id: str, db: Session = Depends(get_db)):
    counsellor = db.query(Counsellor).filter(Counsellor.id == counsellor_id).first()
    if not counsellor:
        return error_response("Counsellor not found", 404)

    user_id = counsellor.userId
    # NOTE: Manual cascade deletion - if new FK relationships are added to Counsellor,
    # they must be deleted here too or a foreign key constraint error will occur.
    db.query(CounsellorStudent).filter(CounsellorStudent.counsellorId == counsellor_id).delete()
    db.query(Counsellor).filter(Counsellor.id == counsellor_id).delete()
    db.query(User).filter(User.id == user_id).delete()
    db.commit()

    return success_response(message="Counsellor deleted successfully")


# Batches CRUD
@router.get("/batches")
async def get_batches(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(Batch).count()
    batches = db.query(Batch).options(
        selectinload(Batch.batchModules).joinedload(BatchModule.module),
        selectinload(Batch.trainerBatches).joinedload(TrainerBatch.trainer).joinedload(Trainer.user),
        selectinload(Batch.students),
    ).offset(offset).limit(limit).all()
    data = [serialize_batch(b) for b in batches]
    return paginated_response(data, total, page, limit)


@router.post("/batches")
async def create_batch(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    name = body.get("name")
    start_date = body.get("startDate")

    if not name or not start_date:
        return error_response("Name and start date are required", 400)

    batch = Batch(
        name=name,
        startDate=datetime.fromisoformat(start_date) if isinstance(start_date, str) else start_date,
        endDate=datetime.fromisoformat(body["endDate"]) if body.get("endDate") else None,
        isActive=body.get("isActive", True),
    )
    db.add(batch)
    db.flush()

    # Assign modules if provided
    module_ids = body.get("moduleIds", [])
    for module_id in module_ids:
        module = db.query(Module).filter(Module.id == module_id).first()
        if module:
            bm = BatchModule(batchId=batch.id, moduleId=module_id)
            db.add(bm)

    # Assign trainer if provided
    trainer_id = body.get("trainerId")
    if trainer_id:
        trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
        if trainer:
            tb = TrainerBatch(trainerId=trainer_id, batchId=batch.id)
            db.add(tb)

    db.commit()
    db.refresh(batch)

    # Re-query with eager loading for proper serialization
    batch = db.query(Batch).options(
        selectinload(Batch.batchModules).joinedload(BatchModule.module),
        selectinload(Batch.trainerBatches).joinedload(TrainerBatch.trainer).joinedload(Trainer.user),
        selectinload(Batch.students),
    ).filter(Batch.id == batch.id).first()

    return success_response(data=serialize_batch(batch), message="Batch created successfully", status_code=201)


@router.put("/batches/{batch_id}")
async def update_batch(batch_id: str, request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return error_response("Batch not found", 404)

    if "name" in body:
        batch.name = body["name"]
    if "startDate" in body:
        batch.startDate = datetime.fromisoformat(body["startDate"]) if isinstance(body["startDate"], str) else body["startDate"]
    if "endDate" in body:
        batch.endDate = datetime.fromisoformat(body["endDate"]) if isinstance(body["endDate"], str) and body["endDate"] else None
    if "isActive" in body:
        batch.isActive = body["isActive"]

    # Update modules if provided — replace existing assignments
    if "moduleIds" in body:
        db.query(BatchModule).filter(BatchModule.batchId == batch_id).delete()
        for module_id in body["moduleIds"]:
            module = db.query(Module).filter(Module.id == module_id).first()
            if module:
                bm = BatchModule(batchId=batch_id, moduleId=module_id)
                db.add(bm)

    # Update trainer if provided — replace existing assignment
    if "trainerId" in body:
        db.query(TrainerBatch).filter(TrainerBatch.batchId == batch_id).delete()
        if body["trainerId"]:
            trainer = db.query(Trainer).filter(Trainer.id == body["trainerId"]).first()
            if trainer:
                tb = TrainerBatch(trainerId=body["trainerId"], batchId=batch_id)
                db.add(tb)

    db.commit()

    # Re-query with eager loading for proper serialization
    batch = db.query(Batch).options(
        selectinload(Batch.batchModules).joinedload(BatchModule.module),
        selectinload(Batch.trainerBatches).joinedload(TrainerBatch.trainer).joinedload(Trainer.user),
        selectinload(Batch.students),
    ).filter(Batch.id == batch_id).first()

    return success_response(data=serialize_batch(batch), message="Batch updated successfully")


@router.delete("/batches/{batch_id}")
async def delete_batch(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return error_response("Batch not found", 404)

    # NOTE: Manual cascade deletion - if new FK relationships are added to Batch,
    # they must be deleted here too or a foreign key constraint error will occur.
    db.query(BatchModule).filter(BatchModule.batchId == batch_id).delete()
    db.query(TrainerBatch).filter(TrainerBatch.batchId == batch_id).delete()
    db.query(Batch).filter(Batch.id == batch_id).delete()
    db.commit()

    return success_response(message="Batch deleted successfully")


# Modules CRUD
@router.get("/modules")
async def get_modules(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(Module).count()
    modules = db.query(Module).options(
        selectinload(Module.batchModules).joinedload(BatchModule.batch),
    ).offset(offset).limit(limit).all()
    data = [serialize_module(m) for m in modules]
    return paginated_response(data, total, page, limit)


@router.post("/modules")
async def create_module(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    name = body.get("name")
    if not name:
        return error_response("Module name is required", 400)

    module = Module(
        name=name,
        description=body.get("description"),
        duration=body.get("duration"),
    )
    db.add(module)
    db.commit()
    db.refresh(module)

    return success_response(data=serialize_module(module), message="Module created successfully", status_code=201)


@router.put("/modules/{module_id}")
async def update_module(module_id: str, request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return error_response("Module not found", 404)

    if "name" in body:
        module.name = body["name"]
    if "description" in body:
        module.description = body["description"]
    if "duration" in body:
        module.duration = body["duration"]

    db.commit()
    db.refresh(module)

    return success_response(data=serialize_module(module), message="Module updated successfully")


@router.delete("/modules/{module_id}")
async def delete_module(module_id: str, db: Session = Depends(get_db)):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return error_response("Module not found", 404)

    # NOTE: Manual cascade deletion - if new FK relationships are added to Module,
    # they must be deleted here too or a foreign key constraint error will occur.
    db.query(BatchModule).filter(BatchModule.moduleId == module_id).delete()
    db.query(Module).filter(Module.id == module_id).delete()
    db.commit()

    return success_response(message="Module deleted successfully")


# Assignment endpoints
@router.post("/assign-trainer-batch")
async def assign_trainer_batch(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    trainer_id = body.get("trainerId")
    batch_id = body.get("batchId")

    if not trainer_id or not batch_id:
        return error_response("Trainer ID and Batch ID are required", 400)

    existing = db.query(TrainerBatch).filter(
        TrainerBatch.trainerId == trainer_id,
        TrainerBatch.batchId == batch_id,
    ).first()
    if existing:
        return error_response("Trainer is already assigned to this batch", 400)

    assignment = TrainerBatch(trainerId=trainer_id, batchId=batch_id)
    db.add(assignment)
    db.commit()

    return success_response(message="Trainer assigned to batch successfully", status_code=201)


@router.post("/assign-counsellor-student")
async def assign_counsellor_student(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    counsellor_id = body.get("counsellorId")
    student_id = body.get("studentId")

    if not counsellor_id or not student_id:
        return error_response("Counsellor ID and Student ID are required", 400)

    existing = db.query(CounsellorStudent).filter(
        CounsellorStudent.counsellorId == counsellor_id,
        CounsellorStudent.studentId == student_id,
    ).first()
    if existing:
        return error_response("Counsellor is already assigned to this student", 400)

    cs = CounsellorStudent(counsellorId=counsellor_id, studentId=student_id)
    db.add(cs)

    # Also update student's counsellorId
    student = db.query(Student).filter(Student.id == student_id).first()
    if student:
        student.counsellorId = counsellor_id

    db.commit()

    return success_response(message="Counsellor assigned to student successfully", status_code=201)


@router.post("/assign-module-batch")
async def assign_module_batch(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    module_id = body.get("moduleId")
    batch_id = body.get("batchId")

    if not module_id or not batch_id:
        return error_response("Module ID and Batch ID are required", 400)

    existing = db.query(BatchModule).filter(
        BatchModule.batchId == batch_id,
        BatchModule.moduleId == module_id,
    ).first()
    if existing:
        return error_response("Module is already assigned to this batch", 400)

    bm = BatchModule(batchId=batch_id, moduleId=module_id)
    db.add(bm)
    db.commit()

    return success_response(message="Module assigned to batch successfully", status_code=201)
