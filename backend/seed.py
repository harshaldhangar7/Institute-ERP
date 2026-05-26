"""
Database seed script for Institute ERP.
Creates demo data matching the original Node.js seed (prisma/seed.ts).
"""
import uuid
from datetime import datetime, timedelta

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.announcement import Announcement
from app.models.attendance import Attendance
from app.models.batch import Batch
from app.models.batch_module import BatchModule
from app.models.counsellor import Counsellor
from app.models.counsellor_student import CounsellorStudent
from app.models.fee import Fee, FeePayment
from app.models.lecture import Lecture
from app.models.marks import Marks
from app.models.module import Module
from app.models.notification import Notification
from app.models.student import Student
from app.models.trainer import Trainer
from app.models.trainer_batch import TrainerBatch
from app.models.user import User

DATABASE_URL = "sqlite:///./dev.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

STUDENT_NAMES = [
    "Aarav Sharma", "Vivaan Gupta", "Aditya Singh", "Vihaan Patel",
    "Arjun Reddy", "Sai Kumar", "Reyansh Joshi", "Ayaan Khan",
    "Krishna Iyer", "Ishaan Nair", "Ananya Mishra", "Diya Chopra",
    "Myra Banerjee", "Sara Desai", "Aanya Mehta", "Aadhya Rao",
    "Navya Pillai", "Isha Saxena", "Riya Thakur", "Kavya Menon",
]


def generate_id():
    return str(uuid.uuid4())


