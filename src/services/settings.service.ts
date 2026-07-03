import { User } from '@prisma/client';
import { SettingsRepository } from '../repositories/implementations/settings.repository';
import { NotFoundError, ValidationError } from '../helpers';
import { hashPassword, verifyPassword } from '../helpers/auth.helper';

export class SettingsService {
  private readonly settingsRepository: SettingsRepository;
  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.settingsRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateProfile(userId: string, data: Partial<User>, _actorId: string): Promise<User> {
    await this.getProfile(userId);
    return this.settingsRepository.updateProfile(userId, data);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, _actorId: string): Promise<void> {
    const user = await this.getProfile(userId);
    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) throw new ValidationError('Current password is incorrect.');
    const password = await hashPassword(newPassword);
    await this.settingsRepository.updatePassword(userId, password);
  }
}
