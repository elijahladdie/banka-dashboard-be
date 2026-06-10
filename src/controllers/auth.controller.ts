import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../helpers';
import { ResponseHandler } from '../utils/response-handler';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signUp = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await this.authService.signUp(req.body);
    ResponseHandler.success(res, { user, tokens }, 'Account created successfully.', 100, 201);
  });

  signIn = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await this.authService.signIn(req.body);
    ResponseHandler.success(res, { user, tokens }, 'Signed in successfully.');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await this.authService.refreshToken(refreshToken);
    ResponseHandler.success(res, { tokens }, 'Token refreshed successfully.');
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.authService.logout(req.user!.userId);
    ResponseHandler.success(res, null, 'Signed out successfully.');
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { resetToken } = await this.authService.forgotPassword(req.body.email);
    ResponseHandler.success(res, { resetToken }, 'If the email exists, a reset link has been sent.');
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.resetPassword(req.body.token, req.body.password);
    ResponseHandler.success(res, null, 'Password has been reset successfully.');
  });

  verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.authService.verifyEmail(req.user!.userId);
    ResponseHandler.success(res, null, 'Email verified successfully.');
  });

  getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    ResponseHandler.success(res, { user: req.user }, 'User profile retrieved.');
  });
}
