from fastapi import APIRouter, Depends, Form, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.batch_module import BatchModule
from app.models.resource import Resource
from app.models.trainer import Trainer
from app.utils.response import error_response, success_response
from app.utils.upload import save_upload_file

router = APIRouter(
    prefix="/api/resources",
    tags=["resources"],
    dependencies=[Depends(authenticate), Depends(role_guard(["TRAINER", "STUDENT"]))],
)


def serialize_resource(r: Resource) -> dict:
    return {
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
        "trainer": {
            "id": r.trainer.id,
            "user": {
                "name": r.trainer.user.name,
            } if r.trainer.user else None,
        } if r.trainer else None,
    }


@router.post("/")
async def create_resource(
    moduleId: str = Form(...),
    title: str = Form(...),
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

    resource = Resource(
        moduleId=moduleId,
        trainerId=trainer.id,
        title=title,
        filePath=file_path,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    return success_response(data=serialize_resource(resource), message="Resource created successfully", status_code=201)


@router.get("/module/{module_id}")
async def get_module_resources(
    module_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "STUDENT"])),
    db: Session = Depends(get_db),
):
    resources = db.query(Resource).filter(Resource.moduleId == module_id).all()
    data = [serialize_resource(r) for r in resources]
    return success_response(data=data)


@router.get("/batch/{batch_id}")
async def get_batch_resources(
    batch_id: str,
    current_user: dict = Depends(role_guard(["TRAINER", "STUDENT"])),
    db: Session = Depends(get_db),
):
    batch_modules = db.query(BatchModule).filter(BatchModule.batchId == batch_id).all()
    module_ids = [bm.moduleId for bm in batch_modules]

    resources = db.query(Resource).filter(Resource.moduleId.in_(module_ids)).all() if module_ids else []
    data = [serialize_resource(r) for r in resources]
    return success_response(data=data)


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_user: dict = Depends(role_guard(["TRAINER"])),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        return error_response("Resource not found", 404)

    db.delete(resource)
    db.commit()

    return success_response(message="Resource deleted successfully")
