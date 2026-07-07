import { Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class SettingsController {
  private readonly settingsService: SettingsService;
  constructor() {
    this.settingsService = new SettingsService();
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    const user = await this.settingsService.getProfile(req.user!.userId);
    ResponseHandler.success(res, user, MESSAGES.SETTINGS.PROFILE_RETRIEVED);
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const user = await this.settingsService.updateProfile(req.user!.userId, req.body, req.user!.userId);
    ResponseHandler.success(res, user, MESSAGES.SETTINGS.PROFILE_UPDATED);
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    const { currentPassword, newPassword } = req.body;
    await this.settingsService.changePassword(req.user!.userId, currentPassword, newPassword, req.user!.userId);
    ResponseHandler.success(res, null, MESSAGES.SETTINGS.PASSWORD_CHANGED);
  }
}
