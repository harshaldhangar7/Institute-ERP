import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';

const prisma = new PrismaClient();

describe('Admin Endpoints', () => {
  let adminToken: string;
  let studentId: string;
  let trainerId: string;
  let counsellorId: string;
  let batchId: string;
  let moduleId: string;

  beforeAll(async () => {
    // Clean up
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

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: { email: 'admin@test.com', password: hashedPassword, name: 'Admin', role: 'ADMIN' },
    });

    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );

    // Create a batch
    const batch = await prisma.batch.create({
      data: { name: 'Test Batch', startDate: new Date() },
    });
    batchId = batch.id;

    // Create a module
    const mod = await prisma.module.create({
      data: { name: 'Test Module', description: 'A test module', duration: 40 },
    });
    moduleId = mod.id;
  });

  afterAll(async () => {
    await prisma.counsellorStudent.deleteMany();
    await prisma.trainerBatch.deleteMany();
    await prisma.batchModule.deleteMany();
    await prisma.student.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.counsellor.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.module.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalStudents');
      expect(res.body.data).toHaveProperty('activeBatches');
      expect(res.body.data).toHaveProperty('attendanceOverview');
      expect(res.body.data).toHaveProperty('feeCollectionStatus');
    });

    it('should reject non-admin access', async () => {
      const studentToken = jwt.sign(
        { userId: 'x', email: 's@test.com', role: 'STUDENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Students CRUD', () => {
    it('should create a student', async () => {
      const res = await request(app)
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'student1@test.com',
          password: 'password123',
          name: 'Student One',
          batchId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('student1@test.com');
      studentId = res.body.data.id;
    });

    it('should list students', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should update a student', async () => {
      const res = await request(app)
        .put(`/api/admin/students/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Student' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete a student', async () => {
      // Create one to delete
      const createRes = await request(app)
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'todelete@test.com', password: 'pass123', name: 'Delete Me' });

      const res = await request(app)
        .delete(`/api/admin/students/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Trainers CRUD', () => {
    it('should create a trainer', async () => {
      const res = await request(app)
        .post('/api/admin/trainers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'trainer1@test.com',
          password: 'password123',
          name: 'Trainer One',
          specialization: 'JavaScript',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      trainerId = res.body.data.id;
    });

    it('should list trainers', async () => {
      const res = await request(app)
        .get('/api/admin/trainers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Counsellors CRUD', () => {
    it('should create a counsellor', async () => {
      const res = await request(app)
        .post('/api/admin/counsellors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'counsellor1@test.com',
          password: 'password123',
          name: 'Counsellor One',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      counsellorId = res.body.data.id;
    });

    it('should list counsellors', async () => {
      const res = await request(app)
        .get('/api/admin/counsellors')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Batches CRUD', () => {
    it('should create a batch', async () => {
      const res = await request(app)
        .post('/api/admin/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Batch', startDate: '2024-01-01' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Batch');
    });

    it('should list batches', async () => {
      const res = await request(app)
        .get('/api/admin/batches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Modules CRUD', () => {
    it('should create a module', async () => {
      const res = await request(app)
        .post('/api/admin/modules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Module', description: 'Desc', duration: 30 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Module');
    });

    it('should list modules', async () => {
      const res = await request(app)
        .get('/api/admin/modules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Assignments', () => {
    it('should assign trainer to batch', async () => {
      const res = await request(app)
        .post('/api/admin/assign-trainer-batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trainerId, batchId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should assign counsellor to student', async () => {
      const res = await request(app)
        .post('/api/admin/assign-counsellor-student')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ counsellorId, studentId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should assign module to batch', async () => {
      const res = await request(app)
        .post('/api/admin/assign-module-batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ moduleId, batchId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate assignment', async () => {
      const res = await request(app)
        .post('/api/admin/assign-trainer-batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trainerId, batchId });

      expect(res.status).toBe(400);
    });
  });
});
