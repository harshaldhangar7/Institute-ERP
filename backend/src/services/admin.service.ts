import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Students CRUD
export async function getStudents(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [students, total] = await Promise.all([
    prisma.student.findMany({
      skip: offset,
      take: limit,
      include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } }, batch: true },
    }),
    prisma.student.count(),
  ]);
  return { students, total };
}

export async function createStudent(data: { email: string; password: string; name: string; phone?: string; batchId?: string; mode?: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { email: data.email, password: hashedPassword, name: data.name, role: 'STUDENT', phone: data.phone },
  });
  const student = await prisma.student.create({
    data: { userId: user.id, batchId: data.batchId, mode: data.mode || 'OFFLINE' },
    include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
  });
  return student;
}

export async function updateStudent(id: string, data: { name?: string; phone?: string; batchId?: string; mode?: string; isActive?: boolean }) {
  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) throw new Error('Student not found');

  if (data.name || data.phone || data.isActive !== undefined) {
    await prisma.user.update({
      where: { id: student.userId },
      data: { name: data.name, phone: data.phone, isActive: data.isActive },
    });
  }
  const updated = await prisma.student.update({
    where: { id },
    data: { batchId: data.batchId, mode: data.mode },
    include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } }, batch: true },
  });
  return updated;
}

export async function deleteStudent(id: string) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new Error('Student not found');
  await prisma.student.delete({ where: { id } });
  await prisma.user.delete({ where: { id: student.userId } });
  return { message: 'Student deleted successfully' };
}

// Trainers CRUD
export async function getTrainers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [trainers, total] = await Promise.all([
    prisma.trainer.findMany({
      skip: offset,
      take: limit,
      include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
    }),
    prisma.trainer.count(),
  ]);
  return { trainers, total };
}

export async function createTrainer(data: { email: string; password: string; name: string; phone?: string; specialization?: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { email: data.email, password: hashedPassword, name: data.name, role: 'TRAINER', phone: data.phone },
  });
  const trainer = await prisma.trainer.create({
    data: { userId: user.id, specialization: data.specialization },
    include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
  });
  return trainer;
}

export async function updateTrainer(id: string, data: { name?: string; phone?: string; specialization?: string; isActive?: boolean }) {
  const trainer = await prisma.trainer.findUnique({ where: { id }, include: { user: true } });
  if (!trainer) throw new Error('Trainer not found');

  if (data.name || data.phone || data.isActive !== undefined) {
    await prisma.user.update({
      where: { id: trainer.userId },
      data: { name: data.name, phone: data.phone, isActive: data.isActive },
    });
  }
  const updated = await prisma.trainer.update({
    where: { id },
    data: { specialization: data.specialization },
    include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
  });
  return updated;
}

export async function deleteTrainer(id: string) {
  const trainer = await prisma.trainer.findUnique({ where: { id } });
  if (!trainer) throw new Error('Trainer not found');
  await prisma.trainer.delete({ where: { id } });
  await prisma.user.delete({ where: { id: trainer.userId } });
  return { message: 'Trainer deleted successfully' };
}

// Counsellors CRUD
export async function getCounsellors(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [counsellors, total] = await Promise.all([
    prisma.counsellor.findMany({
      skip: offset,
      take: limit,
      include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
    }),
    prisma.counsellor.count(),
  ]);
  return { counsellors, total };
}

export async function createCounsellor(data: { email: string; password: string; name: string; phone?: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { email: data.email, password: hashedPassword, name: data.name, role: 'COUNSELLOR', phone: data.phone },
  });
  const counsellor = await prisma.counsellor.create({
    data: { userId: user.id },
    include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
  });
  return counsellor;
}

export async function updateCounsellor(id: string, data: { name?: string; phone?: string; isActive?: boolean }) {
  const counsellor = await prisma.counsellor.findUnique({ where: { id }, include: { user: true } });
  if (!counsellor) throw new Error('Counsellor not found');

  await prisma.user.update({
    where: { id: counsellor.userId },
    data: { name: data.name, phone: data.phone, isActive: data.isActive },
  });
  const updated = await prisma.counsellor.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true, phone: true, isActive: true } } },
  });
  return updated;
}

export async function deleteCounsellor(id: string) {
  const counsellor = await prisma.counsellor.findUnique({ where: { id } });
  if (!counsellor) throw new Error('Counsellor not found');
  await prisma.counsellor.delete({ where: { id } });
  await prisma.user.delete({ where: { id: counsellor.userId } });
  return { message: 'Counsellor deleted successfully' };
}

