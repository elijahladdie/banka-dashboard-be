import { Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.settingsService.getProfile(req.user!.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    ResponseHandler.success(res, userWithoutPassword, 'Profile retrieved successfully.');
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.settingsService.updateProfile(req.user!.userId, req.body, req.user!.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    ResponseHandler.success(res, userWithoutPassword, 'Profile updated successfully.');
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await this.settingsService.changePassword(
      req.user!.userId,
      currentPassword,
      newPassword,
      req.user!.userId
    );
    ResponseHandler.success(res, null, 'Password changed successfully.');
  });
}
