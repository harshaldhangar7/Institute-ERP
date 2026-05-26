# Institute ERP

A comprehensive Enterprise Resource Planning system for educational institutes. Manages students, trainers, counsellors, batches, attendance, evaluations, fees, and more through a modern web interface backed by a robust REST API.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS |
| Backend    | Python 3.11, FastAPI, SQLAlchemy        |
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
- **TRAINER** - Lecture management, attendance, assignments, evaluations
- **COUNSELLOR** - Student mentoring, progress tracking, mock interviews
- **STUDENT** - View attendance, marks, assignments, fees, notifications

## Getting Started

### Prerequisites

- Python 3.11+
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
venv\Scripts\activate.bat
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
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 5173
```

### Docker Deployment

```bash
# Build the Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:run

# Or run directly
docker run -p 5000:5000 institute-erp
```

The application will be available at `http://localhost:5000`.

### Production Mode

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

## Default Credentials

| Role       | Email                      | Password     |
|------------|----------------------------|--------------|
| Admin      | admin@institute.com        | admin123     |
| Trainer    | trainer1@institute.com     | trainer123   |
| Counsellor | counsellor1@institute.com  | counsellor123|
| Student    | student1@institute.com     | student123   |

## API Documentation

All API endpoints are prefixed with `/api`. Authentication is required for most endpoints via a Bearer token in the Authorization header.

FastAPI provides interactive API documentation at:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

### Authentication
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `CRUD /api/admin/users` - User management
- `CRUD /api/admin/batches` - Batch management
- `CRUD /api/admin/modules` - Module management
- `POST /api/admin/batches/:id/modules` - Assign modules to batches
- `POST /api/admin/batches/:id/trainers` - Assign trainers to batches

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

## Project Structure

```
Institute-ERP/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Package init
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # App configuration
│   │   ├── database.py       # SQLAlchemy database setup
│   │   ├── dependencies.py   # Dependency injection (auth, etc.)
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── routes/           # API route handlers
│   │   └── utils/            # Response helpers, file upload
│   ├── tests/                # Pytest API tests
│   ├── uploads/              # File uploads directory
│   ├── requirements.txt      # Python dependencies
│   └── seed.py               # Demo data seeder
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root component with routing
│   │   ├── pages/            # Page components by role
│   │   ├── components/       # Shared UI components
│   │   ├── contexts/         # Auth context provider
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client (Axios)
│   │   └── __tests__/        # Vitest component tests
│   └── dist/                 # Production build output
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose configuration
├── package.json              # Root scripts configuration
└── README.md                 # This file
```

## Environment Variables

| Variable      | Default              | Description                    |
|---------------|----------------------|--------------------------------|
| PORT          | 5000                 | Server port                    |
| DATABASE_URL  | sqlite:///./dev.db   | SQLAlchemy database URL        |
| JWT_SECRET    | (required)           | Secret key for JWT signing     |
| NODE_ENV      | development          | Environment (development/production) |

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

## License

Private - All rights reserved.