// Batches CRUD
export async function getBatches(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [batches, total] = await Promise.all([
    prisma.batch.findMany({ skip: offset, take: limit, include: { _count: { select: { students: true } } } }),
    prisma.batch.count(),
  ]);
  return { batches, total };
}

export async function createBatch(data: { name: string; startDate: string; endDate?: string }) {
  const batch = await prisma.batch.create({
    data: { name: data.name, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : undefined },
  });
  return batch;
}

export async function updateBatch(id: string, data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }) {
  const batch = await prisma.batch.findUnique({ where: { id } });
  if (!batch) throw new Error('Batch not found');
  const updated = await prisma.batch.update({
    where: { id },
    data: {
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isActive: data.isActive,
    },
  });
  return updated;
}

export async function deleteBatch(id: string) {
  const batch = await prisma.batch.findUnique({ where: { id } });
  if (!batch) throw new Error('Batch not found');
  await prisma.batch.delete({ where: { id } });
  return { message: 'Batch deleted successfully' };
}

// Modules CRUD
export async function getModules(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [modules, total] = await Promise.all([
    prisma.module.findMany({ skip: offset, take: limit }),
    prisma.module.count(),
  ]);
  return { modules, total };
}

export async function createModule(data: { name: string; description?: string; duration?: number }) {
  const module = await prisma.module.create({ data });
  return module;
}

export async function updateModule(id: string, data: { name?: string; description?: string; duration?: number }) {
  const mod = await prisma.module.findUnique({ where: { id } });
  if (!mod) throw new Error('Module not found');
  const updated = await prisma.module.update({ where: { id }, data });
  return updated;
}

export async function deleteModule(id: string) {
  const mod = await prisma.module.findUnique({ where: { id } });
  if (!mod) throw new Error('Module not found');
  await prisma.module.delete({ where: { id } });
  return { message: 'Module deleted successfully' };
}

// Assignments
export async function assignTrainerToBatch(trainerId: string, batchId: string) {
  const existing = await prisma.trainerBatch.findUnique({ where: { trainerId_batchId: { trainerId, batchId } } });
  if (existing) throw new Error('Trainer already assigned to this batch');
  const assignment = await prisma.trainerBatch.create({ data: { trainerId, batchId } });
  return assignment;
}

export async function assignCounsellorToStudent(counsellorId: string, studentId: string) {
  const existing = await prisma.counsellorStudent.findUnique({
    where: { counsellorId_studentId: { counsellorId, studentId } },
  });
  if (existing) throw new Error('Counsellor already assigned to this student');
  await prisma.student.update({ where: { id: studentId }, data: { counsellorId } });
  const assignment = await prisma.counsellorStudent.create({ data: { counsellorId, studentId } });
  return assignment;
}

export async function assignModuleToBatch(moduleId: string, batchId: string) {
  const existing = await prisma.batchModule.findUnique({ where: { batchId_moduleId: { batchId, moduleId } } });
  if (existing) throw new Error('Module already assigned to this batch');
  const assignment = await prisma.batchModule.create({ data: { batchId, moduleId } });
  return assignment;
}

// Dashboard
export async function getDashboard() {
  const [totalStudents, activeBatches, totalTrainers, totalCounsellors] = await Promise.all([
    prisma.student.count(),
    prisma.batch.count({ where: { isActive: true } }),
    prisma.trainer.count(),
    prisma.counsellor.count(),
  ]);

  const attendanceRecords = await prisma.attendance.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const attendanceOverview = {
    present: attendanceRecords.find(r => r.status === 'PRESENT')?._count.id || 0,
    absent: attendanceRecords.find(r => r.status === 'ABSENT')?._count.id || 0,
    late: attendanceRecords.find(r => r.status === 'LATE')?._count.id || 0,
  };

  const fees = await prisma.fee.aggregate({
    _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
  });

  const feeCollectionStatus = {
    totalAmount: fees._sum.totalAmount || 0,
    paidAmount: fees._sum.paidAmount || 0,
    pendingAmount: fees._sum.pendingAmount || 0,
  };

  return {
    totalStudents,
    activeBatches,
    totalTrainers,
    totalCounsellors,
    attendanceOverview,
    feeCollectionStatus,
  };
}
