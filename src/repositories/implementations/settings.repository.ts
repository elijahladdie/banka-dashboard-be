import { User } from '@prisma/client';
import prisma from '../../utils/prisma';
import { ISettingsRepository } from '../interfaces/settings.interface';

export class SettingsRepository implements ISettingsRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
