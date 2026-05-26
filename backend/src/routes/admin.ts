import { Router, Response } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service';
import { success, error, paginated } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

// Schemas
const createStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  batchId: z.string().optional(),
  mode: z.enum(['OFFLINE', 'ONLINE']).optional(),
});

const updateStudentSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  batchId: z.string().optional(),
  mode: z.enum(['OFFLINE', 'ONLINE']).optional(),
  isActive: z.boolean().optional(),
});

const createTrainerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  specialization: z.string().optional(),
});

const updateTrainerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z.boolean().optional(),
});

const createCounsellorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const updateCounsellorSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const createBatchSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
});

const updateBatchSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

const createModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().optional(),
});

const updateModuleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
});

const assignTrainerBatchSchema = z.object({
  trainerId: z.string(),
  batchId: z.string(),
});

const assignCounsellorStudentSchema = z.object({
  counsellorId: z.string(),
  studentId: z.string(),
});

const assignModuleBatchSchema = z.object({
  moduleId: z.string(),
  batchId: z.string(),
});

// Dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await adminService.getDashboard();
    success(res, data, 'Dashboard data retrieved');
  } catch (err: any) {
    error(res, err.message);
  }
});

// Students CRUD
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { students, total } = await adminService.getStudents(page, limit);
    paginated(res, students, total, page, limit);
  } catch (err: any) {
    error(res, err.message);
  }
});

router.post('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const student = await adminService.createStudent(parsed.data);
    success(res, student, 'Student created successfully', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.put('/students/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const student = await adminService.updateStudent(req.params.id, parsed.data);
    success(res, student, 'Student updated successfully');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.delete('/students/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await adminService.deleteStudent(req.params.id);
    success(res, result, 'Student deleted');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// Trainers CRUD
router.get('/trainers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { trainers, total } = await adminService.getTrainers(page, limit);
    paginated(res, trainers, total, page, limit);
  } catch (err: any) {
    error(res, err.message);
  }
});

router.post('/trainers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTrainerSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const trainer = await adminService.createTrainer(parsed.data);
    success(res, trainer, 'Trainer created successfully', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.put('/trainers/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateTrainerSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const trainer = await adminService.updateTrainer(req.params.id, parsed.data);
    success(res, trainer, 'Trainer updated successfully');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.delete('/trainers/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await adminService.deleteTrainer(req.params.id);
    success(res, result, 'Trainer deleted');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// Counsellors CRUD
router.get('/counsellors', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { counsellors, total } = await adminService.getCounsellors(page, limit);
    paginated(res, counsellors, total, page, limit);
  } catch (err: any) {
    error(res, err.message);
  }
});

router.post('/counsellors', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createCounsellorSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const counsellor = await adminService.createCounsellor(parsed.data);
    success(res, counsellor, 'Counsellor created successfully', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.put('/counsellors/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateCounsellorSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const counsellor = await adminService.updateCounsellor(req.params.id, parsed.data);
    success(res, counsellor, 'Counsellor updated successfully');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.delete('/counsellors/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await adminService.deleteCounsellor(req.params.id);
    success(res, result, 'Counsellor deleted');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// Batches CRUD
router.get('/batches', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { batches, total } = await adminService.getBatches(page, limit);
    paginated(res, batches, total, page, limit);
  } catch (err: any) {
    error(res, err.message);
  }
});

router.post('/batches', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createBatchSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const batch = await adminService.createBatch(parsed.data);
    success(res, batch, 'Batch created successfully', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.put('/batches/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateBatchSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const batch = await adminService.updateBatch(req.params.id, parsed.data);
    success(res, batch, 'Batch updated successfully');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.delete('/batches/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await adminService.deleteBatch(req.params.id);
    success(res, result, 'Batch deleted');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// Modules CRUD
router.get('/modules', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { modules, total } = await adminService.getModules(page, limit);
    paginated(res, modules, total, page, limit);
  } catch (err: any) {
    error(res, err.message);
  }
});

router.post('/modules', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createModuleSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const mod = await adminService.createModule(parsed.data);
    success(res, mod, 'Module created successfully', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.put('/modules/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateModuleSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const mod = await adminService.updateModule(req.params.id, parsed.data);
    success(res, mod, 'Module updated successfully');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.delete('/modules/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await adminService.deleteModule(req.params.id);
    success(res, result, 'Module deleted');
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

// Assignment routes
router.post('/assign-trainer-batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = assignTrainerBatchSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const result = await adminService.assignTrainerToBatch(parsed.data.trainerId, parsed.data.batchId);
    success(res, result, 'Trainer assigned to batch', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.post('/assign-counsellor-student', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = assignCounsellorStudentSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const result = await adminService.assignCounsellorToStudent(parsed.data.counsellorId, parsed.data.studentId);
    success(res, result, 'Counsellor assigned to student', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

router.post('/assign-module-batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = assignModuleBatchSchema.safeParse(req.body);
    if (!parsed.success) { error(res, parsed.error.errors[0].message, 400); return; }
    const result = await adminService.assignModuleToBatch(parsed.data.moduleId, parsed.data.batchId);
    success(res, result, 'Module assigned to batch', 201);
  } catch (err: any) {
    error(res, err.message, 400);
  }
});

export default router;
