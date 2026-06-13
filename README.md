# Institute ERP

A comprehensive Enterprise Resource Planning system for educational institutes. Manages courses, students, trainers, counsellors, batches, modules, attendance, evaluations, fees, and more through a modern web interface backed by a robust REST API.

## Features

- **Role-Based Access Control** - Four distinct user roles (Admin, Trainer, Counsellor, Student) with JWT authentication
- **Course, Batch & Module Management** - Organize courses into batches and modules, assign trainers per batch-module
- **Attendance Management** - QR code-based, online, and manual attendance tracking with HMAC-signed session tokens
- **Evaluation System** - Marks management and mock interviews with multi-parameter scoring
- **Assignment & Resources** - File upload support for assignments, submissions, grading, and learning resources
- **Fee Management** - Track payments, pending amounts, due dates, and payment history
- **Reporting** - Generate PDF and Excel reports for attendance, marks, and batch progress
- **Notifications & Announcements** - Role-targeted and batch-specific announcements
- **Dashboard Analytics** - Visual dashboards with Chart.js for each user role
- **Counsellor Tools** - Student mentoring, fee tracking, follow-ups, and at-risk alerts

## Tech Stack

| Layer      | Technology                               |
|------------|------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS |
| Backend    | Python 3.11-3.13, FastAPI, SQLAlchemy 2  |
| Database   | SQLite via SQLAlchemy ORM                |
| Auth       | JWT (python-jose), bcrypt password hashing |
| Reports    | fpdf2 (PDF), openpyxl (Excel)            |
| Container  | Docker (multi-stage build)               |

Notable frontend libraries: React Router 6, Axios, TanStack Query, Chart.js (`react-chartjs-2`), Headless UI, Heroicons, `qrcode.react` + `html5-qrcode` for QR attendance, and `react-hot-toast`.

## Architecture

```
+-------------------+         +-------------------+         +-----------+
|                   |  HTTP   |                   | SQLAlchemy|           |
|  React Frontend   +-------->+  FastAPI Backend  +-------->+  SQLite   |
|  (Vite SPA)       |         |  (REST API)       |         |  Database |
|                   |         |                   |         |           |
+-------------------+         +-------------------+         +-----------+
        |                             |
   Port 5173 (dev)              Port 5000
   Served by FastAPI (prod)     /api/* routes
```

In production, the FastAPI server serves both the API and the compiled frontend as static files. Lightweight schema migrations run automatically on startup (`run_migrations()` in `app/database.py`).

## User Roles

- **ADMIN** - Full system management (users, courses, batches, modules, assignments of trainers/counsellors, reports)
- **TRAINER** - Lecture management, attendance, assignments, evaluations, mock interviews, resources, reports
- **COUNSELLOR** - Student mentoring, fee tracking, payments, follow-ups, alerts
- **STUDENT** - View attendance, performance, assignments, resources, lectures, notifications

## Getting Started

### Prerequisites

- Python 3.11+ (tested with 3.11, 3.12, and 3.13)
- Node.js 22+ (for frontend build)
- npm 10+
- Docker (optional, for containerized deployment)

### Local Development

#### Quick Start (using setup script)

```bash
# Linux/Mac
cd backend
./setup.sh

# Windows
cd backend
setup.bat
```

The setup script creates a virtual environment, activates it, and installs all dependencies automatically.

#### Manual Setup

```bash
# Create and activate a Python virtual environment
cd backend

# Linux/Mac
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

```bash
# Install backend dependencies (with venv activated)
pip install -r requirements.txt

# Seed the database with demo data
python seed.py

# Start the backend server (from backend/ directory)
uvicorn app.main:app --reload --port 5000

# In another terminal, start the frontend
cd frontend
npm install
npm run dev
```

> **Note:** Always activate the virtual environment before working on the backend.
> Use `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate.bat` (Windows).

Or using the root `package.json` scripts:

```bash
# Install backend deps
npm run install:backend

# Seed the database
npm run seed

# Start development servers
npm run dev:backend    # Backend on http://localhost:5000
npm run dev:frontend   # Frontend on http://localhost:5173
```

### Docker Deployment

```bash
# Build the Docker image
npm run docker:build

# Run with Docker Compose (docker compose up -d)
npm run docker:run

# Or run directly
docker run -p 5000:5000 -e JWT_SECRET=your-secret-key institute-erp
```

The application will be available at `http://localhost:5000`. The container seeds the database on startup, then launches the server. Docker Compose persists the database and uploads via named volumes (`db-data`, `uploads`).

### Production Build

```bash
cd backend
NODE_ENV=production uvicorn app.main:app --host 0.0.0.0 --port 5000
```

