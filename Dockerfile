# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM python:3.11-slim AS production

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application
COPY backend/app ./backend/app
COPY backend/seed.py ./backend/
COPY backend/.env ./backend/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create uploads and data directories
RUN mkdir -p /app/backend/uploads /app/backend/data

# Set environment variables
ENV PORT=5000
ENV DATABASE_URL=sqlite:///./dev.db
ENV NODE_ENV=production

EXPOSE 5000

WORKDIR /app/backend

# Run seed and then start server
CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 5000"]
