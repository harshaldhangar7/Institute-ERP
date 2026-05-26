import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, roleGuard } from '../middleware/auth';
import * as authService from '../services/auth.service';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'TRAINER', 'COUNSELLOR', 'STUDENT']),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// POST /api/auth/register - Admin-only user creation
router.post(
  '/register',
  authenticate,
  roleGuard(['ADMIN']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        error(res, parsed.error.errors[0].message, 400);
        return;
      }

      const user = await authService.registerUser(parsed.data);
      success(res, user, 'User registered successfully', 201);
    } catch (err: any) {
      error(res, err.message, 400);
    }
  }
);

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors[0].message, 400);
      return;
    }

    const result = await authService.loginUser(parsed.data);
    success(res, result, 'Login successful');
  } catch (err: any) {
    error(res, err.message, 401);
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await authService.getUserProfile(req.user!.userId);
    success(res, user);
  } catch (err: any) {
    error(res, err.message, 404);
  }
});

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        error(res, parsed.error.errors[0].message, 400);
        return;
      }

      const result = await authService.changePassword(req.user!.userId, parsed.data);
      success(res, result, 'Password changed successfully');
    } catch (err: any) {
      error(res, err.message, 400);
    }
  }
);

export default router;