Set `NODE_ENV=production` so the backend serves the compiled `frontend/dist` SPA.

## Default Credentials

| Role       | Email                      | Password      |
|------------|----------------------------|---------------|
| Admin      | admin@institute.com        | admin123      |
| Trainer    | trainer1@institute.com     | trainer123    |
| Counsellor | counsellor1@institute.com  | counsellor123 |
| Student    | student1@institute.com     | student123    |

The seeder also creates `trainer1-3`, `counsellor1-2`, and `student1-20` accounts (same per-role passwords).

## Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example`):

| Variable         | Default              | Description                              |
|------------------|----------------------|------------------------------------------|
| `PORT`           | `5000`               | Server port                              |
| `DATABASE_URL`   | `sqlite:///./dev.db` | SQLAlchemy database URL                  |
| `JWT_SECRET`     | `your-secret-key`    | Secret key for JWT token signing         |
| `NODE_ENV`       | `development`        | Environment (`development`/`production`) |
| `QR_HMAC_SECRET` | `qr-hmac-secret-key` | Secret for QR code HMAC signing          |

> Override `JWT_SECRET` and `QR_HMAC_SECRET` with strong values in production.

## API Documentation

All API endpoints are prefixed with `/api`. Authentication is required for most endpoints via a Bearer token in the `Authorization` header. Each router enforces role-based access via a `role_guard` dependency.

FastAPI provides interactive API documentation at:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Admin (`/api/admin`, ADMIN only)
- `GET /api/admin/dashboard` - Dashboard statistics
- `CRUD /api/admin/students` - Student management
- `CRUD /api/admin/trainers` - Trainer management
- `CRUD /api/admin/counsellors` - Counsellor management
- `CRUD /api/admin/courses` - Course management
- `CRUD /api/admin/batches` - Batch management (supports `courseId`, `moduleIds`, and `trainerId` on create/update)
- `CRUD /api/admin/modules` - Module management
- `POST /api/admin/assign-module-batch` - Assign a module to a batch
- `POST /api/admin/assign-trainer-batch` - Assign a trainer to a batch
- `POST /api/admin/assign-counsellor-student` - Assign a counsellor to a student

### Trainer (`/api/trainer`, TRAINER only)
- `GET /api/trainer/dashboard` - Trainer dashboard
- `GET /api/trainer/batches` - Assigned batches
- `GET /api/trainer/batches/{batch_id}/students` - Students in a batch
- `GET /api/trainer/batches/{batch_id}/modules` - Modules in a batch
- `GET /api/trainer/students` - All students for the trainer
- `POST /api/trainer/lectures` - Create a lecture
- `PUT /api/trainer/lectures/{lecture_id}/end` - End a lecture
- `GET /api/trainer/lectures` - List lectures

### Counsellor (`/api/counsellor`, COUNSELLOR only)
- `GET /api/counsellor/dashboard` - Counsellor dashboard
- `GET /api/counsellor/students` - Assigned students list
- `GET /api/counsellor/students/{student_id}/fees` - Student fee details
- `POST /api/counsellor/fees/payment` - Record a fee payment
- `GET /api/counsellor/alerts` - At-risk student alerts
- `POST /api/counsellor/follow-ups` - Log a follow-up

### Student (`/api/student`, STUDENT only)
- `GET /api/student/dashboard` - Student dashboard
- `GET /api/student/attendance` - Attendance records
- `GET /api/student/marks` - Marks and evaluations
- `GET /api/student/mock-interviews` - Mock interview results
- `GET /api/student/assignments` - Assignments
- `GET /api/student/resources` - Learning resources
- `GET /api/student/lectures` - Lectures
- `GET /api/student/notifications` - Notifications

### Attendance (`/api/attendance`, TRAINER/STUDENT)
- `POST /api/attendance/generate-qr` - Generate an HMAC-signed attendance QR
- `POST /api/attendance/mark-qr` - Mark attendance by scanning a QR code
- `POST /api/attendance/mark-online` - Mark attendance for online sessions
- `POST /api/attendance/mark` - Manually mark attendance
- `GET /api/attendance/lecture/{lecture_id}` - Attendance for a lecture
- `GET /api/attendance/history/{student_id}` - Attendance history for a student
- `GET /api/attendance/batch/{batch_id}/{lecture_id}` - Batch attendance for a lecture

### Evaluation & Marks (`/api/evaluation`, TRAINER/ADMIN)
- `POST /api/evaluation/marks` - Add marks
- `GET /api/evaluation/marks/{student_id}` - Marks for a student
- `GET /api/evaluation/marks/batch/{batch_id}` - Marks for a batch
- `PUT /api/evaluation/marks/{marks_id}` - Update marks

