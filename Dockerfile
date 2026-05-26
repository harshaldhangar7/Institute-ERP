# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies
RUN npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Generate Prisma client
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Build backend
RUN npm run build --workspace=backend

# Build frontend
RUN npm run build --workspace=frontend

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Copy backend dist and prisma
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/package.json ./backend/

# Copy frontend dist
COPY --from=build /app/frontend/dist ./frontend/dist

# Copy root package files for workspace resolution
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --workspace=backend --omit=dev && \
    npx prisma generate --schema=backend/prisma/schema.prisma

# Create uploads directory
RUN mkdir -p /app/backend/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=file:./prisma/dev.db

EXPOSE 5000

WORKDIR /app/backend

CMD ["node", "dist/index.js"]