def clear_database(db):
    """Delete all existing data in dependency order."""
    print("Clearing existing data...")
    db.query(FeePayment).delete()
    db.query(Fee).delete()
    db.query(Attendance).delete()
    db.query(Marks).delete()
    db.query(Notification).delete()
    db.query(Announcement).delete()
    db.query(CounsellorStudent).delete()
    db.query(Lecture).delete()
    db.query(BatchModule).delete()
    db.query(TrainerBatch).delete()
    db.query(Student).delete()
    db.query(Counsellor).delete()
    db.query(Trainer).delete()
    db.query(Module).delete()
    db.query(Batch).delete()
    db.query(User).delete()
    db.commit()


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        clear_database(db)

        # --- Users ---
        print("Creating users...")

        # Admin
        admin_user = User(
            id=generate_id(),
            email="admin@institute.com",
            password=pwd_context.hash("admin123"),
            role="ADMIN",
            name="Admin User",
            phone="9000000001",
        )
        db.add(admin_user)

        # Trainers
        trainer_data = [
            {"email": "trainer1@institute.com", "name": "Rajesh Kumar", "specialization": "Full Stack Development"},
            {"email": "trainer2@institute.com", "name": "Priya Sharma", "specialization": "Frontend & UI/UX"},
            {"email": "trainer3@institute.com", "name": "Amit Patel", "specialization": "Backend & DevOps"},
        ]
        trainers = []
        for td in trainer_data:
            user = User(
                id=generate_id(),
                email=td["email"],
                password=pwd_context.hash("trainer123"),
                role="TRAINER",
                name=td["name"],
                phone=f"900000000{len(trainers) + 2}",
            )
            db.add(user)
            db.flush()
            trainer = Trainer(id=generate_id(), userId=user.id, specialization=td["specialization"])
            db.add(trainer)
            trainers.append(trainer)

        # Counsellors
        counsellor_data = [
            {"email": "counsellor1@institute.com", "name": "Sunita Reddy"},
            {"email": "counsellor2@institute.com", "name": "Deepak Verma"},
        ]
        counsellors = []
        for cd in counsellor_data:
            user = User(
                id=generate_id(),
                email=cd["email"],
                password=pwd_context.hash("counsellor123"),
                role="COUNSELLOR",
                name=cd["name"],
                phone=f"900000000{len(counsellors) + 5}",
            )
            db.add(user)
            db.flush()
            counsellor = Counsellor(id=generate_id(), userId=user.id)
            db.add(counsellor)
            counsellors.append(counsellor)

        db.flush()
        print(f"  Created 1 admin, {len(trainers)} trainers, {len(counsellors)} counsellors")

        # --- Batches ---
        print("Creating batches...")
        batch_data = [
            {"name": "Full Stack Web Dev - Batch 1", "startDate": datetime(2024, 1, 15), "endDate": datetime(2024, 7, 15)},
            {"name": "Full Stack Web Dev - Batch 2", "startDate": datetime(2024, 3, 1), "endDate": datetime(2024, 9, 1)},
            {"name": "Data Science - Batch 1", "startDate": datetime(2024, 2, 1), "endDate": datetime(2024, 8, 1)},
            {"name": "Mobile App Dev - Batch 1", "startDate": datetime(2024, 4, 1), "endDate": datetime(2024, 10, 1)},
        ]
        batches = []
        for bd in batch_data:
            batch = Batch(id=generate_id(), name=bd["name"], startDate=bd["startDate"], endDate=bd["endDate"], isActive=True)
            db.add(batch)
            batches.append(batch)
        db.flush()
        print(f"  Created {len(batches)} batches")

        # --- Modules ---
        print("Creating modules...")
        module_names = [
            "HTML & CSS",
            "JavaScript",
            "React.js",
            "Node.js & Express",
            "Database & SQL",
            "TypeScript",
            "DevOps & CI/CD",
            "Data Structures & Algorithms",
        ]
        modules = []
        for mn in module_names:
            module = Module(id=generate_id(), name=mn, description=f"Learn {mn}", duration=40)
            db.add(module)
            modules.append(module)
        db.flush()
        print(f"  Created {len(modules)} modules")

        # --- Batch-Module Assignments ---
        print("Creating batch-module assignments...")
        bm_count = 0
        for batch in batches:
            for module in modules:
                bm = BatchModule(id=generate_id(), batchId=batch.id, moduleId=module.id, status="IN_PROGRESS", completionPercent=25.0)
                db.add(bm)
                bm_count += 1
        db.flush()
        print(f"  Created {bm_count} batch-module assignments")

        # --- Trainer-Batch Assignments ---
        print("Creating trainer-batch assignments...")
        tb_assignments = [
            (trainers[0].id, batches[0].id),
            (trainers[0].id, batches[1].id),
            (trainers[1].id, batches[0].id),
            (trainers[1].id, batches[2].id),
            (trainers[2].id, batches[1].id),
            (trainers[2].id, batches[3].id),
        ]
        for trainer_id, batch_id in tb_assignments:
            tb = TrainerBatch(id=generate_id(), trainerId=trainer_id, batchId=batch_id)
            db.add(tb)
        db.flush()
        print(f"  Created {len(tb_assignments)} trainer-batch assignments")

        # --- Students ---
        print("Creating students...")
        students = []
        for i in range(20):
            user = User(
                id=generate_id(),
                email=f"student{i + 1}@institute.com",
                password=pwd_context.hash("student123"),
                role="STUDENT",
                name=STUDENT_NAMES[i],
                phone=f"98000000{i + 1:02d}",
            )
            db.add(user)
            db.flush()

            batch_index = i % 4
            counsellor_index = i % 2
            student = Student(
                id=generate_id(),
                userId=user.id,
                batchId=batches[batch_index].id,
                counsellorId=counsellors[counsellor_index].id,
                mode="OFFLINE" if i % 3 != 0 else "ONLINE",
            )
            db.add(student)
            students.append(student)
        db.flush()
        print(f"  Created {len(students)} students")

        # --- Counsellor-Student Assignments ---
        print("Creating counsellor-student assignments...")
        for i, student in enumerate(students):
            counsellor_index = i % 2
            cs = CounsellorStudent(
                id=generate_id(),
                counsellorId=counsellors[counsellor_index].id,
                studentId=student.id,
            )
            db.add(cs)
        db.flush()
        print(f"  Created {len(students)} counsellor-student assignments")

        # --- Lectures ---
        print("Creating lectures...")
        lectures = []
        base_date = datetime(2024, 2, 1)
        topics_list = [
            "Introduction to HTML",
            "CSS Box Model",
            "JavaScript Basics",
            "DOM Manipulation",
            "React Components",
            "State Management",
            "Node.js Fundamentals",
            "Express Routing",
            "SQL Queries",
            "Database Design",
            "TypeScript Types",
            "Interfaces and Generics",
            "Docker Basics",
            "CI/CD Pipelines",
            "Arrays and Strings",
            "Linked Lists",
            "Trees and Graphs",
            "Sorting Algorithms",
            "REST API Design",
            "Authentication & Authorization",
        ]
        for i in range(20):
            lecture = Lecture(
                id=generate_id(),
                batchId=batches[0].id,
                moduleId=modules[i % len(modules)].id,
                trainerId=trainers[0].id,
                date=base_date + timedelta(days=i),
                startTime="10:00",
                endTime="12:00",
                duration=120,
                topics=topics_list[i],
            )
            db.add(lecture)
            lectures.append(lecture)
        db.flush()
        print(f"  Created {len(lectures)} lectures")

        # --- Attendance ---
        print("Creating attendance records...")
        att_count = 0
        batch1_students = [s for s in students if s.batchId == batches[0].id]
        for lecture in lectures:
            for student in batch1_students:
                import random
                status = random.choice(["PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE"])
                att = Attendance(
                    id=generate_id(),
                    studentId=student.id,
                    lectureId=lecture.id,
                    status=status,
                    method="QR" if status == "PRESENT" else "MANUAL",
                )
                db.add(att)
                att_count += 1
        db.flush()
        print(f"  Created {att_count} attendance records")

        # --- Marks ---
        print("Creating marks...")
        marks_count = 0
        mark_types = ["QUIZ", "ASSIGNMENT", "PROJECT", "EXAM"]
        for student in students[:10]:
            for j, module in enumerate(modules[:4]):
                marks = Marks(
                    id=generate_id(),
                    studentId=student.id,
                    moduleId=module.id,
                    type=mark_types[j % len(mark_types)],
                    score=float(60 + (hash(student.id + module.id) % 35)),
                    maxScore=100.0,
                    remarks="Good performance" if (hash(student.id) % 2 == 0) else None,
                )
                db.add(marks)
                marks_count += 1
        db.flush()
        print(f"  Created {marks_count} marks records")

        # --- Fees ---
        print("Creating fees...")
        fee_count = 0
        for i, student in enumerate(students):
            total = 50000.0
            paid_amounts = [50000, 40000, 30000, 25000, 20000, 15000, 10000, 5000, 45000, 35000]
            paid = float(paid_amounts[i % len(paid_amounts)])
            pending = total - paid
            status = "PAID" if paid >= total else ("PARTIAL" if paid > 0 else "PENDING")

            fee = Fee(
                id=generate_id(),
                studentId=student.id,
                totalAmount=total,
                paidAmount=paid,
                pendingAmount=pending,
                dueDate=datetime(2024, 6, 30),
                status=status,
            )
            db.add(fee)
            db.flush()

            if paid > 0:
                payment = FeePayment(
                    id=generate_id(),
                    feeId=fee.id,
                    amount=paid,
                    paidAt=datetime(2024, 1, 15) + timedelta(days=i * 3),
                    method="UPI" if i % 3 == 0 else ("BANK_TRANSFER" if i % 3 == 1 else "CASH"),
                )
                db.add(payment)

            fee_count += 1
        db.flush()
        print(f"  Created {fee_count} fee records")

        # --- Notifications ---
        print("Creating notifications...")
        notif_count = 0
        for i, student in enumerate(students[:10]):
            notif = Notification(
                id=generate_id(),
                userId=student.userId,
                title="Welcome to Institute ERP",
                message=f"Welcome {STUDENT_NAMES[i]}! Your enrollment is confirmed.",
                type="INFO",
                isRead=i % 2 == 0,
            )
            db.add(notif)
            notif_count += 1

        # Notification for trainers
        for trainer in trainers:
            notif = Notification(
                id=generate_id(),
                userId=trainer.userId,
                title="New Batch Assigned",
                message="You have been assigned to a new batch. Check your dashboard for details.",
                type="INFO",
                isRead=False,
            )
            db.add(notif)
            notif_count += 1
        db.flush()
        print(f"  Created {notif_count} notifications")

        # --- Announcements ---
        print("Creating announcements...")
        announcements_data = [
            {"title": "Welcome to the New Semester", "message": "Classes begin next week. Please check your batch schedule.", "targetRole": "STUDENT"},
            {"title": "Faculty Meeting", "message": "All trainers are requested to attend the faculty meeting on Friday.", "targetRole": "TRAINER"},
            {"title": "Fee Payment Reminder", "message": "Please clear any pending fee payments before the end of this month.", "targetRole": "STUDENT"},
        ]
        for ad in announcements_data:
            ann = Announcement(
                id=generate_id(),
                createdById=admin_user.id,
                title=ad["title"],
                message=ad["message"],
                targetRole=ad["targetRole"],
                batchId=batches[0].id,
            )
            db.add(ann)
        db.flush()
        print(f"  Created {len(announcements_data)} announcements")

        db.commit()
        print("\nSeed completed successfully!")
        print("\n--- Default Credentials ---")
        print("Admin:      admin@institute.com / admin123")
        print("Trainer 1:  trainer1@institute.com / trainer123")
        print("Trainer 2:  trainer2@institute.com / trainer123")
        print("Trainer 3:  trainer3@institute.com / trainer123")
        print("Counsellor: counsellor1@institute.com / counsellor123")
        print("Counsellor: counsellor2@institute.com / counsellor123")
        print("Students:   student1@institute.com - student20@institute.com / student123")
        print("----------------------------")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
