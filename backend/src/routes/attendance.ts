import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import * as attendanceService from '../services/attendance.service';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const markQRSchema = z.object({
  lectureId: z.string(),
  token: z.string(),
  timestamp: z.number(),
});

const markOnlineSchema = z.object({
  lectureId: z.string(),
  joinDuration: z.number(),
});

// POST /api/attendance/generate-qr
router.post('/generate-qr', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only trainers can generate QR codes
    if (req.user!.role !== 'TRAINER') {
      error(res, 'Only trainers can generate QR codes', 403);
      return;
    }

    const { lectureId } = req.body;
    if (!lectureId) { error(res, 'lectureId is required', 400); return; }

    // Verify trainer owns this lecture
    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
    if (!lecture) { error(res, 'Lecture not found', 404); return; }

    if (lecture.trainerId !== trainer.id) {
      error(res, 'You do not own this lecture', 403);
      return;
    }

    const qrData = await attendanceService.generateQR(lectureId);
    success(res, qrData, 'QR generated');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// POST /api/attendance/mark-qr
router.post('/mark-qr', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = markQRSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const attendance = await attendanceService.markQRAttendance(
      student.id, parsed.data.lectureId, parsed.data.token, parsed.data.timestamp
    );
    success(res, attendance, 'Attendance marked via QR');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// POST /api/attendance/mark-online
router.post('/mark-online', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = markOnlineSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const attendance = await attendanceService.markOnlineAttendance(
      student.id, parsed.data.lectureId, parsed.data.joinDuration
    );
    success(res, attendance, 'Online attendance marked');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/attendance/history/:studentId
router.get('/history/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await attendanceService.getAttendanceHistory(req.params.studentId);
    success(res, data);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/attendance/batch/:batchId/:lectureId
router.get('/batch/:batchId/:lectureId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await attendanceService.getBatchAttendance(req.params.batchId, req.params.lectureId);
    success(res, data);
  } catch (err: any) {
    error(res, err.message);
  }
});

export default router;
