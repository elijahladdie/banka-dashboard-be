import { AuthRepository } from '../repositories/implementations/auth.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import {
  SignUpInput,
  SignInInput,
  CompleteRegistrationInput,
  PendingRegistrationResult,
  AuthResponse,
  JwtDecodedPayload,
  UserWithRoles,
} from '../types';
import { ConflictError, UnauthorizedError, NotFoundError, ValidationError } from '../helpers';
import { hashPassword, verifyPassword, createAuthResponse, sanitizeUser, generateResetToken, extractRoles } from '../helpers/auth.helper';
import { MESSAGES } from '../constants';

export class AuthService {
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const existing = await this.authRepository.findByEmail(input.email);
    if (existing) throw new ConflictError(MESSAGES.AUTH.EMAIL_EXISTS);

    const password = await hashPassword(String(input.password));
    const user = await this.authRepository.createUserWithRole({
      email: input.email.toLowerCase(),
      password, 
      firstName: input.firstName,
       lastName: input.lastName,
      phoneNumber: input.phoneNumber, 
      roleSlug: 'client',
      source: input.source || 'signup',
    });
    return createAuthResponse(user);
  }

  async signIn(input: SignInInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmailWithRoles(input.email.toLowerCase());
    if (!user) throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    if (user.closedAt) throw new UnauthorizedError(MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
    if (user.status === 'SUSPENDED') throw new UnauthorizedError(MESSAGES.AUTH.ACCOUNT_SUSPENDED);
    if (user.status === 'INACTIVE') throw new UnauthorizedError(MESSAGES.AUTH.ACCOUNT_INACTIVE);
    if (!user.isRegComplete) throw new UnauthorizedError(MESSAGES.AUTH.COMPLETE_REGISTRATION_FIRST);

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);

    await this.authRepository.updateUser(user.id, { lastLoginAt: new Date() });
    const { user: safeUser, token } = createAuthResponse({ ...user, userRoles: user.userRoles });
    return { user: safeUser, token };
  }

  async completeRegistration(input: CompleteRegistrationInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmailWithRoles(input.email);
    if (!user) throw new NotFoundError(MESSAGES.USERS.NOT_FOUND);
    if (user.isRegComplete) throw new ValidationError(MESSAGES.AUTH.REGISTRATION_ALREADY_COMPLETED);

    const password = await hashPassword(input.password);
    const updated = await this.authRepository.updateUser(user.id, {
      password: password, phoneNumber: input.phone,
      firstName: input.firstName, lastName: input.lastName,
      isVerified: true, isRegComplete: true, status: 'ACTIVE',
    });
    return createAuthResponse({ ...updated, userRoles: user.userRoles });
  }

  async checkPendingRegistration(token: string): Promise<PendingRegistrationResult> {
    const jwt = await import('jsonwebtoken');
    const { JWT_ACCESS_SECRET } = await import('../constants/constants');
    const decoded = jwt.default.verify(token, JWT_ACCESS_SECRET) as JwtDecodedPayload;
    if (!decoded?.email) throw new ValidationError(MESSAGES.AUTH.INVALID_TOKEN_SHORT);

    const user = await this.authRepository.findByEmail(decoded.email.toLowerCase());
    if (!user) return { exists: false };
    return { exists: true, email: user.email, fullName: `${user.firstName} ${user.lastName}`.trim(), isRegComplete: user.isRegComplete };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    if (!user) throw new ValidationError(MESSAGES.AUTH.FORGOT_PASSWORD);
    const { resetToken } = generateResetToken();
    return { resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const password = await hashPassword(newPassword);
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.authRepository.updateUser(userId, { isVerified: true, status: 'ACTIVE' });
  }
}