import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';

export class AuthController {
  private readonly authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  async signUp(req: Request, res: Response) {
    const { user, token } = await this.authService.signUp(req.body);
    ResponseHandler.success(res, { user, token }, 'Account created successfully.', 100, 201);
  }

  async completeRegistration(req: Request, res: Response) {
    const { user, token } = await this.authService.completeRegistration(req.body);
    ResponseHandler.success(res, { user, token }, 'Registration completed successfully.');
  }

  async checkPendingRegistration(req: Request, res: Response) {
    const result = await this.authService.checkPendingRegistration(req.query.token as string);
    ResponseHandler.success(res, result, 'Pending registration check completed.');
  }

  async signIn(req: Request, res: Response) {
    const { user, token } = await this.authService.signIn(req.body);
    ResponseHandler.success(res, { user, token }, 'Signed in successfully.');
  }
  async forgotPassword(req: Request, res: Response) {
    const { resetToken } = await this.authService.forgotPassword(req.body.email);
    ResponseHandler.success(res, { resetToken }, 'If the email exists, a reset link has been sent.');
  }

  async resetPassword(req: Request, res: Response) {
    await this.authService.resetPassword(req.body.token, req.body.password);
    ResponseHandler.success(res, null, 'Password has been reset successfully.');
  }

  async verifyEmail(req: AuthenticatedRequest, res: Response) {
    await this.authService.verifyEmail(req.user!.userId);
    ResponseHandler.success(res, null, 'Email verified successfully.');
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    
    ResponseHandler.success(res, { user: req.user }, 'User profile retrieved.');
  }
}
