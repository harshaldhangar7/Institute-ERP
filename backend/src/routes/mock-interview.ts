import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const createMockInterviewSchema = z.object({
  studentId: z.string(),
  date: z.string(),
  communication: z.number().min(0).max(10).optional(),
  technical: z.number().min(0).max(10).optional(),
  confidence: z.number().min(0).max(10).optional(),
  feedback: z.string().optional(),
});

// POST /api/mock-interviews
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createMockInterviewSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const { communication, technical, confidence } = parsed.data;
    const scores = [communication, technical, confidence].filter(s => s !== undefined) as number[];
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;

    const interview = await prisma.mockInterview.create({
      data: {
        studentId: parsed.data.studentId,
        trainerId: trainer.id,
        date: new Date(parsed.data.date),
        communication,
        technical,
        confidence,
        overallScore,
        feedback: parsed.data.feedback,
      },
    });

    success(res, interview, 'Mock interview evaluation created', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/mock-interviews/:studentId
router.get('/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviews = await prisma.mockInterview.findMany({
      where: { studentId: req.params.studentId },
      include: { trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
    success(res, interviews);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/mock-interviews/batch/:batchId
router.get('/batch/:batchId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviews = await prisma.mockInterview.findMany({
      where: { student: { batchId: req.params.batchId } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        trainer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    });
    success(res, interviews);
  } catch (err: any) {
    error(res, err.message);
  }
});

export default router;
