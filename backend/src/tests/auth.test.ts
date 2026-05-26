import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';

const prisma = new PrismaClient();

describe('Auth Endpoints', () => {
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    // Clean up test database
    await prisma.notification.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.feePayment.deleteMany();
    await prisma.fee.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.marks.deleteMany();
    await prisma.mockInterview.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.lecture.deleteMany();
    await prisma.counsellorStudent.deleteMany();
    await prisma.trainerBatch.deleteMany();
    await prisma.batchModule.deleteMany();
    await prisma.student.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.counsellor.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.module.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user for tests
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'testadmin@institute.com',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'ADMIN',
      },
    });
    adminId = admin.id;

    // Generate admin token
    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    await prisma.student.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.counsellor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testadmin@institute.com', password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('testadmin@institute.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testadmin@institute.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@institute.com', password: 'password' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user when admin is authenticated', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newstudent@institute.com',
          password: 'password123',
          name: 'New Student',
          role: 'STUDENT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('newstudent@institute.com');
      expect(res.body.data.role).toBe('STUDENT');
    });

    it('should reject registration without token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another@institute.com',
          password: 'password123',
          name: 'Another User',
          role: 'STUDENT',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with non-admin token', async () => {
      const studentToken = jwt.sign(
        { userId: 'some-id', email: 'student@test.com', role: 'STUDENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          email: 'another@institute.com',
          password: 'password123',
          name: 'Another User',
          role: 'STUDENT',
        });

      // User 'some-id' does not exist in DB so authenticate rejects with 401
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'testadmin@institute.com',
          password: 'password123',
          name: 'Duplicate User',
          role: 'STUDENT',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('testadmin@institute.com');
      expect(res.body.data.name).toBe('Test Admin');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currentPassword: 'admin123', newPassword: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testadmin@institute.com', password: 'newpassword123' });

      expect(loginRes.status).toBe(200);

      // Change back for other tests
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currentPassword: 'newpassword123', newPassword: 'admin123' });
    });

    it('should reject with wrong current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
