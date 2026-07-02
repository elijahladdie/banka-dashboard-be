import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import {
  SignUpInput,
  SignInInput,
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
import { BCRYPT_SALT_ROUNDS, JWT_ACCESS_SECRET } from '../constants/constants';
import { generateTokens } from '../helpers/helper';
import logger from '../utils/logger';

export class AuthService {
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;
  constructor() {
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  private extractRoles(user: { userRoles?: { role: { slug: string } }[] }): string[] {
    return user.userRoles?.map((ur) => ur.role.slug) ?? [];
  }

  async signUp(input: SignUpInput): Promise<{ user: any; token: string }> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.authRepository.createUserWithRole({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      roleSlug: 'client',
    });

    const roles = this.extractRoles(user);
    const token = await generateTokens({ userId: user.id, email: user.email, roles });
    const { password: _, userRoles, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token: token };
  }

  async signIn(input: SignInInput): Promise<{ user: any; token: string }> {
    const user = await this.authRepository.findByEmailWithRoles(input.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.closedAt) {
      throw new UnauthorizedError('This account has been deactivated.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('This account has been suspended.');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedError('This account is inactive.');
    }

    if (!user.isRegComplete) {
      throw new UnauthorizedError('Please complete your registration first.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const updatedUser = await this.authRepository.updateUser(user.id, {
      lastLoginAt: new Date(),
    });

    const roles = this.extractRoles(user);
    const token = generateTokens({ userId: user.id, email: user.email, roles });
    const { password: _, userRoles, ...userWithoutPassword } = { ...updatedUser, userRoles: user.userRoles };
    return { user: userWithoutPassword, token };
  }

  async completeRegistration(input: CompleteRegistrationInput): Promise<{ user: any; token: string }> {
    const user = await this.authRepository.findByEmailWithRoles(input.email);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.isRegComplete) {
      throw new ValidationError('Registration is already completed.');
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const updated = await this.authRepository.updateUser(user.id, {
      password: passwordHash,
      phoneNumber: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      isVerified: true,
      isRegComplete: true,
      status: 'ACTIVE',
    });

    const roles = this.extractRoles(user);
    const token = generateTokens({ userId: updated.id, email: updated.email, roles });

    const { password: _, userRoles, ...userWithoutPassword } = { ...updated, userRoles: user.userRoles };
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
      isRegComplete: user.isRegComplete,
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

  async verifyEmail(userId: string): Promise<void> {
    await this.authRepository.updateUser(userId, {
      isVerified: true,
      status: 'ACTIVE',
    });
  }
}