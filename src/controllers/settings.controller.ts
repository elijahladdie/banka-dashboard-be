import { Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.settingsService.getProfile(req.user!.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile retrieved successfully.',
      data: userWithoutPassword,
    });
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await this.settingsService.updateProfile(req.user!.userId, req.body, req.user!.userId);
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully.',
      data: userWithoutPassword,
    });
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await this.settingsService.changePassword(
      req.user!.userId,
      currentPassword,
      newPassword,
      req.user!.userId
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully.',
    });
  });
}
