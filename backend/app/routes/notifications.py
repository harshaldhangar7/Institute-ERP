from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate
from app.models.announcement import Announcement
from app.models.notification import Notification
from app.models.student import Student
from app.models.user import User
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"],
    dependencies=[Depends(authenticate)],
)


@router.get("/")
async def get_notifications(
    current_user: dict = Depends(authenticate),
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


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(authenticate),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.userId == current_user["userId"],
    ).first()
    if not notification:
        return error_response("Notification not found", 404)

    notification.isRead = True
    db.commit()

    return success_response(message="Notification marked as read")


@router.post("/announce")
async def create_announcement(
    request: Request,
    current_user: dict = Depends(authenticate),
    db: Session = Depends(get_db),
):
    # Only ADMIN and TRAINER can announce
    if current_user["role"] not in ["ADMIN", "TRAINER"]:
        return error_response("Access denied. Insufficient permissions.", 403)

    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    title = body.get("title")
    message = body.get("message")
    target_role = body.get("targetRole")
    batch_id = body.get("batchId")

    if not title or not message:
        return error_response("Title and message are required", 400)

    # Create announcement
    announcement = Announcement(
        createdById=current_user["userId"],
        title=title,
        message=message,
        targetRole=target_role,
        batchId=batch_id,
    )
    db.add(announcement)

    # Determine target users
    query = db.query(User).filter(User.isActive == True)

    if target_role:
        query = query.filter(User.role == target_role)

    if batch_id:
        # Get students in this batch
        students = db.query(Student).filter(Student.batchId == batch_id).all()
        student_user_ids = [s.userId for s in students]
        if student_user_ids:
            query = query.filter(User.id.in_(student_user_ids))
        else:
            # No students in batch, still create announcement but no notifications
            db.commit()
            return success_response(message="Announcement created successfully", status_code=201)

    target_users = query.all()

    # Create notifications for targeted users
    for user in target_users:
        if user.id != current_user["userId"]:
            notification = Notification(
                userId=user.id,
                title=title,
                message=message,
                type="ANNOUNCEMENT",
            )
            db.add(notification)

    db.commit()

    return success_response(message="Announcement created successfully", status_code=201)
