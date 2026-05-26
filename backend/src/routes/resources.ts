import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { upload } from '../middleware/upload';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// POST /api/resources - upload resource
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moduleId, title } = req.body;
    if (!moduleId || !title) {
      error(res, 'moduleId and title are required', 400);
      return;
    }

    const trainer = await prisma.trainer.findUnique({ where: { userId: req.user!.userId } });
    if (!trainer) { error(res, 'Trainer profile not found', 404); return; }

    const resource = await prisma.resource.create({
      data: {
        moduleId,
        trainerId: trainer.id,
        title,
        filePath: req.file?.filename,
      },
    });

    success(res, resource, 'Resource uploaded', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/resources/module/:moduleId
router.get('/module/:moduleId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resources = await prisma.resource.findMany({
      where: { moduleId: req.params.moduleId },
      include: { trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { uploadedAt: 'desc' },
    });
    success(res, resources);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/resources/batch/:batchId
router.get('/batch/:batchId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batchModules = await prisma.batchModule.findMany({
      where: { batchId: req.params.batchId },
      select: { moduleId: true },
    });
    const moduleIds = batchModules.map(bm => bm.moduleId);

    const resources = await prisma.resource.findMany({
      where: { moduleId: { in: moduleIds } },
      include: { module: true, trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { uploadedAt: 'desc' },
    });
    success(res, resources);
  } catch (err: any) {
    error(res, err.message);
  }
});

// DELETE /api/resources/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) { error(res, 'Resource not found', 404); return; }

    await prisma.resource.delete({ where: { id: req.params.id } });
    success(res, null, 'Resource deleted');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

export default router;
