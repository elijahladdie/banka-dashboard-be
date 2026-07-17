import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { BCRYPT_SALT_ROUNDS } from '../constants/constants';
import { generateTokens } from './helper';
import { TOKEN } from '../constants';
import { SafeUser, UserRoleInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function extractRoles(user: { userRoles?: UserRoleInfo[] }): string[] {
  return user.userRoles?.map((ur) => ur.role.slug) ?? [];
}

export function sanitizeUser(user: User & { userRoles?: UserRoleInfo[] }): SafeUser {
  const { password, userRoles, ...rest } = user;
  const roles = extractRoles(user);
  return { ...rest, roles } as SafeUser;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createAuthResponse(user: User & { userRoles?: UserRoleInfo[] }): { user: SafeUser; token: string } {
  const roles = extractRoles(user);
  const token = generateTokens({ userId: user.id, email: user.email, roles });
  const safeUser = sanitizeUser(user);
  return { user: safeUser, token };
}

export function generateResetToken(): { resetToken: string; resetTokenExpiry: Date } {
  return {
    resetToken: uuidv4(),
    resetTokenExpiry: new Date(Date.now() + TOKEN.RESET_TOKEN_EXPIRY),
  };
}
