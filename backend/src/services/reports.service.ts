import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';

const prisma = new PrismaClient();

export async function getAttendanceReport(filters: { batchId?: string; studentId?: string; startDate?: string; endDate?: string }) {
  const where: any = {};
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.batchId) where.student = { batchId: filters.batchId };
  if (filters.startDate || filters.endDate) {
    where.lecture = {
      date: {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      },
    };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true } } } },
      lecture: { include: { module: true } },
    },
    orderBy: { markedAt: 'desc' },
  });

  return attendances;
}

export async function getMarksReport(filters: { batchId?: string; moduleId?: string }) {
  const where: any = {};
  if (filters.moduleId) where.moduleId = filters.moduleId;
  if (filters.batchId) where.student = { batchId: filters.batchId };

  const marks = await prisma.marks.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true } } } },
      module: true,
    },
  });

  return marks;
}

export async function getBatchProgressReport(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      batchModules: { include: { module: true } },
      students: { include: { user: { select: { name: true } }, attendances: true, marks: true } },
    },
  });

  if (!batch) throw new Error('Batch not found');

  const studentProgress = batch.students.map(student => {
    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
    const avgMarks = student.marks.length > 0
      ? student.marks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / student.marks.length
      : 0;

    return {
      studentName: student.user.name,
      attendancePercentage,
      avgMarks,
      totalLectures: totalAttendance,
      presentLectures: presentCount,
    };
  });

  return { batch: { id: batch.id, name: batch.name }, modules: batch.batchModules, studentProgress };
}

export async function exportPDF(reportData: any[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    const stream = new PassThrough();

    stream.on('data', (chunk) => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', reject);

    doc.pipe(stream);
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown();

    if (Array.isArray(reportData) && reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      doc.fontSize(8);
      doc.text(headers.join(' | '));
      doc.moveDown(0.5);

      for (const row of reportData) {
        const values = headers.map(h => String(row[h] ?? ''));
        doc.text(values.join(' | '));
      }
    }

    doc.end();
  });
}

export async function exportExcel(reportData: any[], title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);

  if (Array.isArray(reportData) && reportData.length > 0) {
    const headers = Object.keys(reportData[0]);
    sheet.addRow(headers);
    for (const row of reportData) {
      sheet.addRow(headers.map(h => row[h] ?? ''));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
