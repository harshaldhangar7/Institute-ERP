import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';
import { generateQRToken, validateQRToken } from '../services/attendance.service';

const prisma = new PrismaClient();

describe('Attendance Endpoints', () => {
  let trainerToken: string;
  let studentToken: string;
  let studentId: string;
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

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create trainer
    const trainerUser = await prisma.user.create({
      data: { email: 'atttrainer@test.com', password: hashedPassword, name: 'Att Trainer', role: 'TRAINER' },
    });
    const trainer = await prisma.trainer.create({
      data: { userId: trainerUser.id },
    });

    trainerToken = jwt.sign(
      { userId: trainerUser.id, email: trainerUser.email, role: trainerUser.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );

    // Create batch
    const batch = await prisma.batch.create({
      data: { name: 'Attendance Batch', startDate: new Date() },
    });
    batchId = batch.id;

    // Create module
    const mod = await prisma.module.create({
      data: { name: 'Attendance Module', duration: 60 },
    });
    moduleId = mod.id;

    // Create student
    const studentUser = await prisma.user.create({
      data: { email: 'attstudent@test.com', password: hashedPassword, name: 'Att Student', role: 'STUDENT' },
    });
    const student = await prisma.student.create({
      data: { userId: studentUser.id, batchId },
    });
    studentId = student.id;

    studentToken = jwt.sign(
      { userId: studentUser.id, email: studentUser.email, role: studentUser.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );

    // Create lecture with future end time to keep attendance window open
    const now = new Date();
    const endHour = now.getHours() + 1;
    const lecture = await prisma.lecture.create({
      data: {
        batchId,
        moduleId,
        trainerId: trainer.id,
        date: now,
        startTime: `${now.getHours().toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        duration: 60,
      },
    });
    lectureId = lecture.id;
  });

  afterAll(async () => {
    await prisma.attendance.deleteMany();
    await prisma.lecture.deleteMany();
    await prisma.student.deleteMany();
    await prisma.trainer.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.module.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('QR Token Generation and Validation', () => {
    it('should generate a valid QR token', () => {
      const { token, timestamp } = generateQRToken(lectureId);
      expect(token).toBeDefined();
      expect(timestamp).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should validate a fresh token', () => {
      const { token, timestamp } = generateQRToken(lectureId);
      const isValid = validateQRToken(lectureId, token, timestamp);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const isValid = validateQRToken(lectureId, 'invalid-token', timestamp);
      expect(isValid).toBe(false);
    });

    it('should reject an expired token', () => {
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 15; // 15 seconds ago
      const { token } = generateQRToken(lectureId);
      const isValid = validateQRToken(lectureId, token, expiredTimestamp);
      expect(isValid).toBe(false);
    });
  });

  describe('POST /api/attendance/generate-qr', () => {
    it('should generate QR data for a lecture', async () => {
      const res = await request(app)
        .post('/api/attendance/generate-qr')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ lectureId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(res.body.data).toHaveProperty('expiresIn');
    });

    it('should reject without lectureId', async () => {
      const res = await request(app)
        .post('/api/attendance/generate-qr')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/attendance/mark-online', () => {
    it('should mark online attendance with sufficient duration', async () => {
      const res = await request(app)
        .post('/api/attendance/mark-online')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ lectureId, joinDuration: 50 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.method).toBe('ONLINE');
      expect(res.body.data.status).toBe('PRESENT');
    });

    it('should reject duplicate attendance', async () => {
      const res = await request(app)
        .post('/api/attendance/mark-online')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ lectureId, joinDuration: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already marked');
    });
  });

  describe('GET /api/attendance/history/:studentId', () => {
    it('should return attendance history', async () => {
      const res = await request(app)
        .get(`/api/attendance/history/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('attendances');
      expect(res.body.data).toHaveProperty('percentage');
      expect(res.body.data.attendances.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/attendance/batch/:batchId/:lectureId', () => {
    it('should return batch attendance for a lecture', async () => {
      const res = await request(app)
        .get(`/api/attendance/batch/${batchId}/${lectureId}`)
        .set('Authorization', `Bearer ${trainerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('attendances');
      expect(res.body.data).toHaveProperty('totalStudents');
      expect(res.body.data).toHaveProperty('presentCount');
    });
  });
});
