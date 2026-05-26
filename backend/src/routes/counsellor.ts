import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import * as counsellorService from '../services/counsellor.service';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

const recordPaymentSchema = z.object({
  feeId: z.string(),
  amount: z.number().positive(),
  method: z.string(),
});

const followUpSchema = z.object({
  studentId: z.string(),
  note: z.string().min(1),
});

// GET /api/counsellor/students
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counsellor = await prisma.counsellor.findUnique({ where: { userId: req.user!.userId } });
    if (!counsellor) { error(res, 'Counsellor profile not found', 404); return; }

    const students = await counsellorService.getAssignedStudents(counsellor.id);
    success(res, students);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/counsellor/students/:id/fees
router.get('/students/:id/fees', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fees = await counsellorService.getStudentFees(req.params.id);
    success(res, fees);
  } catch (err: any) {
    error(res, err.message);
  }
});

// POST /api/counsellor/fees/payment
router.post('/fees/payment', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = recordPaymentSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const payment = await counsellorService.recordPayment(parsed.data.feeId, parsed.data.amount, parsed.data.method);
    success(res, payment, 'Payment recorded', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/counsellor/alerts
router.get('/alerts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counsellor = await prisma.counsellor.findUnique({ where: { userId: req.user!.userId } });
    if (!counsellor) { error(res, 'Counsellor profile not found', 404); return; }

    const alerts = await counsellorService.getAlerts(counsellor.id);
    success(res, alerts);
  } catch (err: any) {
    error(res, err.message);
  }
});

// POST /api/counsellor/follow-ups
router.post('/follow-ups', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = followUpSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }

    const counsellor = await prisma.counsellor.findUnique({ where: { userId: req.user!.userId } });
    if (!counsellor) { error(res, 'Counsellor profile not found', 404); return; }

    const result = await counsellorService.addFollowUp(counsellor.id, parsed.data.studentId, parsed.data.note);
    success(res, result, 'Follow-up added', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// GET /api/counsellor/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counsellor = await prisma.counsellor.findUnique({ where: { userId: req.user!.userId } });
    if (!counsellor) { error(res, 'Counsellor profile not found', 404); return; }

    const dashboard = await counsellorService.getDashboard(counsellor.id);
    success(res, dashboard);
  } catch (err: any) {
    error(res, err.message);
  }
});

export default router;
