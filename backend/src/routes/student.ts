import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// GET /api/student/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.userId },
      include: {
        batch: true,
        attendances: true,
        marks: true,
      },
    });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    // Get trainer info
    let trainerName = null;
    if (student.batchId) {
      const trainerBatch = await prisma.trainerBatch.findFirst({
        where: { batchId: student.batchId },
        include: { trainer: { include: { user: { select: { name: true } } } } },
      });
      trainerName = trainerBatch?.trainer.user.name || null;
    }

    // Module progress
    let moduleProgress: any[] = [];
    if (student.batchId) {
      const batchModules = await prisma.batchModule.findMany({
        where: { batchId: student.batchId },
        include: { module: true },
      });
      moduleProgress = batchModules.map(bm => ({
        module: bm.module,
        completionPercent: bm.completionPercent,
        status: bm.status,
      }));
    }

    success(res, {
      student: { id: student.id, mode: student.mode },
      batch: student.batch,
      trainerName,
      attendancePercentage,
      moduleProgress,
    });
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/attendance
router.get('/attendance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { lecture: { include: { module: true } } },
      orderBy: { markedAt: 'desc' },
    });

    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    success(res, { attendances, stats: { total, present, absent: total - present, percentage } });
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/marks
router.get('/marks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const marks = await prisma.marks.findMany({
      where: { studentId: student.id },
      include: { module: true },
    });

    // Group by module
    const byModule: Record<string, any> = {};
    for (const m of marks) {
      if (!byModule[m.moduleId]) {
        byModule[m.moduleId] = { module: m.module, theory: [], practical: [], project: [] };
      }
      if (m.type === 'THEORY') byModule[m.moduleId].theory.push(m);
      else if (m.type === 'PRACTICAL') byModule[m.moduleId].practical.push(m);
      else if (m.type === 'PROJECT') byModule[m.moduleId].project.push(m);
    }

    success(res, { marks, byModule: Object.values(byModule) });
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/mock-interviews
router.get('/mock-interviews', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const interviews = await prisma.mockInterview.findMany({
      where: { studentId: student.id },
      include: { trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
    success(res, interviews);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/assignments
router.get('/assignments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const assignments = await prisma.assignment.findMany({
      where: { batchId: student.batchId || undefined },
      include: {
        module: true,
        submissions: { where: { studentId: student.id } },
      },
      orderBy: { dueDate: 'desc' },
    });
    success(res, assignments);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/resources
router.get('/resources', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    if (!student.batchId) { success(res, []); return; }

    const batchModules = await prisma.batchModule.findMany({
      where: { batchId: student.batchId },
      select: { moduleId: true },
    });
    const moduleIds = batchModules.map(bm => bm.moduleId);

    const resources = await prisma.resource.findMany({
      where: { moduleId: { in: moduleIds } },
      include: { module: true },
      orderBy: { uploadedAt: 'desc' },
    });
    success(res, resources);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/lectures
router.get('/lectures', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    if (!student.batchId) { success(res, []); return; }

    const lectures = await prisma.lecture.findMany({
      where: { batchId: student.batchId },
      include: { module: true, trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
    success(res, lectures);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/student/notifications
router.get('/notifications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    success(res, notifications);
  } catch (err: any) {
    error(res, err.message);
  }
});

export default router;
