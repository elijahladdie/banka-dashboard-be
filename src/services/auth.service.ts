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
import { sendRegistrationEmail, sendSubsUpgradeEmail } from './email.service';
import { ReportsRepository } from '../repositories/implementations/reports.repository';
import { mergeSummary } from '../utils/paddle-mapper';
import logger from '../utils/logger';

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

    const lineItem =
      paddleEvent?.data?.details?.line_items?.[0] ??
      paddleEvent?.details?.line_items?.[0];
    const product =
      lineItem?.product?.name ??
      lineItem?.price?.name ??
      'ADVANCED';

    const amount = Number(
      paddleEvent?.data?.details?.totals?.grand_total ??
      paddleEvent?.details?.totals?.grand_total ??
      0
    );

    const currency =
      paddleEvent?.data?.currency_code ??
      paddleEvent?.currency_code ??
      'USD';

    const previousPlan = subscription.plan;

    const isUpgrade =
      previousPlan &&
      previousPlan !== product;

    await this.subscriptionsRepository.update(subscription.id, {
      subscriptionId:
        input.subscriptionId || subscription.subscriptionId,

      plan: product?.toUpperCase(),

      status: 'ACTIVE',
    });

    const user = await this.authRepository.findById(
      subscription.userId
    );

    if (!user) return null;

    const now = new Date();

    const month = now.getMonth() + 1;
    const day = now.getDate();

    const isQuarterEnd =
      (month === 3 && day === 31) ||
      (month === 6 && day === 30) ||
      (month === 9 && day === 30) ||
      (month === 12 && day === 31);

    const isYearEnd =
      month === 12 && day === 31;
    if (isQuarterEnd) {
      const quarter = Math.ceil(month / 3);
      const quarterTitle = `Q${quarter} Financial Summary ${now.getFullYear()}`;

      const existingQuarterly = await this.reportsRepository.findOne({
        subscriber: { id: user.id },
        reportType: 'QUARTERLY',
        title: quarterTitle,
      });

      const quarterlySummaryParts = [
        `Quarterly account review for Q${quarter}.`,
        `Current subscription: ${product}.`,
        `Latest payment: ${amount} ${currency}.`,
        isUpgrade
          ? `Subscription upgraded from ${previousPlan} to ${product}.`
          : '',
      ];

      if (existingQuarterly) {
        await this.reportsRepository.update(existingQuarterly.id, {
          summary: mergeSummary(existingQuarterly.summary, quarterlySummaryParts),
        });
      } else {
        await this.reportsRepository.create({
          subscriber: {
            connect: { id: user.id },
          },
          reportType: 'QUARTERLY',
          title: quarterTitle,
          summary: quarterlySummaryParts.filter(Boolean).join(' '),
        });
      }
    }
    if (isYearEnd) {
      const annualTitle = `Annual Financial Report ${now.getFullYear()}`;

      const existingAnnual = await this.reportsRepository.findOne({
        subscriber: { id: user.id },
        reportType: 'ANNUAL',
        title: annualTitle,
      });

      const annualSummaryParts = [
        `Annual subscription review.`,
        `Current active plan: ${product}.`,
        `Latest payment amount: ${amount} ${currency}.`,
        isUpgrade
          ? `Subscription upgraded during the year.`
          : '',
      ];

      if (existingAnnual) {
        await this.reportsRepository.update(existingAnnual.id, {
          summary: mergeSummary(existingAnnual.summary, annualSummaryParts),
        });
      } else {
        await this.reportsRepository.create({
          subscriber: {
            connect: { id: user.id },
          },
          reportType: 'ANNUAL',
          title: annualTitle,
          summary: annualSummaryParts.filter(Boolean).join(' '),
        });
      }
    }
    await this.reportsRepository.create({
      subscriber: {
        connect: { id: user.id },
      },
      reportType: 'MONTHLY',
      title: isUpgrade
        ? `Subscription Upgrade - ${product}`
        : `Subscription Payment - ${product}`,
      summary: isUpgrade
        ? `Customer upgraded from ${previousPlan} to ${product}. Payment received: ${amount} ${currency}.`
        : `Payment received for ${product}. Amount: ${amount} ${currency}.`,
    });
    // check if the time is in quarter period and if so, create a quarterly report as well or if it;s in the end of the year create report for this year
    await this.auditLogsRepository.create({
      userId: user.id,
      action: isUpgrade
        ? 'SUBSCRIPTION_UPGRADED'
        : 'SUBSCRIPTION_PAYMENT_RECEIVED',

      entityType: 'Subscription',
      entityId: subscription.id,

      newValues: {
        plan: product?.toUpperCase(),
        amount,
        currency,
        subscriptionId: input.subscriptionId,
      },
    });

    // Upgrade email
    if (isUpgrade) {
      sendSubsUpgradeEmail({
        email: user.email,
        firstName: user.firstName,
        previousPlan,
        newPlan: product?.toUpperCase(),
        amount,
        currency,
      }).catch((error: any) => {
        logger.error(
          '[auth-service] Failed to send upgrade email',
          error
        );
      });
    }

    // Registration email
    if (!user.registrationCompleted) {
      const displayName =
        user.firstName ||
        user.email.split('@')[0];

      sendRegistrationEmail(
        user.email,
        displayName
      ).catch((error) => {
        logger.error(
          '[auth-service] Failed to send registration email',
          error
        );
      });
    }

    const { passwordHash: _, ...userWithoutPassword } =
      user;

    return userWithoutPassword;
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

    // In production, send email with reset link
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
}
