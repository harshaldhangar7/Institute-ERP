from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import authenticate, role_guard
from app.models.attendance import Attendance
from app.models.counsellor import Counsellor
from app.models.counsellor_student import CounsellorStudent
from app.models.fee import Fee, FeePayment
from app.models.lecture import Lecture
from app.models.marks import Marks
from app.models.notification import Notification
from app.models.student import Student
from app.utils.response import error_response, success_response

router = APIRouter(
    prefix="/api/counsellor",
    tags=["counsellor"],
    dependencies=[Depends(authenticate), Depends(role_guard(["COUNSELLOR"]))],
)


@router.get("/students")
async def get_students(
    current_user: dict = Depends(role_guard(["COUNSELLOR"])),
    db: Session = Depends(get_db),
):
    counsellor = db.query(Counsellor).filter(Counsellor.userId == current_user["userId"]).first()
    if not counsellor:
        return error_response("Counsellor profile not found", 404)

    cs_records = db.query(CounsellorStudent).filter(CounsellorStudent.counsellorId == counsellor.id).all()
    student_ids = [cs.studentId for cs in cs_records]
    students = db.query(Student).filter(Student.id.in_(student_ids)).all()

    data = []
    for student in students:
        # Attendance percentage
        total_lectures = 0
        if student.batchId:
            total_lectures = db.query(Lecture).filter(Lecture.batchId == student.batchId).count()
        present_count = db.query(Attendance).filter(
            Attendance.studentId == student.id,
            Attendance.status == "PRESENT",
        ).count()
        attendance_pct = (present_count / total_lectures * 100) if total_lectures > 0 else 0

        # Average marks
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
            "batch": {
                "id": student.batch.id,
                "name": student.batch.name,
            } if student.batch else None,
            "attendancePercentage": round(attendance_pct, 2),
            "avgMarks": round(float(avg_marks), 2),
        })

    return success_response(data=data)


@router.get("/students/{student_id}/fees")
async def get_student_fees(
    student_id: str,
    current_user: dict = Depends(role_guard(["COUNSELLOR"])),
    db: Session = Depends(get_db),
):
    fees = db.query(Fee).filter(Fee.studentId == student_id).all()
    data = []
    for fee in fees:
        payments = [{
            "id": p.id,
            "feeId": p.feeId,
            "amount": p.amount,
            "paidAt": p.paidAt.isoformat() if p.paidAt else None,
            "method": p.method,
        } for p in fee.payments]

        data.append({
            "id": fee.id,
            "studentId": fee.studentId,
            "totalAmount": fee.totalAmount,
            "paidAmount": fee.paidAmount,
            "pendingAmount": fee.pendingAmount,
            "dueDate": fee.dueDate.isoformat() if fee.dueDate else None,
            "status": fee.status,
            "payments": payments,
        })

    return success_response(data=data)


