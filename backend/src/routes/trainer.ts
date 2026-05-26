import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const createLectureSchema = z.object({
  batchId: z.string(),
  moduleId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  topics: z.string().optional(),
});

// GET /api/trainer/batches - assigned batches
router.get('/batches', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const trainerBatches = await prisma.trainerBatch.findMany({
      where: { trainerId: trainer.id },
      include: { batch: { include: { _count: { select: { students: true } } } } },
    });

    success(res, trainerBatches.map(tb => tb.batch));
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/trainer/batches/:id/students - student overview with snapshot
router.get('/batches/:id/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      where: { batchId: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        attendances: true,
        marks: true,
      },
    });

    const snapshot = students.map(student => {
      const totalAttendance = student.attendances.length;
      const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
      const avgMarks = student.marks.length > 0
        ? student.marks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / student.marks.length
        : 0;

      return {
        id: student.id,
        user: student.user,
        mode: student.mode,
        attendancePercentage,
        avgMarks,
        totalLectures: totalAttendance,
        presentLectures: presentCount,
      };
    });

    success(res, snapshot);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/trainer/batches/:id/modules
router.get('/batches/:id/modules', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batchModules = await prisma.batchModule.findMany({
      where: { batchId: req.params.id },
      include: { module: true },
    });
    success(res, batchModules);
  } catch (err: any) {
    error(res, err.message);
  }
});

// POST /api/trainer/lectures - start a lecture
router.post('/lectures', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createLectureSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const lecture = await prisma.lecture.create({
      data: {
        batchId: parsed.data.batchId,
        moduleId: parsed.data.moduleId,
        trainerId: trainer.id,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        topics: parsed.data.topics,
      },
    });

    success(res, lecture, 'Lecture started', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// PUT /api/trainer/lectures/:id/end - end a lecture
router.put('/lectures/:id/end', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lecture = await prisma.lecture.findUnique({ where: { id: req.params.id } });
    if (!lecture) { error(res, 'Lecture not found', 404); return; }

    // Calculate duration in minutes
    const [startH, startM] = lecture.startTime.split(':').map(Number);
    const now = new Date();
    const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const duration = (now.getHours() * 60 + now.getMinutes()) - (startH * 60 + startM);

    const updated = await prisma.lecture.update({
      where: { id: req.params.id },
      data: { endTime, duration: duration > 0 ? duration : undefined },
    });

    success(res, updated, 'Lecture ended');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/trainer/lectures - lecture history
router.get('/lectures', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const lectures = await prisma.lecture.findMany({
      where: { trainerId: trainer.id },
      include: { batch: true, module: true, _count: { select: { attendances: true } } },
      orderBy: { date: 'desc' },
    });

    success(res, lectures);
  } catch (err: any) {
    error(res, err.message);
  }
});

export default router;
