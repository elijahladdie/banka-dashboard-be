import { User, RefreshToken } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<RefreshToken>;
  revokeAllUserRefreshTokens(userId: string): Promise<void>;
}
