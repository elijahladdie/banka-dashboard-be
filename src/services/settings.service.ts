import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { SettingsRepository } from '../repositories/implementations/settings.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { NotFoundError, ValidationError } from '../helpers';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants';

export class SettingsService {
  private readonly settingsRepository: SettingsRepository;
  private readonly auditLogsRepository: AuditLogsRepository;
  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.auditLogsRepository = new AuditLogsRepository();
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.settingsRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>, actorId: string): Promise<User> {
    const user = await this.getProfile(userId);

    const updated = await this.settingsRepository.updateProfile(userId, data);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: userId,
      oldValues: { firstName: user.firstName, lastName: user.lastName } as any,
      newValues: data as any,
    });

    return updated;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    actorId: string
  ): Promise<void> {
    const user = await this.getProfile(userId);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect.');
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.settingsRepository.updatePassword(userId, passwordHash);

    await this.auditLogsRepository.create({
      userId: actorId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
    });
  }
}
