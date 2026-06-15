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
    const { user, tokens } = await this.authService.signUp(req.body);
    ResponseHandler.success(res, { user, tokens }, 'Account created successfully.', 100, 201);
  }

  async signUpFromPaddle(req: Request, res: Response) {
    const { user } = await this.authService.signUpFromPaddle(req.body);
    ResponseHandler.success(res, user, 'Partial account created from Paddle.', 100, 201);
  }

  async completeRegistration(req: Request, res: Response) {
    const { user, tokens } = await this.authService.completeRegistration(req.body);
    ResponseHandler.success(res, { user, tokens }, 'Registration completed successfully.');
  }

  async checkPendingRegistration(req: Request, res: Response) {
    const result = await this.authService.checkPendingRegistration(req.query.email as string);
    ResponseHandler.success(res, result, 'Pending registration check completed.');
  }

  async signIn(req: Request, res: Response) {
    const { user, tokens } = await this.authService.signIn(req.body);
    ResponseHandler.success(res, { user, tokens }, 'Signed in successfully.');
  }
  async logout(req: AuthenticatedRequest, res: Response) {
    await this.authService.logout(req.user!.userId);
    ResponseHandler.success(res, null, 'Signed out successfully.');
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
