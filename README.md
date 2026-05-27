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

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS            |
| State      | TanStack React Query, React Context                 |
| UI         | Headless UI, Heroicons, Chart.js, React Hot Toast   |
| Backend    | Node.js 22, Express, TypeScript                     |
| Database   | SQLite via Prisma ORM                               |
| Validation | Zod                                                 |
| Auth       | JWT with role-based access control (bcryptjs)       |
| File I/O   | Multer (uploads), PDFKit (PDF), ExcelJS (Excel)     |
| QR Code    | qrcode.react (generation), html5-qrcode (scanning) |
| Testing    | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| Container  | Docker (multi-stage build), Docker Compose          |

## Architecture

```
┌───────────────────┐         ┌───────────────────┐         ┌───────────┐
│                   │  HTTP   │                   │  Prisma │           │
│  React Frontend   ├────────►│  Express Backend  ├────────►│  SQLite   │
│  (Vite SPA)       │         │  (REST API)       │         │  Database │
│                   │         │                   │         │           │
└───────────────────┘         └───────────────────┘         └───────────┘
        │                             │
   Port 5173 (dev)              Port 5000
   Served by Express (prod)     /api/* routes
```

In production, the Express server serves both the API and the compiled frontend as static files.

## User Roles

| Role         | Capabilities                                                     |
|--------------|------------------------------------------------------------------|
| **Admin**    | Full system management — users, batches, modules, reports        |
| **Trainer**  | Lectures, attendance, assignments, evaluations, mock interviews  |
| **Counsellor** | Student mentoring, fee tracking, alerts                       |
| **Student**  | View attendance, performance, assignments, resources, notifications |

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/harshaldhangar7/Institute-ERP.git
cd Institute-ERP

# Install dependencies (npm workspaces)
npm install

# Generate Prisma client
npx prisma generate --schema=backend/prisma/schema.prisma

# Run database migrations
npx prisma db push --schema=backend/prisma/schema.prisma

# Seed the database with demo data
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
npm run build
npm start
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
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── routes/               # API route handlers
│   │   │   ├── index.ts          # Route registry with role guards
│   │   │   ├── auth.ts           # Authentication routes
│   │   │   ├── admin.ts          # Admin management routes
│   │   │   ├── trainer.ts        # Trainer routes
│   │   │   ├── counsellor.ts     # Counsellor routes
│   │   │   ├── student.ts        # Student routes
│   │   │   ├── attendance.ts     # Attendance routes
│   │   │   ├── evaluation.ts     # Marks/evaluation routes
│   │   │   ├── mock-interview.ts # Mock interview routes
│   │   │   ├── assignments.ts    # Assignment routes
│   │   │   ├── resources.ts      # Resource routes
│   │   │   ├── reports.ts        # PDF/Excel report routes
│   │   │   └── notifications.ts  # Notification routes
│   │   ├── services/             # Business logic layer
│   │   ├── middleware/           # Auth, validation, file upload
│   │   ├── types/                # TypeScript type definitions
│   │   ├── utils/                # Response helpers
│   │   └── tests/                # Jest API tests
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (17 models)
│   │   └── seed.ts               # Demo data seeder
│   ├── uploads/                  # File uploads directory
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Root component with routing
│   │   ├── pages/                # Page components by role
│   │   │   ├── admin/            # Admin pages (Dashboard, Students, etc.)
│   │   │   ├── trainer/          # Trainer pages (Lectures, Attendance, etc.)
│   │   │   ├── counsellor/       # Counsellor pages (Students, Fees, etc.)
│   │   │   └── student/          # Student pages (Performance, etc.)
│   │   ├── components/           # Shared UI components
│   │   │   └── common/           # Reusable: Button, Card, Table, Modal, etc.
│   │   ├── contexts/             # Auth context provider
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API client (Axios)
│   │   └── __tests__/            # Vitest component tests
│   └── package.json
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Docker Compose configuration
├── package.json                  # Root workspace configuration
└── README.md
```

## Database Schema

The application uses 20 database models including:

- **User Management**: User, Student, Trainer, Counsellor
- **Academic Structure**: Batch, Module, BatchModule, TrainerBatch
- **Lectures & Attendance**: Lecture, Attendance (with QR session tokens)
- **Evaluation**: Marks, MockInterview
- **Assignments**: Assignment, Submission
- **Resources**: Resource (file-based learning materials)
- **Financial**: Fee, FeePayment
- **Communication**: Notification, Announcement, CounsellorStudent

## Scripts Reference

| Script               | Description                              |
|----------------------|------------------------------------------|
| `npm run build`      | Build both backend and frontend          |
| `npm run dev:backend`| Start backend dev server (port 5000)     |
| `npm run dev:frontend`| Start frontend dev server (port 5173)   |
| `npm run seed`       | Seed database with demo data             |
| `npm run test`       | Run all tests (backend + frontend)       |
| `npm run test:backend`| Run backend tests only                  |
| `npm run test:frontend`| Run frontend tests only                |
| `npm start`          | Start production server                  |
| `npm run docker:build`| Build Docker image                      |
| `npm run docker:run` | Run with Docker Compose                  |

## Running Tests

```bash
# Run all tests
npm test

# Backend tests only (Jest + Supertest)
npm run test:backend

# Frontend tests only (Vitest + Testing Library)
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
