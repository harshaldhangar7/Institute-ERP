# Institute ERP

A comprehensive Enterprise Resource Planning system for educational institutes. Manages students, trainers, counsellors, batches, attendance, evaluations, fees, and more through a modern web interface backed by a robust REST API.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript            |
| Database   | SQLite via Prisma ORM                   |
| Auth       | JWT with role-based access control      |
| Container  | Docker (multi-stage build)              |

## Architecture

```
+-------------------+         +-------------------+         +-----------+
|                   |  HTTP   |                   |  Prisma |           |
|  React Frontend   +-------->+  Express Backend  +-------->+  SQLite   |
|  (Vite SPA)       |         |  (REST API)       |         |  Database |
|                   |         |                   |         |           |
+-------------------+         +-------------------+         +-----------+
        |                             |
   Port 5173 (dev)              Port 5000
   Served by Express (prod)     /api/* routes
```

In production, the Express server serves both the API and the compiled frontend as static files.

## User Roles

- **ADMIN** - Full system management (users, batches, modules, reports)
- **TRAINER** - Lecture management, attendance, assignments, evaluations
- **COUNSELLOR** - Student mentoring, progress tracking, mock interviews
- **STUDENT** - View attendance, marks, assignments, fees, notifications

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Seed the database with demo data
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
npm run build
npm start
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
│   ├── src/
│   │   ├── index.ts          # Express app entry point
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation, upload
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Response helpers
│   │   └── tests/            # Jest API tests
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Demo data seeder
│   ├── uploads/              # File uploads directory
│   └── dist/                 # Compiled JavaScript output
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
├── package.json              # Root workspace configuration
└── README.md                 # This file
```

## Environment Variables

| Variable      | Default              | Description                    |
|---------------|----------------------|--------------------------------|
| PORT          | 5000                 | Server port                    |
| DATABASE_URL  | file:./dev.db        | SQLite database path           |
| JWT_SECRET    | (required)           | Secret key for JWT signing     |
| NODE_ENV      | development          | Environment (development/production) |

## Running Tests

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

## License

Private - All rights reserved.
