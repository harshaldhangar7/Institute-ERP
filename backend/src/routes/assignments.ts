import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { upload } from '../middleware/upload';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const gradeSchema = z.object({
  grade: z.string(),
  feedback: z.string().optional(),
});

// POST /api/assignments - create with file upload
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moduleId, batchId, title, description, dueDate } = req.body;
    if (!moduleId || !batchId || !title) {
      error(res, 'moduleId, batchId, and title are required', 400);
      return;
    }

    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const assignment = await prisma.assignment.create({
      data: {
        moduleId,
        batchId,
        trainerId: trainer.id,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        filePath: req.file?.filename,
      },
    });

    success(res, assignment, 'Assignment created', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/assignments/batch/:batchId
router.get('/batch/:batchId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { batchId: req.params.batchId },
      include: { module: true, trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: 'desc' },
    });
    success(res, assignments);
  } catch (err: any) {
    error(res, err.message);
  }
});

// POST /api/assignments/:id/submit - student submission
router.post('/:id/submit', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (!student) { error(res, 'Student profile not found', 404); return; }

    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) { error(res, 'Assignment not found', 404); return; }

    const submission = await prisma.submission.create({
      data: {
        assignmentId: req.params.id,
        studentId: student.id,
        filePath: req.file?.filename,
      },
    });

    success(res, submission, 'Assignment submitted', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/assignments/:id/submissions - trainer view
router.get('/:id/submissions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: req.params.id },
      include: { student: { include: { user: { select: { name: true, email: true } } } } },
    });
    success(res, submissions);
  } catch (err: any) {
    error(res, err.message);
  }
});

// PUT /api/assignments/submissions/:id/grade
router.put('/submissions/:id/grade', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = gradeSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { grade: parsed.data.grade, feedback: parsed.data.feedback },
    });

    success(res, submission, 'Submission graded');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

export default router;
