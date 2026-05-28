from app.models.user import User
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.counsellor import Counsellor
from app.models.batch import Batch
from app.models.module import Module
from app.models.batch_module import BatchModule
from app.models.trainer_batch import TrainerBatch
from app.models.counsellor_student import CounsellorStudent
from app.models.lecture import Lecture
from app.models.attendance import Attendance
from app.models.marks import Marks
from app.models.mock_interview import MockInterview
from app.models.assignment import Assignment, Submission
from app.models.resource import Resource
from app.models.fee import Fee, FeePayment
from app.models.notification import Notification
from app.models.announcement import Announcement

__all__ = [
    "User",
    "Student",
    "Trainer",
    "Counsellor",
    "Batch",
    "Module",
    "BatchModule",
    "TrainerBatch",
    "CounsellorStudent",
    "Lecture",
    "Attendance",
    "Marks",
    "MockInterview",
    "Assignment",
    "Submission",
    "Resource",
    "Fee",
    "FeePayment",
    "Notification",
    "Announcement",
]
