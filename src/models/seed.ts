import { PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  logger.info('Seeding database...');

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  // Create Platform Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@banka.rw' },
    update: {},
    create: {
      email: 'admin@banka.rw',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create Finance Officer
  const financeOfficer = await prisma.user.upsert({
    where: { email: 'finance@banka.rw' },
    update: {},
    create: {
      email: 'finance@banka.rw',
      passwordHash,
      firstName: 'Jean',
      lastName: 'Pierre',
      role: 'FINANCE_OFFICER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create sample advisor user
  const advisorUser = await prisma.user.upsert({
    where: { email: 'advisor@banka.rw' },
    update: {},
    create: {
      email: 'advisor@banka.rw',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Mukamana',
      role: 'FINANCIAL_ADVISOR',
      status: 'ACTIVE',
      emailVerified: true,
    },
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

  // Create sample subscriber
  const subscriberUser = await prisma.user.upsert({
    where: { email: 'subscriber@banka.rw' },
    update: {},
    create: {
      email: 'subscriber@banka.rw',
      passwordHash,
      firstName: 'Patrick',
      lastName: 'Niyonzima',
      role: 'SUBSCRIBER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create subscription for subscriber
  await prisma.subscription.upsert({
    where: { userId: subscriberUser.id },
    update: {},
    create: {
      userId: subscriberUser.id,
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
      subscriberId: subscriberUser.id,
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
      subscriberId: subscriberUser.id,
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
      userId: subscriberUser.id,
      title: 'Welcome to Banka!',
      message: 'Thank you for joining Banka. Start tracking your financial goals today.',
      type: 'SUCCESS',
    },
  });

  logger.info('Database seeded successfully!');
  logger.info('Default credentials:');
  logger.info('  All accounts: password = "Admin@123"');
  logger.info('  Admin: admin@banka.rw');
  logger.info('  Finance: finance@banka.rw');
  logger.info('  Advisor: advisor@banka.rw');
  logger.info('  Subscriber: subscriber@banka.rw');
}

main()
  .catch((e) => {
    logger.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
