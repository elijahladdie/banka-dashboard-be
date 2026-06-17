import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import {
  AuthTokens,
  JwtPayload,
  SignUpInput,
  SignInInput,
  PaddleSignUpInput,
  PaddleSubscriptionUpdateInput,
  CompleteRegistrationInput,
  PendingRegistrationResult,
} from '../types';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../helpers';
import { TOKEN } from '../constants';
import { BCRYPT_SALT_ROUNDS, JWT_ACCESS_SECRET } from '../utils/constants';
import { ReportsRepository } from '../repositories/implementations/reports.repository';
import { mergeSummary } from '../utils/paddle-mapper';
import { SubscriptionStatus } from '@prisma/client';

export class AuthService {
  private readonly authRepository: AuthRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly reportsRepository: ReportsRepository;
  constructor() {
    this.authRepository = new AuthRepository();
    this.auditLogsRepository = new AuditLogsRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.reportsRepository = new ReportsRepository();
  }

  async signUp(input: SignUpInput): Promise<{ user: any; tokens: AuthTokens }> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.authRepository.createUser({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.auditLogsRepository.create({
      userId: user.id,
      action: 'USER_SIGNED_UP',
      entityType: 'User',
      entityId: user.id,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  async signIn(input: SignInInput): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await this.authRepository.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.deletedAt) {
      throw new UnauthorizedError('This account has been deactivated.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('This account has been suspended.');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedError('This account is inactive.');
    }

    if (!user.registrationCompleted) {
      throw new UnauthorizedError('Please complete your registration first.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const updatedUser = await this.authRepository.updateUser(user.id, {
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.auditLogsRepository.create({
      userId: user.id,
      action: 'USER_SIGNED_IN',
      entityType: 'User',
      entityId: user.id,
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return { user: userWithoutPassword, tokens };
  }
  async signUpFromPaddle(input: PaddleSignUpInput): Promise<{ user: any }> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      // User already exists — create subscription if missing, or update customerId
      const existingSub = await this.subscriptionsRepository.findOne({ userId: existingUser.id });
      if (existingSub) {
        await this.subscriptionsRepository.update(existingSub.id, {
          customerId: input.customerId || existingSub.customerId,
          subscriptionId: input.subscriptionId || existingSub.subscriptionId,
        });
      } else {
        await this.subscriptionsRepository.create({
          userId: existingUser.id,
          customerId: input.customerId || '',
          subscriptionId: input.subscriptionId || '',
        });
      }
      const { passwordHash: _, ...userWithoutPassword } = existingUser;
      return { user: userWithoutPassword };
    }

    // Placeholder password — user must complete registration to set a real one
    const placeholderHash = await bcrypt.hash(uuidv4(), 1);

    const user = await this.authRepository.createUser({
      email: input.email,
      passwordHash: placeholderHash,
      firstName: input.fullName,
      lastName: '',
      registrationCompleted: false,
      source: 'paddle',
    });

    // Create a subscription record with the Paddle customer ID
    await this.subscriptionsRepository.create({
      userId: user.id,
      customerId: input.customerId || '',
      subscriptionId: input.subscriptionId || '',
    });

    await this.auditLogsRepository.create({
      userId: user.id,
      action: 'USER_CREATED_FROM_PADDLE',
      entityType: 'User',
      entityId: user.id,
      newValues: { source: 'paddle', email: input.email },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async updateSubscriptionFromPaddle(
    input: PaddleSubscriptionUpdateInput
  ): Promise<any | null> {

    const subscription = await this.subscriptionsRepository.findOne({
      customerId: input.customerId,
    });

    if (!subscription) return null;

    const paddleEvent = input.paddleEvent;

    const normalized =
      this.normalizePaddleSubscription(paddleEvent);

    const previousPlan = subscription.plan;

    const isUpgrade =
      previousPlan &&
      previousPlan !== normalized.product;

    const eventType =
      this.resolveSubscriptionEvent(paddleEvent?.event_type);

    /**
     * 🧠 CRITICAL FIX:
     * These fields MUST ALWAYS be stored consistently
     */
    await this.subscriptionsRepository.update(subscription.id, {
      subscriptionId:
        input.subscriptionId || subscription.subscriptionId,

      plan: normalized.product,

      status: normalized.status,

      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      canceledAt: normalized.canceledAt,
      trialStart: normalized.trialStart,
      trialEnd: normalized.trialEnd,

      metadata: {
        currency: normalized.currency,
        amount: normalized.amount,
        billingCycle: normalized.billingCycle,
        collectionMode: normalized.collectionMode,
        paddleEventType: paddleEvent?.event_type,
        product: normalized.product,
      },
    });

    const user = await this.authRepository.findById(subscription.userId);
    if (!user) return null;

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const isQuarterEnd =
      (month === 3 && day === 31) ||
      (month === 6 && day === 30) ||
      (month === 9 && day === 30) ||
      (month === 12 && day === 31);

    const isYearEnd = month === 12 && day === 31;

    /**
     * 📊 REPORTING LOGIC (unchanged but now accurate data)
     */
    if (isQuarterEnd) {
      const quarter = Math.ceil(month / 3);

      const title = `Q${quarter} Financial Summary ${now.getFullYear()}`;

      const existing = await this.reportsRepository.findOne({
        subscriber: { id: user.id },
        reportType: 'QUARTERLY',
        title,
      });

      const summary = [
        `Quarterly review Q${quarter}.`,
        `Plan: ${normalized.product}.`,
        `Amount: ${normalized.amount} ${normalized.currency}.`,
        normalized.status ? `Status: ${normalized.status}.` : '',
        isUpgrade
          ? `Upgraded from ${previousPlan} to ${normalized.product}.`
          : '',
      ].filter(Boolean).join(' ');

      if (existing) {
        await this.reportsRepository.update(existing.id, {
          summary: mergeSummary(existing.summary, [summary]),
        });
      } else {
        await this.reportsRepository.create({
          subscriber: { connect: { id: user.id } },
          reportType: 'QUARTERLY',
          title,
          summary,
        });
      }
    }

    if (isYearEnd) {
      const title = `Annual Financial Report ${now.getFullYear()}`;

      const existing = await this.reportsRepository.findOne({
        subscriber: { id: user.id },
        reportType: 'ANNUAL',
        title,
      });

      const summary = [
        `Annual subscription summary.`,
        `Plan: ${normalized.product}.`,
        `Amount: ${normalized.amount} ${normalized.currency}.`,
        normalized.status ? `Status: ${normalized.status}.` : '',
        isUpgrade ? `Upgraded during year.` : '',
      ].filter(Boolean).join(' ');

      if (existing) {
        await this.reportsRepository.update(existing.id, {
          summary: mergeSummary(existing.summary, [summary]),
        });
      } else {
        await this.reportsRepository.create({
          subscriber: { connect: { id: user.id } },
          reportType: 'ANNUAL',
          title,
          summary,
        });
      }
    }

    /**
     * 📌 ALWAYS CREATE MONTHLY EVENT LOG
     */
    await this.reportsRepository.create({
      subscriber: { connect: { id: user.id } },
      reportType: 'MONTHLY',
      title: isUpgrade
        ? `Subscription Upgrade - ${normalized.product}`
        : `Subscription Payment - ${normalized.product}`,

      summary: isUpgrade
        ? `Upgraded from ${previousPlan} to ${normalized.product}. Paid ${normalized.amount} ${normalized.currency}.`
        : `Payment received for ${normalized.product}. Amount: ${normalized.amount} ${normalized.currency}.`,
    });

    /**
     * 📌 AUDIT LOG (now lifecycle-aware)
     */
    await this.auditLogsRepository.create({
      userId: user.id,
      action: eventType,

      entityType: 'Subscription',
      entityId: subscription.id,

      newValues: {
        plan: normalized.product,
        amount: normalized.amount,
        currency: normalized.currency,
        status: normalized.status,
        startsAt: normalized.startsAt?.toISOString() ?? null,
        endsAt: normalized.endsAt?.toISOString() ?? null,
        canceledAt: normalized.canceledAt?.toISOString() ?? null,
        trialStart: normalized.trialStart?.toISOString() ?? null,
        trialEnd: normalized.trialEnd?.toISOString() ?? null,
        subscriptionId: input.subscriptionId,
      }
    });

    return user;
  }
  async completeRegistration(input: CompleteRegistrationInput): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.registrationCompleted) {
      throw new ValidationError('Registration is already completed.');
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const updated = await this.authRepository.updateUser(user.id, {
      passwordHash,
      phoneNumber: input.phone,
      registrationCompleted: true,
      status: 'ACTIVE',
    });

    const tokens = await this.generateTokens(updated.id, updated.email, updated.role);

    await this.auditLogsRepository.create({
      userId: updated.id,
      action: 'REGISTRATION_COMPLETED',
      entityType: 'User',
      entityId: updated.id,
    });

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return { user: userWithoutPassword, tokens };
  }

  async checkPendingRegistration(email: string): Promise<PendingRegistrationResult> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      registrationCompleted: user.registrationCompleted,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.auditLogsRepository.create({
      userId,
      action: 'USER_SIGNED_OUT',
      entityType: 'User',
      entityId: userId,
    });
  }

  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    if (!user) {
      // Don't reveal whether the email exists
      throw new ValidationError('If the email exists, a reset link has been sent.');
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + TOKEN.RESET_TOKEN_EXPIRY);

    await this.authRepository.updateUser(user.id, {
      // In production, store reset token hash in a separate table
    });
    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    // In production, validate reset token from database
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Find user by reset token and update password
    // This is a simplified version - in production, store reset tokens in DB
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.authRepository.updateUser(userId, {
      emailVerified: true,
      status: 'ACTIVE',
    });

    await this.auditLogsRepository.create({
      userId,
      action: 'EMAIL_VERIFIED',
      entityType: 'User',
      entityId: userId,
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { userId, email, role };

    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '1d' });
    return { accessToken };
  }
  private normalizePaddleSubscription(paddleEvent: any) {
    const data = paddleEvent?.data ?? {};
    const details = data?.details ?? data;

    const lineItem =
      details?.line_items?.[0] ??
      data?.items?.[0];

    const product =
      lineItem?.product?.name ??
      lineItem?.price?.name ??
      'ADVANCED';

    const billingPeriod =
      data?.billing_period ?? details?.current_billing_period ?? {};

    const startsAt =
      billingPeriod?.starts_at ??
      details?.started_at ??
      null;

    const endsAt =
      billingPeriod?.ends_at ??
      data?.next_billed_at ??
      null;

    const canceledAt =
      details?.canceled_at ??
      data?.canceled_at ??
      null;

    const trialStart =
      details?.trial_started_at ??
      (details?.status === 'trialing' ? startsAt : null);

    const trialEnd =
      details?.trial_ends_at ??
      null;

    const currency =
      details?.totals?.currency_code ??
      data?.currency_code ??
      'USD';

    const amount =
      Number(details?.totals?.grand_total ?? 0);

    const status = mapPaddleStatus(
      details?.status ?? data?.status ?? paddleEvent?.event_type
    );

    return {
      product: product?.toUpperCase(),
      currency,
      amount,
      status,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      canceledAt: canceledAt ? new Date(canceledAt) : null,
      trialStart: trialStart ? new Date(trialStart) : null,
      trialEnd: trialEnd ? new Date(trialEnd) : null,
      billingCycle: lineItem?.price?.billing_cycle ?? null,
      collectionMode: data?.collection_mode ?? null,
    };
  }
  private resolveSubscriptionEvent(eventType: string) {
    switch (eventType) {
      case 'transaction.completed':
        return 'PAYMENT_RECEIVED';

      case 'subscription.created':
        return 'SUBSCRIPTION_CREATED';

      case 'subscription.updated':
        return 'SUBSCRIPTION_UPDATED';

      case 'subscription.canceled':
        return 'SUBSCRIPTION_CANCELED';

      case 'subscription.paused':
        return 'SUBSCRIPTION_PAUSED';

      case 'subscription.resumed':
        return 'SUBSCRIPTION_RESUMED';

      case 'subscription.trialing':
        return 'SUBSCRIPTION_TRIAL';

      default:
        return 'SUBSCRIPTION_UPDATED';
    }
  }

}

function mapPaddleStatus(status?: string): SubscriptionStatus {
  const s = (status ?? "").toLowerCase();

  switch (s) {
    case "active":
    case "completed":
    case "paid":
    case "succeeded":
      return "ACTIVE";

    case "past_due":
    case "payment_failed":
    case "unpaid":
      return "PAST_DUE";

    case "trialing":
    case "trial":
      return "TRIALING";

    case "canceled":
    case "cancelled":
      return "CANCELED";

    case "expired":
    case "ended":
      return "EXPIRED";

    default:
      return "ACTIVE"; // safe fallback
  }
}
