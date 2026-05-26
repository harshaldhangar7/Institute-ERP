import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const announceSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetRole: z.string().optional(),
  batchId: z.string().optional(),
});

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
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

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) { error(res, 'Notification not found', 404); return; }
    if (notification.userId !== req.user!.userId) { error(res, 'Access denied', 403); return; }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    success(res, updated, 'Notification marked as read');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// POST /api/notifications/announce - admin/trainer only
router.post('/announce', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!['ADMIN', 'TRAINER'].includes(req.user!.role)) {
      error(res, 'Only admins and trainers can create announcements', 403);
      return;
    }

    const parsed = announceSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const announcement = await prisma.announcement.create({
      data: {
        createdById: req.user!.userId,
        title: parsed.data.title,
        message: parsed.data.message,
        targetRole: parsed.data.targetRole,
        batchId: parsed.data.batchId,
      },
    });

    // Create notifications for targeted users
    let targetWhere: any = {};
    if (parsed.data.targetRole) targetWhere.role = parsed.data.targetRole;
    if (parsed.data.batchId) {
      const students = await prisma.student.findMany({
        where: { batchId: parsed.data.batchId },
        select: { userId: true },
      });
      targetWhere.id = { in: students.map(s => s.userId) };
    }

    const targetUsers = await prisma.user.findMany({ where: targetWhere, select: { id: true } });

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map(u => ({
          userId: u.id,
          title: parsed.data.title,
          message: parsed.data.message,
          type: 'ANNOUNCEMENT',
        })),
      });
    }

    success(res, announcement, 'Announcement created', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

export default router;
