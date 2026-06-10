import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { jwtAuthGuard } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators';

const router = Router();

const authRepository = new AuthRepository();
const auditLogsRepository = new AuditLogsRepository();
const authService = new AuthService(authRepository, auditLogsRepository);
const authController = new AuthController(authService);

// Public routes with rate limiting
router.post('/signup', authRateLimiter, validateRequest(signUpSchema), authController.signUp);
router.post('/signin', authRateLimiter, validateRequest(signInSchema), authController.signIn);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', jwtAuthGuard, authController.logout);
router.post('/verify-email', jwtAuthGuard, authController.verifyEmail);
router.get('/me', jwtAuthGuard, authController.getMe);

export default router;
