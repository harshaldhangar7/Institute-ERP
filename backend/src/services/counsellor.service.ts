import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAssignedStudents(counsellorId: string) {
  const counsellor = await prisma.counsellor.findUnique({ where: { id: counsellorId } });
  if (!counsellor) throw new Error('Counsellor not found');

  const students = await prisma.student.findMany({
    where: { counsellorId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      batch: true,
      attendances: true,
      marks: true,
    },
  });

  return students.map(student => {
    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
    const avgMarks = student.marks.length > 0
      ? student.marks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / student.marks.length
      : 0;

    return {
      ...student,
      attendancePercentage,
      avgMarks,
      attendances: undefined,
      marks: undefined,
    };
  });
}

export async function getStudentFees(studentId: string) {
  const fees = await prisma.fee.findMany({
    where: { studentId },
    include: { payments: true },
  });
  return fees;
}

export async function recordPayment(feeId: string, amount: number, method: string) {
  const fee = await prisma.fee.findUnique({ where: { id: feeId } });
  if (!fee) throw new Error('Fee record not found');

  const payment = await prisma.feePayment.create({
    data: { feeId, amount, method },
  });

  const newPaid = fee.paidAmount + amount;
  const newPending = fee.totalAmount - newPaid;

  await prisma.fee.update({
    where: { id: feeId },
    data: {
      paidAmount: newPaid,
      pendingAmount: newPending,
      status: newPending <= 0 ? 'PAID' : 'PARTIAL',
    },
  });

  return payment;
}

export async function getAlerts(counsellorId: string) {
  const students = await prisma.student.findMany({
    where: { counsellorId },
    include: {
      user: { select: { name: true, email: true } },
      attendances: true,
      marks: true,
      batch: true,
    },
  });

  const alerts: any[] = [];

  for (const student of students) {
    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    if (attendancePercentage < 75 && totalAttendance > 0) {
      alerts.push({
        type: 'LOW_ATTENDANCE',
        studentId: student.id,
        studentName: student.user.name,
        value: attendancePercentage,
        message: `Attendance below 75%: ${attendancePercentage.toFixed(1)}%`,
      });
    }

    const avgMarks = student.marks.length > 0
      ? student.marks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / student.marks.length
      : null;

    if (avgMarks !== null && avgMarks < 40) {
      alerts.push({
        type: 'POOR_PERFORMANCE',
        studentId: student.id,
        studentName: student.user.name,
        value: avgMarks,
        message: `Average marks below 40%: ${avgMarks.toFixed(1)}%`,
      });
    }
  }

  return alerts;
}

export async function addFollowUp(counsellorId: string, studentId: string, note: string) {
  // Store follow-ups as notifications to the student
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error('Student not found');

  const notification = await prisma.notification.create({
    data: {
      userId: student.userId,
      title: 'Counsellor Follow-up',
      message: note,
      type: 'FOLLOW_UP',
    },
  });

  return notification;
}

export async function getDashboard(counsellorId: string) {
  const students = await prisma.student.findMany({
    where: { counsellorId },
    include: {
      user: { select: { name: true, isActive: true } },
      attendances: true,
      marks: true,
      fees: true,
    },
  });

  const activeStudents = students.filter(s => s.user.isActive).length;
  const totalFees = students.reduce((sum, s) => sum + s.fees.reduce((fs, f) => fs + f.totalAmount, 0), 0);
  const collectedFees = students.reduce((sum, s) => sum + s.fees.reduce((fs, f) => fs + f.paidAmount, 0), 0);

  const atRiskStudents = students.filter(s => {
    const totalAttendance = s.attendances.length;
    const presentCount = s.attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;
    const avgMarks = s.marks.length > 0
      ? s.marks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / s.marks.length
      : 100;
    return attendancePercentage < 75 || avgMarks < 40;
  }).length;

  return {
    activeStudents,
    totalStudents: students.length,
    totalFees,
    collectedFees,
    pendingFees: totalFees - collectedFees,
    atRiskStudents,
  };
}
