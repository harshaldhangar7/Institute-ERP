import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('admin123', 10);
  const trainerPassword = await bcrypt.hash('trainer123', 10);
  const counsellorPassword = await bcrypt.hash('counsellor123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@institute.com' },
    update: {},
    create: {
      email: 'admin@institute.com',
      password: password,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '9000000001',
    },
  });
  console.log('Created admin:', admin.email);

  // Create 3 trainers
  const trainerData = [
    { email: 'trainer1@institute.com', name: 'Rajesh Kumar', specialization: 'Full Stack Development' },
    { email: 'trainer2@institute.com', name: 'Priya Sharma', specialization: 'Frontend & UI/UX' },
    { email: 'trainer3@institute.com', name: 'Amit Patel', specialization: 'Backend & DevOps' },
  ];

  const trainers = [];
  for (let i = 0; i < trainerData.length; i++) {
    const td = trainerData[i];
    const trainerUser = await prisma.user.upsert({
      where: { email: td.email },
      update: {},
      create: {
        email: td.email,
        password: trainerPassword,
        name: td.name,
        role: 'TRAINER',
        phone: `900000010${i + 1}`,
      },
    });
    const trainer = await prisma.trainer.upsert({
      where: { userId: trainerUser.id },
      update: {},
      create: {
        userId: trainerUser.id,
        specialization: td.specialization,
      },
    });
    trainers.push(trainer);
  }
  console.log('Created 3 trainers');

  // Create 2 counsellors
  const counsellorData = [
    { email: 'counsellor1@institute.com', name: 'Sunita Reddy' },
    { email: 'counsellor2@institute.com', name: 'Deepak Verma' },
  ];

  const counsellors = [];
  for (let i = 0; i < counsellorData.length; i++) {
    const cd = counsellorData[i];
    const counsellorUser = await prisma.user.upsert({
      where: { email: cd.email },
      update: {},
      create: {
        email: cd.email,
        password: counsellorPassword,
        name: cd.name,
        role: 'COUNSELLOR',
        phone: `900000020${i + 1}`,
      },
    });
    const counsellor = await prisma.counsellor.upsert({
      where: { userId: counsellorUser.id },
      update: {},
      create: {
        userId: counsellorUser.id,
      },
    });
    counsellors.push(counsellor);
  }
  console.log('Created 2 counsellors');

  // Create 4 batches
  const batchData = [
    { id: 'batch-fswd-2024-01', name: 'Full Stack Web Dev - Batch 1', startDate: new Date('2024-01-15'), endDate: new Date('2024-07-15') },
    { id: 'batch-fswd-2024-02', name: 'Full Stack Web Dev - Batch 2', startDate: new Date('2024-03-01'), endDate: new Date('2024-09-01') },
    { id: 'batch-data-2024-01', name: 'Data Science - Batch 1', startDate: new Date('2024-02-01'), endDate: new Date('2024-08-01') },
    { id: 'batch-mobile-2024-01', name: 'Mobile App Dev - Batch 1', startDate: new Date('2024-04-01'), endDate: new Date('2024-10-01') },
  ];

  const batches = [];
  for (const bd of batchData) {
    const batch = await prisma.batch.upsert({
      where: { id: bd.id },
      update: {},
      create: {
        id: bd.id,
        name: bd.name,
        startDate: bd.startDate,
        endDate: bd.endDate,
        isActive: true,
      },
    });
    batches.push(batch);
  }
  console.log('Created 4 batches');

  // Create 8 modules
  const moduleData = [
    { id: 'module-html-css', name: 'HTML & CSS', description: 'Fundamentals of web markup and styling', duration: 30 },
    { id: 'module-javascript', name: 'JavaScript', description: 'Core JavaScript programming concepts', duration: 45 },
    { id: 'module-react', name: 'React.js', description: 'Building modern UIs with React', duration: 40 },
    { id: 'module-nodejs', name: 'Node.js & Express', description: 'Server-side JavaScript with Node.js', duration: 35 },
    { id: 'module-database', name: 'Database & SQL', description: 'Relational databases and query optimization', duration: 30 },
    { id: 'module-typescript', name: 'TypeScript', description: 'Type-safe JavaScript development', duration: 25 },
    { id: 'module-devops', name: 'DevOps & CI/CD', description: 'Deployment pipelines and containerization', duration: 20 },
    { id: 'module-dsa', name: 'Data Structures & Algorithms', description: 'Problem solving and algorithm design', duration: 50 },
  ];

  const modules = [];
  for (const md of moduleData) {
    const mod = await prisma.module.upsert({
      where: { id: md.id },
      update: {},
      create: {
        id: md.id,
        name: md.name,
        description: md.description,
        duration: md.duration,
      },
    });
    modules.push(mod);
  }
  console.log('Created 8 modules');

  // Batch-module assignments (first batch gets all modules, others get subsets)
  const batchModuleAssignments = [
    { batchId: batches[0].id, moduleIds: modules.slice(0, 6).map(m => m.id), status: 'IN_PROGRESS', completion: 60 },
    { batchId: batches[1].id, moduleIds: modules.slice(0, 4).map(m => m.id), status: 'IN_PROGRESS', completion: 30 },
    { batchId: batches[2].id, moduleIds: [modules[4].id, modules[7].id, modules[1].id], status: 'IN_PROGRESS', completion: 45 },
    { batchId: batches[3].id, moduleIds: [modules[1].id, modules[2].id, modules[5].id], status: 'PENDING', completion: 10 },
  ];

  for (const bma of batchModuleAssignments) {
    for (const moduleId of bma.moduleIds) {
      await prisma.batchModule.upsert({
        where: { batchId_moduleId: { batchId: bma.batchId, moduleId } },
        update: {},
        create: {
          batchId: bma.batchId,
          moduleId,
          status: bma.status,
          completionPercent: bma.completion,
        },
      });
    }
  }
  console.log('Assigned modules to batches');

  // Trainer-batch assignments
  const trainerBatchAssignments = [
    { trainerId: trainers[0].id, batchId: batches[0].id },
    { trainerId: trainers[0].id, batchId: batches[1].id },
    { trainerId: trainers[1].id, batchId: batches[1].id },
    { trainerId: trainers[1].id, batchId: batches[3].id },
    { trainerId: trainers[2].id, batchId: batches[0].id },
    { trainerId: trainers[2].id, batchId: batches[2].id },
  ];

  for (const tba of trainerBatchAssignments) {
    await prisma.trainerBatch.upsert({
      where: { trainerId_batchId: { trainerId: tba.trainerId, batchId: tba.batchId } },
      update: {},
      create: {
        trainerId: tba.trainerId,
        batchId: tba.batchId,
      },
    });
  }
  console.log('Assigned trainers to batches');

  // Create 20 students
  const studentNames = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Davis',
    'Frank Miller', 'Grace Lee', 'Henry Wilson', 'Iris Chen', 'Jack Taylor',
    'Kate Anderson', 'Liam Thomas', 'Maya Patel', 'Noah Garcia', 'Olivia Martinez',
    'Peter Robinson', 'Quinn Walker', 'Rachel Hall', 'Sam Allen', 'Tara Young',
  ];

  const students = [];
  for (let i = 0; i < 20; i++) {
    const email = `student${i + 1}@institute.com`;
    const batchIndex = i % 4;
    const counsellorIndex = i % 2;
    const mode = i % 3 === 0 ? 'ONLINE' : 'OFFLINE';

    const studentUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: studentPassword,
        name: studentNames[i],
        role: 'STUDENT',
        phone: `90000${(10000 + i + 1).toString()}`,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        batchId: batches[batchIndex].id,
        counsellorId: counsellors[counsellorIndex].id,
        mode,
      },
    });
    students.push(student);
  }
  console.log('Created 20 students');

  // Counsellor-student assignments
  for (let i = 0; i < students.length; i++) {
    const counsellorIndex = i % 2;
    await prisma.counsellorStudent.upsert({
      where: {
        counsellorId_studentId: {
          counsellorId: counsellors[counsellorIndex].id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        counsellorId: counsellors[counsellorIndex].id,
        studentId: students[i].id,
      },
    });
  }
  console.log('Assigned counsellors to students');

  // Create sample lectures
  const lectures = [];
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 5; day++) {
      const date = new Date('2024-03-01');
      date.setDate(date.getDate() + week * 7 + day);

      const lecture = await prisma.lecture.create({
        data: {
          batchId: batches[0].id,
          moduleId: modules[week % modules.length].id,
          trainerId: trainers[0].id,
          date,
          startTime: '09:00',
          endTime: '12:00',
          duration: 180,
          topics: `Week ${week + 1}, Day ${day + 1}: ${modules[week % modules.length].name} session`,
        },
      });
      lectures.push(lecture);
    }
  }
  console.log(`Created ${lectures.length} lectures`);

  // Create attendance records for students in batch 1
  const batch1Students = students.filter((_, i) => i % 4 === 0);
  for (const lecture of lectures.slice(0, 10)) {
    for (const student of batch1Students) {
      const status = Math.random() > 0.2 ? 'PRESENT' : 'ABSENT';
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          lectureId: lecture.id,
          status,
          method: 'MANUAL',
        },
      });
    }
  }
  console.log('Created attendance records');

  // Create marks for students
  const markTypes = ['QUIZ', 'ASSIGNMENT', 'PROJECT', 'EXAM'];
  for (const student of batch1Students) {
    for (let j = 0; j < 4; j++) {
      const mod = modules[j];
      await prisma.marks.create({
        data: {
          studentId: student.id,
          moduleId: mod.id,
          type: markTypes[j],
          score: Math.floor(Math.random() * 40) + 60,
          maxScore: 100,
          remarks: `${markTypes[j]} for ${mod.name}`,
        },
      });
    }
  }
  console.log('Created marks records');

  // Create fees for all students
  for (const student of students) {
    const totalAmount = 50000;
    const paidAmount = Math.floor(Math.random() * 4) * 12500;
    const pendingAmount = totalAmount - paidAmount;
    const status = paidAmount >= totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';

    const fee = await prisma.fee.create({
      data: {
        studentId: student.id,
        totalAmount,
        paidAmount,
        pendingAmount,
        dueDate: new Date('2024-06-30'),
        status,
      },
    });

    // Create payment records
    if (paidAmount > 0) {
      const numPayments = paidAmount / 12500;
      for (let p = 0; p < numPayments; p++) {
        const paidAt = new Date('2024-01-15');
        paidAt.setMonth(paidAt.getMonth() + p);
        await prisma.feePayment.create({
          data: {
            feeId: fee.id,
            amount: 12500,
            paidAt,
            method: p % 2 === 0 ? 'UPI' : 'BANK_TRANSFER',
          },
        });
      }
    }
  }
  console.log('Created fee records');

  // Create notifications
  const notificationData = [
    { title: 'Welcome to the Institute', message: 'Your enrollment is confirmed. Please check your batch schedule.' },
    { title: 'New Module Started', message: 'React.js module is starting next week. Make sure to complete prerequisites.' },
    { title: 'Fee Reminder', message: 'Your next installment is due by end of this month.' },
    { title: 'Mock Interview Scheduled', message: 'Your mock interview has been scheduled for next Friday.' },
  ];

  for (const student of batch1Students) {
    const studentUser = await prisma.student.findUnique({
      where: { id: student.id },
      select: { userId: true },
    });
    if (studentUser) {
      for (const nd of notificationData) {
        await prisma.notification.create({
          data: {
            userId: studentUser.userId,
            title: nd.title,
            message: nd.message,
            type: 'INFO',
            isRead: Math.random() > 0.5,
          },
        });
      }
    }
  }
  console.log('Created notifications');

  // Create announcements
  await prisma.announcement.create({
    data: {
      createdById: admin.id,
      title: 'Holiday Notice',
      message: 'The institute will be closed on March 25th for annual function.',
      targetRole: 'STUDENT',
      batchId: batches[0].id,
    },
  });
  await prisma.announcement.create({
    data: {
      createdById: admin.id,
      title: 'New Batch Starting',
      message: 'A new batch for Data Science is starting on April 1st. Spread the word!',
      targetRole: 'TRAINER',
    },
  });
  console.log('Created announcements');

  console.log('\nSeeding completed successfully!');
  console.log('---');
  console.log('Default credentials:');
  console.log('  Admin: admin@institute.com / admin123');
  console.log('  Trainer: trainer1@institute.com / trainer123');
  console.log('  Counsellor: counsellor1@institute.com / counsellor123');
  console.log('  Student: student1@institute.com / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
