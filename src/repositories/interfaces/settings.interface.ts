import { User } from '@prisma/client';

export interface ISettingsRepository {
  findById(id: string): Promise<User | null>;
  updateProfile(id: string, data: Partial<User>): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<User>;
}