@router.post("/fees/payment")
async def record_payment(
    request: Request,
    current_user: dict = Depends(role_guard(["COUNSELLOR"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    fee_id = body.get("feeId")
    amount = body.get("amount")
    method = body.get("method", "CASH")

    if not fee_id or not amount:
        return error_response("Fee ID and amount are required", 400)

    fee = db.query(Fee).filter(Fee.id == fee_id).first()
    if not fee:
        return error_response("Fee record not found", 404)

    # Verify fee belongs to counsellor's student
    counsellor = db.query(Counsellor).filter(Counsellor.userId == current_user["userId"]).first()
    if not counsellor:
        return error_response("Counsellor profile not found", 404)

    cs = db.query(CounsellorStudent).filter(
        CounsellorStudent.counsellorId == counsellor.id,
        CounsellorStudent.studentId == fee.studentId,
    ).first()
    if not cs:
        return error_response("Access denied. Student not assigned to you.", 403)

    payment = FeePayment(feeId=fee_id, amount=amount, method=method)
    db.add(payment)

    # Update fee totals
    fee.paidAmount = fee.paidAmount + amount
    fee.pendingAmount = fee.totalAmount - fee.paidAmount
    if fee.pendingAmount <= 0:
        fee.pendingAmount = 0
        fee.status = "PAID"
    else:
        fee.status = "PARTIAL"

    db.commit()

    return success_response(message="Payment recorded successfully", status_code=201)


@router.get("/alerts")
async def get_alerts(
    current_user: dict = Depends(role_guard(["COUNSELLOR"])),
    db: Session = Depends(get_db),
):
    counsellor = db.query(Counsellor).filter(Counsellor.userId == current_user["userId"]).first()
    if not counsellor:
        return error_response("Counsellor profile not found", 404)

    cs_records = db.query(CounsellorStudent).filter(CounsellorStudent.counsellorId == counsellor.id).all()
    student_ids = [cs.studentId for cs in cs_records]
    students = db.query(Student).filter(Student.id.in_(student_ids)).all()

    alerts = []
    for student in students:
        total_lectures = 0
        if student.batchId:
            total_lectures = db.query(Lecture).filter(Lecture.batchId == student.batchId).count()
        present_count = db.query(Attendance).filter(
            Attendance.studentId == student.id,
            Attendance.status == "PRESENT",
        ).count()
        attendance_pct = (present_count / total_lectures * 100) if total_lectures > 0 else 0

        avg_marks = db.query(func.avg(Marks.score)).filter(
            Marks.studentId == student.id
        ).scalar() or 0

        alert_reasons = []
        if attendance_pct < 75 and total_lectures > 0:
            alert_reasons.append("Low attendance")
        if float(avg_marks) < 40 and float(avg_marks) > 0:
            alert_reasons.append("Poor performance")

        if alert_reasons:
            alerts.append({
                "student": {
                    "id": student.id,
                    "user": {
                        "id": student.user.id,
                        "name": student.user.name,
                        "email": student.user.email,
                    } if student.user else None,
                    "batch": {
                        "id": student.batch.id,
                        "name": student.batch.name,
                    } if student.batch else None,
                },
                "attendancePercentage": round(attendance_pct, 2),
                "avgMarks": round(float(avg_marks), 2),
                "reasons": alert_reasons,
            })

    return success_response(data=alerts)


@router.post("/follow-ups")
async def create_follow_up(
    request: Request,
    current_user: dict = Depends(role_guard(["COUNSELLOR"])),
    db: Session = Depends(get_db),
):
    try:
        body = await request.json()
    except Exception:
        return error_response("Invalid request body", 400)

    student_id = body.get("studentId")
    note = body.get("note")

    if not student_id or not note:
        return error_response("Student ID and note are required", 400)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)

    notification = Notification(
        userId=student.userId,
        title="Follow-up from Counsellor",
        message=note,
        type="FOLLOW_UP",
    )
    db.add(notification)
    db.commit()

    return success_response(message="Follow-up created successfully", status_code=201)


@router.get("/dashboard")
async def dashboard(
    current_user: dict = Depends(role_guard(["COUNSELLOR"])),
    db: Session = Depends(get_db),
):
    counsellor = db.query(Counsellor).filter(Counsellor.userId == current_user["userId"]).first()
    if not counsellor:
        return error_response("Counsellor profile not found", 404)

    cs_records = db.query(CounsellorStudent).filter(CounsellorStudent.counsellorId == counsellor.id).all()
    student_ids = [cs.studentId for cs in cs_records]

    total_students = len(student_ids)
    active_students = db.query(Student).join(Student.user).filter(
        Student.id.in_(student_ids),
        Student.user.has(isActive=True),
    ).count() if student_ids else 0

    total_fees = db.query(func.coalesce(func.sum(Fee.totalAmount), 0)).filter(
        Fee.studentId.in_(student_ids)
    ).scalar() if student_ids else 0

    collected_fees = db.query(func.coalesce(func.sum(Fee.paidAmount), 0)).filter(
        Fee.studentId.in_(student_ids)
    ).scalar() if student_ids else 0

    pending_fees = db.query(func.coalesce(func.sum(Fee.pendingAmount), 0)).filter(
        Fee.studentId.in_(student_ids)
    ).scalar() if student_ids else 0

    # Count at-risk students
    at_risk = 0
    recent_alerts = []
    students = db.query(Student).filter(Student.id.in_(student_ids)).all() if student_ids else []
    for student in students:
        total_lectures = 0
        if student.batchId:
            total_lectures = db.query(Lecture).filter(Lecture.batchId == student.batchId).count()
        present_count = db.query(Attendance).filter(
            Attendance.studentId == student.id,
            Attendance.status == "PRESENT",
        ).count()
        attendance_pct = (present_count / total_lectures * 100) if total_lectures > 0 else 0
        avg_marks = db.query(func.avg(Marks.score)).filter(
            Marks.studentId == student.id
        ).scalar() or 0

        alert_reasons = []
        if attendance_pct < 75 and total_lectures > 0:
            alert_reasons.append("Low attendance")
        if float(avg_marks) < 40 and float(avg_marks) > 0:
            alert_reasons.append("Poor performance")

        if alert_reasons:
            at_risk += 1
            recent_alerts.append({
                "message": f"Student has {', '.join(alert_reasons).lower()}",
                "studentName": student.user.name if student.user else "Unknown",
                "type": alert_reasons[0],
            })

    return success_response(data={
        "activeStudents": active_students,
        "totalStudents": total_students,
        "totalFees": total_fees,
        "collectedFees": collected_fees,
        "pendingFees": pending_fees,
        "atRiskStudents": at_risk,
        "recentAlerts": recent_alerts[:10],
    })
