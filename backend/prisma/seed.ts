import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@institute.com' },
    update: {},
    create: {
      email: 'admin@institute.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '9999999999',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create trainer user
  const trainerPassword = await bcrypt.hash('trainer123', 10);
  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@institute.com' },
    update: {},
    create: {
      email: 'trainer@institute.com',
      password: trainerPassword,
      name: 'John Trainer',
      role: 'TRAINER',
      phone: '9999999998',
    },
  });
  const trainer = await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      specialization: 'Full Stack Development',
    },
  });
  console.log('Created trainer user:', trainerUser.email);

  // Create counsellor user
  const counsellorPassword = await bcrypt.hash('counsellor123', 10);
  const counsellorUser = await prisma.user.upsert({
    where: { email: 'counsellor@institute.com' },
    update: {},
    create: {
      email: 'counsellor@institute.com',
      password: counsellorPassword,
      name: 'Jane Counsellor',
      role: 'COUNSELLOR',
      phone: '9999999997',
    },
  });
  const counsellor = await prisma.counsellor.upsert({
    where: { userId: counsellorUser.id },
    update: {},
    create: {
      userId: counsellorUser.id,
    },
  });
  console.log('Created counsellor user:', counsellorUser.email);

  // Create a batch
  const batch = await prisma.batch.upsert({
    where: { id: 'default-batch-id' },
    update: {},
    create: {
      id: 'default-batch-id',
      name: 'Full Stack Web Dev - Batch 1',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-07-15'),
      isActive: true,
    },
  });
  console.log('Created batch:', batch.name);

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 10);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@institute.com' },
    update: {},
    create: {
      email: 'student@institute.com',
      password: studentPassword,
      name: 'Alice Student',
      role: 'STUDENT',
      phone: '9999999996',
    },
  });
  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      batchId: batch.id,
      counsellorId: counsellor.id,
      mode: 'OFFLINE',
    },
  });
  console.log('Created student user:', studentUser.email);

  // Create modules
  const modules = await Promise.all([
    prisma.module.upsert({
      where: { id: 'module-html-css' },
      update: {},
      create: {
        id: 'module-html-css',
        name: 'HTML & CSS',
        description: 'Fundamentals of web markup and styling',
        duration: 30,
      },
    }),
    prisma.module.upsert({
      where: { id: 'module-javascript' },
      update: {},
      create: {
        id: 'module-javascript',
        name: 'JavaScript',
        description: 'Core JavaScript programming concepts',
        duration: 45,
      },
    }),
    prisma.module.upsert({
      where: { id: 'module-react' },
      update: {},
      create: {
        id: 'module-react',
        name: 'React.js',
        description: 'Building modern UIs with React',
        duration: 40,
      },
    }),
    prisma.module.upsert({
      where: { id: 'module-nodejs' },
      update: {},
      create: {
        id: 'module-nodejs',
        name: 'Node.js & Express',
        description: 'Server-side JavaScript with Node.js',
        duration: 35,
      },
    }),
  ]);
  console.log('Created modules:', modules.map((m) => m.name).join(', '));

  // Link batch to modules
  for (const mod of modules) {
    await prisma.batchModule.upsert({
      where: { batchId_moduleId: { batchId: batch.id, moduleId: mod.id } },
      update: {},
      create: {
        batchId: batch.id,
        moduleId: mod.id,
        status: 'IN_PROGRESS',
        completionPercent: 50,
      },
    });
  }
  console.log('Linked modules to batch');

  // Link trainer to batch
  await prisma.trainerBatch.upsert({
    where: { trainerId_batchId: { trainerId: trainer.id, batchId: batch.id } },
    update: {},
    create: {
      trainerId: trainer.id,
      batchId: batch.id,
    },
  });
  console.log('Linked trainer to batch');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
