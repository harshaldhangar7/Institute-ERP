import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';

const prisma = new PrismaClient();

describe('Trainer Endpoints', () => {
  let trainerToken: string;
  let trainerId: string;
  let batchId: string;
  let moduleId: string;
  let lectureId: string;

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

    // Create trainer user
    const hashedPassword = await bcrypt.hash('trainer123', 10);
    const trainerUser = await prisma.user.create({
      data: { email: 'trainer@test.com', password: hashedPassword, name: 'Trainer', role: 'TRAINER' },
    });

    const trainer = await prisma.trainer.create({
      data: { userId: trainerUser.id, specialization: 'Node.js' },
    });
    trainerId = trainer.id;

    trainerToken = jwt.sign(
      { userId: trainerUser.id, email: trainerUser.email, role: trainerUser.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );

    // Create batch and assign trainer
    const batch = await prisma.batch.create({
      data: { name: 'Trainer Batch', startDate: new Date() },
    });
    batchId = batch.id;

    await prisma.trainerBatch.create({
      data: { trainerId, batchId },
    });

    // Create module and assign to batch
    const mod = await prisma.module.create({
      data: { name: 'Node.js Basics', duration: 60 },
    });
    moduleId = mod.id;

    await prisma.batchModule.create({
      data: { batchId, moduleId },
    });

    // Create student in batch
    const studentUser = await prisma.user.create({
      data: { email: 'batchstudent@test.com', password: hashedPassword, name: 'Batch Student', role: 'STUDENT' },
    });
    await prisma.student.create({
      data: { userId: studentUser.id, batchId },
    });
  });

  afterAll(async () => {
    await prisma.attendance.deleteMany();
    await prisma.lecture.deleteMany();
    await prisma.trainerBatch.deleteMany();
    await prisma.batchModule.deleteMany();
    await prisma.student.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.module.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/trainer/batches', () => {
    it('should return assigned batches', async () => {
      const res = await request(app)
        .get('/api/trainer/batches')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Trainer Batch');
    });

    it('should reject non-trainer access', async () => {
      const studentToken = jwt.sign(
        { userId: 'x', email: 's@test.com', role: 'STUDENT' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '24h' }
      );
      const res = await request(app)
        .get('/api/trainer/batches')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/trainer/batches/:id/students', () => {
    it('should return students with snapshot data', async () => {
      const res = await request(app)
        .get(`/api/trainer/batches/${batchId}/students`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('attendancePercentage');
      expect(res.body.data[0]).toHaveProperty('avgMarks');
    });
  });

  describe('GET /api/trainer/batches/:id/modules', () => {
    it('should return modules for batch', async () => {
      const res = await request(app)
        .get(`/api/trainer/batches/${batchId}/modules`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].module.name).toBe('Node.js Basics');
    });
  });

  describe('POST /api/trainer/lectures', () => {
    it('should create a lecture', async () => {
      const res = await request(app)
        .post('/api/trainer/lectures')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          batchId,
          moduleId,
          date: new Date().toISOString(),
          startTime: '09:00',
          endTime: '10:00',
          topics: 'Introduction to Node.js',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      lectureId = res.body.data.id;
    });

    it('should reject invalid data', async () => {
      const res = await request(app)
        .post('/api/trainer/lectures')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ batchId });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/trainer/lectures/:id/end', () => {
    it('should end a lecture', async () => {
      const res = await request(app)
        .put(`/api/trainer/lectures/${lectureId}/end`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('endTime');
    });
  });

  describe('GET /api/trainer/lectures', () => {
    it('should return lecture history', async () => {
      const res = await request(app)
        .get('/api/trainer/lectures')
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
