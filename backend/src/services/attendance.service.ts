import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const HMAC_SECRET = process.env.QR_HMAC_SECRET || 'qr-hmac-secret-key';
const QR_TOKEN_VALIDITY_SECONDS = 10;
const ATTENDANCE_WINDOW_MINUTES = 5;

export function generateQRToken(lectureId: string): { token: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${lectureId}:${timestamp}`;
  const token = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
  return { token, timestamp };
}

export function validateQRToken(lectureId: string, token: string, timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  // Token must not be older than QR_TOKEN_VALIDITY_SECONDS
  if (age > QR_TOKEN_VALIDITY_SECONDS) {
    return false;
  }

  const expectedData = `${lectureId}:${timestamp}`;
  const expectedToken = crypto.createHmac('sha256', HMAC_SECRET).update(expectedData).digest('hex');

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

export async function generateQR(lectureId: string) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture) throw new Error('Lecture not found');

  const { token, timestamp } = generateQRToken(lectureId);

  // Store session token on lecture
  await prisma.lecture.update({
    where: { id: lectureId },
    data: { sessionToken: token },
  });

  return { lectureId, token, timestamp, expiresIn: QR_TOKEN_VALIDITY_SECONDS };
}

export async function markQRAttendance(studentId: string, lectureId: string, token: string, timestamp: number) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture) throw new Error('Lecture not found');

  // Validate the QR token
  if (!validateQRToken(lectureId, token, timestamp)) {
    throw new Error('Invalid or expired QR token');
  }

  // Check time window - must be within ATTENDANCE_WINDOW_MINUTES after lecture end
  const now = new Date();
  const lectureDate = new Date(lecture.date);
  const [endHour, endMin] = lecture.endTime.split(':').map(Number);
  const lectureEnd = new Date(lectureDate);
  lectureEnd.setHours(endHour, endMin, 0, 0);
  const windowEnd = new Date(lectureEnd.getTime() + ATTENDANCE_WINDOW_MINUTES * 60 * 1000);

  if (now > windowEnd) {
    throw new Error('Attendance window has closed');
  }

  // Check if already marked
  const existing = await prisma.attendance.findUnique({
    where: { studentId_lectureId: { studentId, lectureId } },
  });
  if (existing) throw new Error('Attendance already marked');

  const attendance = await prisma.attendance.create({
    data: { studentId, lectureId, status: 'PRESENT', method: 'QR' },
  });
  return attendance;
}

export async function markOnlineAttendance(studentId: string, lectureId: string, joinDuration: number) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture) throw new Error('Lecture not found');

  // Validate duration threshold - student must have been present at least 70% of lecture duration
  const lectureDuration = lecture.duration || 60; // default 60 min
  const threshold = lectureDuration * 0.7;

  if (joinDuration < threshold) {
    throw new Error(`Insufficient attendance duration. Required: ${threshold} minutes, attended: ${joinDuration} minutes`);
  }

  // Check if already marked
  const existing = await prisma.attendance.findUnique({
    where: { studentId_lectureId: { studentId, lectureId } },
  });
  if (existing) throw new Error('Attendance already marked');

  const attendance = await prisma.attendance.create({
    data: { studentId, lectureId, status: 'PRESENT', method: 'ONLINE' },
  });
  return attendance;
}

export async function getAttendanceHistory(studentId: string) {
  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: { lecture: { include: { module: true, batch: true } } },
    orderBy: { markedAt: 'desc' },
  });

  const totalLectures = await prisma.lecture.count({
    where: { batch: { students: { some: { id: studentId } } } },
  });

  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
  const percentage = totalLectures > 0 ? (presentCount / totalLectures) * 100 : 0;

  return { attendances, totalLectures, presentCount, percentage };
}

export async function getBatchAttendance(batchId: string, lectureId: string) {
  const attendances = await prisma.attendance.findMany({
    where: { lectureId, student: { batchId } },
    include: { student: { include: { user: { select: { name: true, email: true } } } } },
  });

  const totalStudents = await prisma.student.count({ where: { batchId } });
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;

  return { attendances, totalStudents, presentCount };
}
