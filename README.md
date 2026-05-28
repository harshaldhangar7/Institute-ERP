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

| Role         | Capabilities                                                     |
|--------------|------------------------------------------------------------------|
| **Admin**    | Full system management — users, batches, modules, reports        |
| **Trainer**  | Lectures, attendance, assignments, evaluations, mock interviews  |
| **Counsellor** | Student mentoring, fee tracking, alerts                       |
| **Student**  | View attendance, performance, assignments, resources, notifications |

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
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/api/auth/login`         | Login and receive JWT    |
| GET    | `/api/auth/me`            | Get current user profile |
| PUT    | `/api/auth/change-password` | Change password        |

### Admin (Role: ADMIN)
| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/admin/dashboard`            | Dashboard statistics         |
| CRUD   | `/api/admin/users`                | User management              |
| CRUD   | `/api/admin/batches`              | Batch management             |
| CRUD   | `/api/admin/modules`              | Module management            |
| POST   | `/api/admin/batches/:id/modules`  | Assign modules to batch      |
| POST   | `/api/admin/batches/:id/trainers` | Assign trainers to batch     |

### Trainer (Role: TRAINER)
| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/api/trainer/dashboard`       | Trainer dashboard        |
| CRUD   | `/api/trainer/lectures`        | Lecture management       |
| POST   | `/api/trainer/attendance/mark` | Mark attendance          |

### Counsellor (Role: COUNSELLOR)
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/counsellor/dashboard`  | Counsellor dashboard     |
| GET    | `/api/counsellor/students`   | Assigned students list   |

### Student (Role: STUDENT)
| Method | Endpoint                    | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/student/dashboard`    | Student dashboard        |
| GET    | `/api/student/attendance`   | Attendance records       |
| GET    | `/api/student/marks`        | Marks and evaluations    |

### Shared Endpoints
| Method | Endpoint                       | Roles              | Description              |
|--------|--------------------------------|--------------------|--------------------------|
| POST   | `/api/attendance/mark`         | TRAINER, STUDENT   | Mark attendance          |
| GET    | `/api/attendance/lecture/:id`  | TRAINER, STUDENT   | Get lecture attendance    |
| POST   | `/api/evaluation/marks`        | TRAINER, ADMIN     | Add marks                |
| GET    | `/api/evaluation/student/:id`  | TRAINER, ADMIN     | Student evaluations      |
| CRUD   | `/api/mock-interviews`         | TRAINER            | Mock interview management|
| CRUD   | `/api/assignments`             | TRAINER, STUDENT   | Assignment management    |
| CRUD   | `/api/resources`               | TRAINER, STUDENT   | Resource management      |
| GET    | `/api/reports/attendance`      | ADMIN, TRAINER     | Attendance reports (PDF/Excel) |
| GET    | `/api/reports/marks`           | ADMIN, TRAINER     | Marks reports            |
| GET    | `/api/notifications`           | All authenticated  | User notifications       |
| POST   | `/api/notifications`           | All authenticated  | Create notification      |
| GET    | `/api/health`                  | Public             | API health check         |

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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - All rights reserved.
