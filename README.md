# Institute ERP

A comprehensive Enterprise Resource Planning system for educational institutes. Manages students, trainers, counsellors, batches, attendance, evaluations, fees, and more through a modern web interface backed by a robust REST API.

## Features

- **Role-Based Access Control** - Four distinct user roles (Admin, Trainer, Counsellor, Student) with JWT authentication
- **Attendance Management** - QR code-based and manual attendance tracking with session tokens
- **Evaluation System** - Marks management, mock interviews with multi-parameter scoring
- **Assignment & Resources** - File upload support for assignments, submissions, and learning resources
- **Fee Management** - Track payments, pending amounts, due dates, and payment history
- **Reporting** - Generate PDF and Excel reports for attendance and marks
- **Notifications & Announcements** - Role-targeted and batch-specific announcements
- **Dashboard Analytics** - Visual dashboards with Chart.js for each user role
- **Batch & Module Management** - Organize students into batches, assign modules and trainers

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS |
| Backend    | Python 3.11-3.13, FastAPI, SQLAlchemy   |
| Database   | SQLite via SQLAlchemy ORM               |
| Auth       | JWT with role-based access control      |
| Container  | Docker (multi-stage build)              |

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

In production, the FastAPI server serves both the API and the compiled frontend as static files.

## User Roles

- **ADMIN** - Full system management (users, batches, modules, reports)
- **TRAINER** - Lecture management, attendance, assignments, evaluations, mock interviews, resources, reports
- **COUNSELLOR** - Student mentoring, fee tracking, alerts
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

Or using the root package.json scripts:

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

# Run with Docker Compose
npm run docker:run

# Or run directly
docker run -p 5000:5000 -e JWT_SECRET=your-secret-key institute-erp
```

The application will be available at `http://localhost:5000`.

### Production Build

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

## Default Credentials

| Role       | Email                      | Password      |
|------------|----------------------------|---------------|
| Admin      | admin@institute.com        | admin123      |
| Trainer    | trainer1@institute.com     | trainer123    |
| Counsellor | counsellor1@institute.com  | counsellor123 |
| Student    | student1@institute.com     | student123    |

## Environment Variables

Create a `.env` file in the `backend/` directory (see `.env.example`):

| Variable       | Default        | Description                          |
|----------------|----------------|--------------------------------------|
| `PORT`         | `5000`         | Server port                          |
| `DATABASE_URL` | `file:./dev.db`| SQLite database file path            |
| `JWT_SECRET`   | *(required)*   | Secret key for JWT token signing     |
| `NODE_ENV`     | `development`  | Environment (`development`/`production`) |

## API Documentation

All API endpoints are prefixed with `/api`. Authentication is required for most endpoints via a Bearer token in the `Authorization` header.

FastAPI provides interactive API documentation at:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

### Authentication
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `CRUD /api/admin/students` - Student management
- `CRUD /api/admin/trainers` - Trainer management
- `CRUD /api/admin/counsellors` - Counsellor management
- `CRUD /api/admin/batches` - Batch management (supports `moduleIds` and `trainerId` on create/update)
- `CRUD /api/admin/modules` - Module management
- `POST /api/admin/assign-module-batch` - Assign a module to a batch
- `POST /api/admin/assign-trainer-batch` - Assign a trainer to a batch
- `POST /api/admin/assign-counsellor-student` - Assign a counsellor to a student

### Trainer
- `GET /api/trainer/dashboard` - Trainer dashboard
- `CRUD /api/trainer/lectures` - Lecture management
- `POST /api/trainer/attendance/mark` - Mark attendance

### Counsellor
- `GET /api/counsellor/dashboard` - Counsellor dashboard
- `GET /api/counsellor/students` - Assigned students list

### Student
- `GET /api/student/dashboard` - Student dashboard
- `GET /api/student/attendance` - Attendance records
- `GET /api/student/marks` - Marks and evaluations

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/lecture/:id` - Get lecture attendance

### Evaluations & Marks
- `POST /api/evaluation/marks` - Add marks
- `GET /api/evaluation/student/:id` - Student evaluations

### Assignments & Resources
- `CRUD /api/assignments` - Assignment management
- `CRUD /api/resources` - Resource management

### Reports
- `GET /api/reports/attendance` - Attendance reports (PDF/Excel)
- `GET /api/reports/marks` - Marks reports

### Notifications
- `GET /api/notifications` - User notifications
- `POST /api/notifications` - Create notification

### Health
- `GET /api/health` - API health check

## Key Features

- **Batch-Module Integration** - Assign modules directly when creating or editing a batch (multi-select UI)
- **QR-Based Attendance** - HMAC-signed QR codes for secure attendance marking
- **Report Generation** - Export attendance and marks reports as PDF or Excel
- **File Uploads** - Authenticated file serving for assignments and resources
- **Real-time Notifications** - In-app notification system for announcements and alerts

## Project Structure

```
Institute-ERP/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Package init
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # App configuration (Pydantic Settings)
│   │   ├── database.py       # SQLAlchemy engine & session setup
│   │   ├── dependencies.py   # Dependency injection (auth, role guard)
│   │   ├── models/           # SQLAlchemy ORM models (18 models)
│   │   ├── routes/           # API route handlers (12 modules)
│   │   └── utils/            # Auth helpers, response formatting, uploads
│   ├── tests/                # Pytest API tests
│   ├── uploads/              # File uploads directory
│   ├── requirements.txt      # Python dependencies
│   └── seed.py               # Demo data seeder
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root component with lazy-loaded routing
│   │   ├── pages/            # Page components organized by role
│   │   │   ├── admin/        # Admin pages (Dashboard, Students, Batches, etc.)
│   │   │   ├── trainer/      # Trainer pages (Lectures, Attendance, etc.)
│   │   │   ├── counsellor/   # Counsellor pages (Students, Fees, Alerts)
│   │   │   └── student/      # Student pages (Performance, Assignments, etc.)
│   │   ├── components/       # Shared UI components (Button, Modal, MultiSelect, etc.)
│   │   ├── contexts/         # Auth context provider
│   │   ├── hooks/            # Custom hooks (useApi, useAuth, usePagination)
│   │   ├── services/         # API client (Axios)
│   │   └── types/            # TypeScript type definitions
│   └── dist/                 # Production build output
├── Dockerfile                # Multi-stage Docker build (Node 22 + Python 3.13)
├── docker-compose.yml        # Docker Compose configuration
└── README.md                 # This file
```

## Environment Variables

| Variable       | Default              | Description                    |
|----------------|----------------------|--------------------------------|
| PORT           | 5000                 | Server port                    |
| DATABASE_URL   | sqlite:///./dev.db   | SQLAlchemy database URL        |
| JWT_SECRET     | (required)           | Secret key for JWT signing     |
| NODE_ENV       | development          | Environment (development/production) |
| QR_HMAC_SECRET | qr-hmac-secret-key   | Secret for QR code HMAC signing |

## Running Tests

```bash
# Run backend tests
npm run test:backend

# Or directly with pytest
cd backend
python -m pytest tests/ -v

# Frontend tests
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
