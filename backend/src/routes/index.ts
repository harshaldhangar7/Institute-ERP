import { Router } from 'express';
import { authenticate, roleGuard } from '../middleware/auth';
import authRoutes from './auth';
import adminRoutes from './admin';
import trainerRoutes from './trainer';
import attendanceRoutes from './attendance';
import evaluationRoutes from './evaluation';
import mockInterviewRoutes from './mock-interview';
import assignmentRoutes from './assignments';
import resourceRoutes from './resources';
import counsellorRoutes from './counsellor';
import studentRoutes from './student';
import notificationRoutes from './notifications';
import reportRoutes from './reports';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Admin only
router.use('/admin', authenticate, roleGuard(['ADMIN']), adminRoutes);

// Trainer only
router.use('/trainer', authenticate, roleGuard(['TRAINER']), trainerRoutes);

// Counsellor only
router.use('/counsellor', authenticate, roleGuard(['COUNSELLOR']), counsellorRoutes);

// Student only
router.use('/student', authenticate, roleGuard(['STUDENT']), studentRoutes);

// Trainer and Student
router.use('/attendance', authenticate, roleGuard(['TRAINER', 'STUDENT']), attendanceRoutes);

// Trainer and Admin
router.use('/evaluation', authenticate, roleGuard(['TRAINER', 'ADMIN']), evaluationRoutes);

// Trainer only
router.use('/mock-interviews', authenticate, roleGuard(['TRAINER']), mockInterviewRoutes);

// Trainer and Student
router.use('/assignments', authenticate, roleGuard(['TRAINER', 'STUDENT']), assignmentRoutes);

// Trainer and Student
router.use('/resources', authenticate, roleGuard(['TRAINER', 'STUDENT']), resourceRoutes);

// All authenticated users
router.use('/notifications', authenticate, notificationRoutes);

// Admin and Trainer
router.use('/reports', authenticate, roleGuard(['ADMIN', 'TRAINER']), reportRoutes);

export default router;
