import { Router, Response } from 'express';
import * as reportsService from '../services/reports.service';
import { success, error } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

// GET /api/reports/attendance
router.get('/attendance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId, studentId, startDate, endDate } = req.query as Record<string, string>;
    const data = await reportsService.getAttendanceReport({ batchId, studentId, startDate, endDate });
    success(res, data);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/reports/marks
router.get('/marks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId, moduleId } = req.query as Record<string, string>;
    const data = await reportsService.getMarksReport({ batchId, moduleId });
    success(res, data);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/reports/batch-progress
router.get('/batch-progress', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.query as Record<string, string>;
    if (!batchId) { error(res, 'batchId is required', 400); return; }
    const data = await reportsService.getBatchProgressReport(batchId);
    success(res, data);
  } catch (err: any) {
    error(res, err.message);
  }
});

// GET /api/reports/export/:type - export as PDF or Excel
router.get('/export/:type', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const { report, batchId, moduleId, studentId, startDate, endDate } = req.query as Record<string, string>;

    if (!report) { error(res, 'report query param is required (attendance, marks, batch-progress)', 400); return; }

    let reportData: any[];
    let title: string;

    switch (report) {
      case 'attendance':
        reportData = await reportsService.getAttendanceReport({ batchId, studentId, startDate, endDate });
        title = 'Attendance Report';
        break;
      case 'marks':
        reportData = await reportsService.getMarksReport({ batchId, moduleId });
        title = 'Marks Report';
        break;
      case 'batch-progress':
        if (!batchId) { error(res, 'batchId required for batch-progress report', 400); return; }
        const batchReport = await reportsService.getBatchProgressReport(batchId);
        reportData = batchReport.studentProgress;
        title = `Batch Progress - ${batchReport.batch.name}`;
        break;
      default:
        error(res, 'Invalid report type', 400);
        return;
    }

    if (type === 'pdf') {
      const buffer = await reportsService.exportPDF(reportData, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
      res.send(buffer);
    } else if (type === 'excel') {
      const buffer = await reportsService.exportExcel(reportData, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${title}.xlsx"`);
      res.send(buffer);
    } else {
      error(res, 'Invalid export type. Use pdf or excel', 400);
    }
  } catch (err: any) {
    error(res, err.message);
  }
});

export default router;
