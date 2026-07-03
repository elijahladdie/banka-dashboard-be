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

export class AuthService {
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const existing = await this.authRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('A user with this email already exists.');

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
    if (!user) throw new UnauthorizedError('Invalid email or password.');
    if (user.closedAt) throw new UnauthorizedError('This account has been deactivated.');
    if (user.status === 'SUSPENDED') throw new UnauthorizedError('This account has been suspended.');
    if (user.status === 'INACTIVE') throw new UnauthorizedError('This account is inactive.');
    if (!user.isRegComplete) throw new UnauthorizedError('Please complete your registration first.');

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid email or password.');

    await this.authRepository.updateUser(user.id, { lastLoginAt: new Date() });
    const { user: safeUser, token } = createAuthResponse({ ...user, userRoles: user.userRoles });
    return { user: safeUser, token };
  }

  async completeRegistration(input: CompleteRegistrationInput): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmailWithRoles(input.email);
    if (!user) throw new NotFoundError('User');
    if (user.isRegComplete) throw new ValidationError('Registration is already completed.');

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
    if (!decoded?.email) throw new ValidationError('Invalid token.');

    const user = await this.authRepository.findByEmail(decoded.email.toLowerCase());
    if (!user) return { exists: false };
    return { exists: true, email: user.email, fullName: `${user.firstName} ${user.lastName}`.trim(), isRegComplete: user.isRegComplete };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.authRepository.findByEmail(email.toLowerCase());
    if (!user) throw new ValidationError('If the email exists, a reset link has been sent.');
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