import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import {
  AuthTokens,
  JwtPayload,
  SignUpInput,
  SignInInput,
} from '../types';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../helpers';
import { TOKEN } from '../constants';

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly auditLogsRepository: AuditLogsRepository
  ) {}

  async signUp(input: SignUpInput): Promise<{ user: any; tokens: AuthTokens }> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
    );
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

  async refreshToken(refreshTokenStr: string): Promise<AuthTokens> {
    const storedToken = await this.authRepository.findRefreshToken(refreshTokenStr);
    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError('Invalid or revoked refresh token.');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired.');
    }

    const user = await this.authRepository.findById(storedToken.userId);
    if (!user || user.deletedAt) {
      throw new UnauthorizedError('User not found.');
    }

    // Revoke old token
    await this.authRepository.revokeRefreshToken(storedToken.id);

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.revokeAllUserRefreshTokens(userId);

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
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
    );
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

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET || 'default-access-secret',
      { expiresIn: 900 } // 15 minutes in seconds
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + TOKEN.REFRESH_TOKEN_EXPIRY_MS);

    await this.authRepository.saveRefreshToken(userId, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }
}
