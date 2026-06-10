import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../constants';
import { asyncHandler } from '../helpers';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signUp = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await this.authService.signUp(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, tokens },
    });
  });

  signIn = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await this.authService.signIn(req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Signed in successfully.',
      data: { user, tokens },
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await this.authService.refreshToken(refreshToken);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: { tokens },
    });
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.authService.logout(req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Signed out successfully.',
    });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { resetToken } = await this.authService.forgotPassword(req.body.email);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
      data: { resetToken },
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.resetPassword(req.body.token, req.body.password);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  });

  verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.authService.verifyEmail(req.user!.userId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Email verified successfully.',
    });
  });

  getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User profile retrieved.',
      data: { user: req.user },
    });
  });
}
