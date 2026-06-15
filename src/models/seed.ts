import { PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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
      billingInterval: 'MONTHLY',
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

  // Seed plan features
  const planFeatures = [
    // STARTER — Personal Finance
    { plan: 'STARTER' as const, name: 'Personal budget planning', category: 'feature', sortOrder: 1 },
    { plan: 'STARTER' as const, name: 'Savings tracking', category: 'feature', sortOrder: 2 },
    { plan: 'STARTER' as const, name: 'Loan readiness assessment', category: 'feature', sortOrder: 3 },
    { plan: 'STARTER' as const, name: 'Digital banking support', category: 'feature', sortOrder: 4 },
    { plan: 'STARTER' as const, name: 'Monthly financial reports', category: 'feature', sortOrder: 5 },
    { plan: 'STARTER' as const, name: 'Credit recommendations', category: 'feature', sortOrder: 6 },
    { plan: 'STARTER' as const, name: 'Dedicated advisor', category: 'feature', sortOrder: 7 },
    { plan: 'STARTER' as const, name: 'Investment guidance', category: 'feature', sortOrder: 8 },
    { plan: 'STARTER' as const, name: 'Individuals seeking personal financial guidance', category: 'target_customer', sortOrder: 1 },
    { plan: 'STARTER' as const, name: 'Young professionals starting their financial journey', category: 'target_customer', sortOrder: 2 },
    { plan: 'STARTER' as const, name: 'Monthly price: RWF 10,000', category: 'pricing', sortOrder: 1 },
    { plan: 'STARTER' as const, name: 'Yearly price: RWF 100,000', category: 'pricing', sortOrder: 2 },

    // PRO — Business Finance
    { plan: 'PRO' as const, name: 'Personal budget planning', category: 'feature', sortOrder: 1 },
    { plan: 'PRO' as const, name: 'Savings tracking', category: 'feature', sortOrder: 2 },
    { plan: 'PRO' as const, name: 'Loan readiness assessment', category: 'feature', sortOrder: 3 },
    { plan: 'PRO' as const, name: 'Digital banking support', category: 'feature', sortOrder: 4 },
    { plan: 'PRO' as const, name: 'Monthly financial reports', category: 'feature', sortOrder: 5 },
    { plan: 'PRO' as const, name: 'Credit recommendations', category: 'feature', sortOrder: 6 },
    { plan: 'PRO' as const, name: 'Dedicated advisor', category: 'feature', sortOrder: 7 },
    { plan: 'PRO' as const, name: 'Investment guidance', category: 'feature', sortOrder: 8 },
    { plan: 'PRO' as const, name: 'SME advisor', category: 'feature', sortOrder: 9 },
    { plan: 'PRO' as const, name: 'Cash flow forecasting', category: 'feature', sortOrder: 10 },
    { plan: 'PRO' as const, name: 'Business monitoring', category: 'feature', sortOrder: 11 },
    { plan: 'PRO' as const, name: 'Tax guidance', category: 'feature', sortOrder: 12 },
    { plan: 'PRO' as const, name: 'Financing opportunities', category: 'feature', sortOrder: 13 },
    { plan: 'PRO' as const, name: 'Strategy reviews', category: 'feature', sortOrder: 14 },
    { plan: 'PRO' as const, name: 'Business assessments', category: 'feature', sortOrder: 15 },
    { plan: 'PRO' as const, name: 'Financial reporting support', category: 'feature', sortOrder: 16 },
    { plan: 'PRO' as const, name: 'Banking advisory', category: 'feature', sortOrder: 17 },
    { plan: 'PRO' as const, name: 'Professional referrals', category: 'feature', sortOrder: 18 },
    { plan: 'PRO' as const, name: 'SME owners and business managers', category: 'target_customer', sortOrder: 1 },
    { plan: 'PRO' as const, name: 'Entrepreneurs seeking business growth strategies', category: 'target_customer', sortOrder: 2 },
    { plan: 'PRO' as const, name: 'Monthly price: RWF 50,000', category: 'pricing', sortOrder: 1 },
    { plan: 'PRO' as const, name: 'Yearly price: RWF 500,000', category: 'pricing', sortOrder: 2 },

    // ADVANCED — Investment & Capital Raising
    { plan: 'ADVANCED' as const, name: 'Personal budget planning', category: 'feature', sortOrder: 1 },
    { plan: 'ADVANCED' as const, name: 'Savings tracking', category: 'feature', sortOrder: 2 },
    { plan: 'ADVANCED' as const, name: 'Loan readiness assessment', category: 'feature', sortOrder: 3 },
    { plan: 'ADVANCED' as const, name: 'Digital banking support', category: 'feature', sortOrder: 4 },
    { plan: 'ADVANCED' as const, name: 'Monthly financial reports', category: 'feature', sortOrder: 5 },
    { plan: 'ADVANCED' as const, name: 'Credit recommendations', category: 'feature', sortOrder: 6 },
    { plan: 'ADVANCED' as const, name: 'Dedicated advisor', category: 'feature', sortOrder: 7 },
    { plan: 'ADVANCED' as const, name: 'Investment guidance', category: 'feature', sortOrder: 8 },
    { plan: 'ADVANCED' as const, name: 'SME advisor', category: 'feature', sortOrder: 9 },
    { plan: 'ADVANCED' as const, name: 'Cash flow forecasting', category: 'feature', sortOrder: 10 },
    { plan: 'ADVANCED' as const, name: 'Business monitoring', category: 'feature', sortOrder: 11 },
    { plan: 'ADVANCED' as const, name: 'Tax guidance', category: 'feature', sortOrder: 12 },
    { plan: 'ADVANCED' as const, name: 'Financing opportunities', category: 'feature', sortOrder: 13 },
    { plan: 'ADVANCED' as const, name: 'Strategy reviews', category: 'feature', sortOrder: 14 },
    { plan: 'ADVANCED' as const, name: 'Business assessments', category: 'feature', sortOrder: 15 },
    { plan: 'ADVANCED' as const, name: 'Financial reporting support', category: 'feature', sortOrder: 16 },
    { plan: 'ADVANCED' as const, name: 'Banking advisory', category: 'feature', sortOrder: 17 },
    { plan: 'ADVANCED' as const, name: 'Professional referrals', category: 'feature', sortOrder: 18 },
    { plan: 'ADVANCED' as const, name: 'Investment readiness', category: 'feature', sortOrder: 19 },
    { plan: 'ADVANCED' as const, name: 'Investor matching', category: 'feature', sortOrder: 20 },
    { plan: 'ADVANCED' as const, name: 'Pitch deck support', category: 'feature', sortOrder: 21 },
    { plan: 'ADVANCED' as const, name: 'Fundraising consultations', category: 'feature', sortOrder: 22 },
    { plan: 'ADVANCED' as const, name: 'Investor introductions', category: 'feature', sortOrder: 23 },
    { plan: 'ADVANCED' as const, name: 'Market intelligence', category: 'feature', sortOrder: 24 },
    { plan: 'ADVANCED' as const, name: 'ESG reporting', category: 'feature', sortOrder: 25 },
    { plan: 'ADVANCED' as const, name: 'Capital raising preparation', category: 'feature', sortOrder: 26 },
    { plan: 'ADVANCED' as const, name: 'Opportunity sourcing', category: 'feature', sortOrder: 27 },
    { plan: 'ADVANCED' as const, name: 'Strategic partnerships', category: 'feature', sortOrder: 28 },
    { plan: 'ADVANCED' as const, name: 'Priority advisor access', category: 'feature', sortOrder: 29 },
    { plan: 'ADVANCED' as const, name: 'Investor engagement events', category: 'feature', sortOrder: 30 },
    { plan: 'ADVANCED' as const, name: 'Startups and growing businesses seeking investment', category: 'target_customer', sortOrder: 1 },
    { plan: 'ADVANCED' as const, name: 'Companies preparing for capital raising', category: 'target_customer', sortOrder: 2 },
    { plan: 'ADVANCED' as const, name: 'Monthly price: RWF 100,000', category: 'pricing', sortOrder: 1 },
    { plan: 'ADVANCED' as const, name: 'Yearly price: RWF 1,000,000', category: 'pricing', sortOrder: 2 },
  ];

  for (const feature of planFeatures) {
    await prisma.planFeature.create({
      data: { ...feature, billingInterval: 'MONTHLY' as const },
    });
  }
  console.log(`  ✓ ${planFeatures.length} MONTHLY plan features seeded`);

  // Duplicate features for YEARLY billing interval
  for (const feature of planFeatures) {
    await prisma.planFeature.create({
      data: { ...feature, billingInterval: 'YEARLY' as const },
    });
  }
  console.log(`  ✓ ${planFeatures.length} YEARLY plan features seeded`);

  console.log('Database seeded successfully!');
  console.log('Default credentials:');
  console.log('  All accounts: password = "Admin@123"');
  console.log('  Admin: admin@banka.rw');
  console.log('  Finance: finance@banka.rw');
  console.log('  Advisor: advisor@banka.rw');
  console.log('  Subscriber: subscriber@banka.rw');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
