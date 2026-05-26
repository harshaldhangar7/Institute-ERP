import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const addMarksSchema = z.object({
  studentId: z.string(),
  moduleId: z.string(),
  type: z.enum(['THEORY', 'PRACTICAL', 'PROJECT']),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  remarks: z.string().optional(),
});

const updateMarksSchema = z.object({
  score: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

// POST /api/evaluation/marks
router.post('/marks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = addMarksSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const marks = await prisma.marks.create({ data: parsed.data });
    success(res, marks, 'Marks added', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/evaluation/marks/:studentId
router.get('/marks/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const marks = await prisma.marks.findMany({
      where: { studentId: req.params.studentId },
      include: { module: true },
    });
    success(res, marks);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/evaluation/marks/batch/:batchId
router.get('/marks/batch/:batchId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const marks = await prisma.marks.findMany({
      where: { student: { batchId: req.params.batchId } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        module: true,
      },
    });
    success(res, marks);
  } catch (err: any) {
    error(res, err.message);
  }
});

// PUT /api/evaluation/marks/:id
router.put('/marks/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateMarksSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const marks = await prisma.marks.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    success(res, marks, 'Marks updated');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

export default router;
