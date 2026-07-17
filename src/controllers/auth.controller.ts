import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class AuthController {
  private readonly authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  async signUp(req: Request, res: Response) {
    const { user, token } = await this.authService.signUp(req.body);
    ResponseHandler.success(res, { user, token }, MESSAGES.AUTH.ACCOUNT_CREATED, 100, 201);
  }

  async completeRegistration(req: Request, res: Response) {
    const { user, token } = await this.authService.completeRegistration(req.body);
    ResponseHandler.success(res, { user, token }, MESSAGES.AUTH.REGISTRATION_COMPLETED);
  }

  async checkPendingRegistration(req: Request, res: Response) {
    const result = await this.authService.checkPendingRegistration(req.query.token as string);
    ResponseHandler.success(res, result, MESSAGES.AUTH.PENDING_REGISTRATION_CHECK);
  }

  async signIn(req: Request, res: Response) {
    const { user, token } = await this.authService.signIn(req.body);
    ResponseHandler.success(res, { user, token }, MESSAGES.AUTH.SIGNED_IN);
  }
  async forgotPassword(req: Request, res: Response) {
    const { resetToken } = await this.authService.forgotPassword(req.body.email);
    ResponseHandler.success(res, { resetToken }, MESSAGES.AUTH.FORGOT_PASSWORD);
  }

  async resetPassword(req: Request, res: Response) {
    await this.authService.resetPassword(req.body.token, req.body.password);
    ResponseHandler.success(res, null, MESSAGES.AUTH.PASSWORD_RESET);
  }

  async verifyEmail(req: AuthenticatedRequest, res: Response) {
    await this.authService.verifyEmail(req.user!.userId);
    ResponseHandler.success(res, null, MESSAGES.AUTH.EMAIL_VERIFIED);
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    
    ResponseHandler.success(res, { user: req.user }, MESSAGES.AUTH.USER_PROFILE);
  }
}
