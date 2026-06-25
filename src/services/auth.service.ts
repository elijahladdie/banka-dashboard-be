import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import {
  SignUpInput,
  SignInInput,
  PaddleSignUpInput,
  CompleteRegistrationInput,
  PendingRegistrationResult,
  AuthenticatedRequest,
} from '../types';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../helpers';
import { TOKEN } from '../constants';
import { BCRYPT_SALT_ROUNDS, JWT_ACCESS_SECRET, PLAN_NAME_MAP, SUBSCRIPTION_RANK } from '../utils/constants';
import { sendRegistrationEmail, sendSubsPlanChangeEmail } from './email.service';
import { generateTokens, normalizePaddleSubscription } from '../utils/helper';
import logger from '../utils/logger';

export class AuthService {
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;
  constructor() {
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  async signUp(input: SignUpInput): Promise<{ user: any; token: string }> {
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

    const token = await generateTokens({ userId: user.id, email: user.email, role: user.role });
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token: token };
  }

  async signIn(input: SignInInput): Promise<{ user: any; token: string }> {
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

    const token = generateTokens({ userId: user.id, email: user.email, role: user.role });
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return { user: userWithoutPassword, token };
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
    const token = generateTokens({ userId: user.id, email: user.email, role: user.role });
    // Send welcome / registration email
    await sendRegistrationEmail({ token, fullName: user.firstName, email: user.email, });
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }
  async syncCustomerFromPaddle({
    email,
    fullName,
    customerId,
  }: any) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      const placeholder = await bcrypt.hash(uuidv4(), 1);

      const newUser = await this.authRepository.createUser({
        email,
        firstName: fullName,
        passwordHash: placeholder,
        registrationCompleted: false,
        source: "paddle",
        lastName: ''
      });

      await this.subscriptionsRepository.create({
        userId: newUser.id,
        customerId,
        subscriptionId: "",
      });

      return newUser;
    }

    await this.subscriptionsRepository.upsertCustomer(user.id, {
      customerId,
    });

    return user;
  }
  async syncSubscriptionFromPaddle({
    customerId,
    subscriptionId,
    event,
  }: any) {
    const sub =
      await this.subscriptionsRepository.findOne({ customerId });

    if (!sub) return null;

    const normalized = normalizePaddleSubscription(event);

    await this.subscriptionsRepository.update(sub.id, {
      subscriptionId,
      plan: normalized.product,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      billingInterval: normalized.billingCycle.interval || "month",
    });

    return true;
  }
  async updateSubscriptionFromPaddle({
    customerId,
    subscriptionId,
    paddleEvent,
  }: any) {
    const subscription =
      await this.subscriptionsRepository.findOne({ customerId });

    if (!subscription) return null;

    const normalized =
      normalizePaddleSubscription(paddleEvent);

    const previousPlan = subscription.plan;
    const previousInterval =
      subscription.billingInterval || "month";

    const newPlan = normalized.product;
    const newInterval = normalized.billingCycle.interval || "month";

    await this.subscriptionsRepository.update(subscription.id, {
      subscriptionId,
      plan: newPlan,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      canceledAt: normalized.canceledAt,
      billingInterval: newInterval,
      metadata: {
        currency: normalized.currency,
        amount: normalized.amount,
        billingCycle: normalized.billingCycle,
        event: paddleEvent.event_type,
      },
    });

    const user = await this.authRepository.findById(
      subscription.userId
    );

    if (!user) return null;

    const previousRank =
      SUBSCRIPTION_RANK[`${previousPlan}:${previousInterval}`];

    const newRank =
      SUBSCRIPTION_RANK[`${newPlan}:${newInterval}`];

    const isUpgrade = newRank > previousRank;

    const changed =
      previousPlan !== newPlan ||
      previousInterval !== newInterval;

    if (changed) {
      await sendSubsPlanChangeEmail({
        email: user.email,
        firstName: user.firstName,
        previousPlan:
          PLAN_NAME_MAP[previousPlan] || previousPlan,
        newPlan: PLAN_NAME_MAP[newPlan] || newPlan,
        previousInterval,
        newInterval,
        isUpgrade,
      });
    }

    return user;
  }
  async completeRegistration(input: CompleteRegistrationInput): Promise<{ user: any; token: string }> {
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

    const token = generateTokens({ userId: updated.id, email: updated.email, role: updated.role });

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return { user: userWithoutPassword, token };
  }

  async checkPendingRegistration(token: string): Promise<PendingRegistrationResult> {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as unknown as AuthenticatedRequest['user'];
    if (!decoded || !decoded.email) {
      throw new ValidationError('Invalid token.');
    }
    const user = await this.authRepository.findByEmail(decoded.email.toLowerCase());
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


  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new ValidationError('If the email exists, a reset link has been sent.');
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + TOKEN.RESET_TOKEN_EXPIRY);

    await this.authRepository.updateUser(user.id, {});
    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(newPassword, salt);
  }
  async cancelSubscriptionFromPaddle({
    customerId,
    subscriptionId,
  }: any) {
    const subscription =
      await this.subscriptionsRepository.findOne({ customerId });

    if (!subscription) return null;

    await this.subscriptionsRepository.update(subscription.id, {
      status: "CANCELED",
      subscriptionId,
    });

    return true;
  }
  async handleTransactionCompleted({ customerId }: any) {
    const subscription =
      await this.subscriptionsRepository.findOne({ customerId });

    if (!subscription) return null;

    logger.info(`Transaction completed for subscription ${subscription.id} of user ${subscription.userId}`);
    return true;
  }
  async verifyEmail(userId: string): Promise<void> {
    await this.authRepository.updateUser(userId, {
      emailVerified: true,
      status: 'ACTIVE',
    });
  }
}