### Mock Interviews (`/api/mock-interviews`, TRAINER)
- `GET /api/mock-interviews` - List mock interviews
- `POST /api/mock-interviews` - Create a mock interview evaluation
- `GET /api/mock-interviews/{student_id}` - Mock interviews for a student
- `GET /api/mock-interviews/batch/{batch_id}` - Mock interviews for a batch

### Assignments (`/api/assignments`, TRAINER/STUDENT)
- `POST /api/assignments/` - Create an assignment
- `GET /api/assignments/batch/{batch_id}` - Assignments for a batch
- `POST /api/assignments/{assignment_id}/submit` - Submit an assignment (file upload)
- `GET /api/assignments/{assignment_id}/submissions` - List submissions
- `PUT /api/assignments/submissions/{submission_id}/grade` - Grade a submission

### Resources (`/api/resources`, TRAINER/STUDENT)
- `POST /api/resources/` - Upload a resource
- `GET /api/resources/module/{module_id}` - Resources for a module
- `GET /api/resources/batch/{batch_id}` - Resources for a batch
- `DELETE /api/resources/{resource_id}` - Delete a resource

### Reports (`/api/reports`, ADMIN/TRAINER)
- `GET /api/reports/attendance` - Attendance reports
- `GET /api/reports/marks` - Marks reports
- `GET /api/reports/batch-progress` - Batch progress report
- `GET /api/reports/export/{export_type}` - Export reports as PDF or Excel

### Notifications (`/api/notifications`, authenticated)
- `GET /api/notifications/` - User notifications
- `PUT /api/notifications/{notification_id}/read` - Mark a notification as read
- `POST /api/notifications/announce` - Create an announcement

### Files & Health
- `GET /uploads/{file_path}` - JWT-authenticated file serving (with path-traversal protection)
- `GET /api/health` - API health check

## Key Features

- **Course → Batch → Module Hierarchy** - Courses group batches; batches assign modules (multi-select UI) and trainers
- **QR-Based Attendance** - HMAC-signed QR codes for secure attendance marking, plus online and manual options
- **Report Generation** - Export attendance, marks, and batch-progress reports as PDF or Excel
- **Authenticated File Uploads** - JWT-guarded file serving for assignments, submissions, and resources
- **Real-time Notifications** - In-app notification and announcement system

## Project Structure

```
Institute-ERP/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # Package init
│   │   ├── main.py            # FastAPI app entry point, routers, SPA + uploads serving
│   │   ├── config.py          # App configuration (Pydantic Settings)
│   │   ├── database.py        # SQLAlchemy engine, session, startup migrations
│   │   ├── dependencies.py    # Dependency injection (auth, role guard)
│   │   ├── models/            # SQLAlchemy ORM models (19 model files, 21 classes)
│   │   ├── routes/            # API route handlers (12 modules)
│   │   └── utils/             # Auth helpers, response formatting, uploads
│   ├── tests/                 # Pytest API tests (auth, admin, trainer)
│   ├── uploads/               # File uploads directory
│   ├── data/                  # Persisted production database
│   ├── requirements.txt       # Python dependencies
│   ├── setup.sh / setup.bat   # Virtualenv setup scripts
│   └── seed.py                # Demo data seeder
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Root component with lazy-loaded routing
│   │   ├── pages/             # Page components organized by role
│   │   │   ├── admin/         # Dashboard, Students, Trainers, Counsellors, Courses, Batches, Modules
│   │   │   ├── trainer/       # Dashboard, Batches, Lectures, Students, Attendance, Evaluation, MockInterviews, Assignments, Resources, Reports
│   │   │   ├── counsellor/    # Dashboard, Students, Fees, Alerts
│   │   │   └── student/       # Dashboard, Attendance, Performance, Assignments, Resources, Lectures, Notifications
│   │   ├── components/        # Layout, ProtectedRoute, and common UI (Button, Modal, MultiSelect, Table, etc.)
│   │   ├── contexts/          # Auth context provider
│   │   ├── hooks/             # Custom hooks (useApi, useAuth, usePagination)
│   │   ├── services/          # API client (Axios)
│   │   └── types/             # TypeScript type definitions
│   └── dist/                  # Production build output
├── Dockerfile                 # Multi-stage Docker build (Node 22 + Python 3.13)
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Root npm scripts (dev/build/test/seed/docker)
└── README.md                  # This file
```

## Running Tests

```bash
# Run backend tests
npm run test:backend

# Or directly with pytest
cd backend
python -m pytest tests/ -v

# Frontend tests (Vitest)
npm run test:frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - All rights reserved.
