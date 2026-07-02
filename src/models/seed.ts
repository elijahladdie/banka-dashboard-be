
import { PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const password = process.env.SEED_PASSWORD || 'Admin@123';
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  logger.info('Seeding database...');

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Upsert Role records
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { name: 'Admin', slug: 'admin', description: 'Platform administrator' },
  });

  const advisorRole = await prisma.role.upsert({
    where: { slug: 'advisor' },
    update: {},
    create: { name: 'Advisor', slug: 'advisor', description: 'Financial advisor' },
  });

  const clientRole = await prisma.role.upsert({
    where: { slug: 'client' },
    update: {},
    create: { name: 'Client', slug: 'client', description: 'Platform client' },
  });

  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@banka.rw' },
    update: {},
    create: {
      email: 'admin@banka.rw',
      password: passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  // Create sample advisor user
  const advisorUser = await prisma.user.upsert({
    where: { email: 'advisor@banka.rw' },
    update: {},
    create: {
      email: 'advisor@banka.rw',
      password: passwordHash,
      firstName: 'Alice',
      lastName: 'Mukamana',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  // Assign advisor role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: advisorUser.id, roleId: advisorRole.id } },
    update: {},
    create: { userId: advisorUser.id, roleId: advisorRole.id },
  });

  // Create advisor profile
  await prisma.advisor.upsert({
    where: { userId: advisorUser.id },
    update: {},
    create: {
      userId: advisorUser.id,
      employeeCode: 'ADV-001',
      specialization: 'Investment Planning',
      bio: 'Senior financial advisor specializing in investment strategies and wealth management.',
      maxClients: 20,
      currentClients: 0,
      isAvailable: true,
    },
  });

  // Create sample client
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@banka.rw' },
    update: {},
    create: {
      email: 'client@banka.rw',
      password: passwordHash,
      firstName: 'Patrick',
      lastName: 'Niyonzima',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  // Assign client role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: clientUser.id, roleId: clientRole.id } },
    update: {},
    create: { userId: clientUser.id, roleId: clientRole.id },
  });

  // Create subscription for client
  await prisma.subscription.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      plan: 'PRO',
      status: 'ACTIVE',
      billingInterval: 'month',
      startsAt: new Date(),
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Create sample goals
  await prisma.goal.create({
    data: {
      clientId: clientUser.id,
      title: 'Emergency Fund',
      description: 'Build 6 months of emergency savings',
      targetAmount: 1500000,
      currentAmount: 500000,
      targetDate: new Date('2026-12-31'),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.goal.create({
    data: {
      clientId: clientUser.id,
      title: 'Retirement Savings',
      description: 'Save for early retirement',
      targetAmount: 50000000,
      currentAmount: 5000000,
      targetDate: new Date('2045-12-31'),
      status: 'IN_PROGRESS',
    },
  });

  // Create sample notification
  await prisma.notification.create({
    data: {
      userId: clientUser.id,
      title: 'Welcome to Banka!',
      message: 'Thank you for joining Banka. Start tracking your financial goals today.',
      type: 'SUCCESS',
    },
  });

  logger.info('Database seeded successfully!');
  logger.info('Default credentials:');
  logger.info('  All accounts: password = "%s"', password);
  logger.info('  Admin: admin@banka.rw');
  logger.info('  Finance: finance@banka.rw');
  logger.info('  Advisor: advisor@banka.rw');
  logger.info('  Client: client@banka.rw');
}

main()
  .catch((e) => {
    logger.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
