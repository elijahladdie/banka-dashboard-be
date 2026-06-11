import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  paddleSignUpSchema,
  completeRegistrationSchema,
} from '../validators';

const router = Router();

const authRepository = new AuthRepository();
const auditLogsRepository = new AuditLogsRepository();
const subscriptionsRepository = new SubscriptionsRepository();
const authService = new AuthService(authRepository, auditLogsRepository, subscriptionsRepository);
const authController = new AuthController(authService);

// Public routes with rate limiting
router.post('/signup', authRateLimiter, validateRequest(signUpSchema), asyncWrapper(authController.signUp.bind(authController)));
router.post('/signup/paddle', authRateLimiter, validateRequest(paddleSignUpSchema), asyncWrapper(authController.signUpFromPaddle.bind(authController)));
router.post('/complete-registration', authRateLimiter, validateRequest(completeRegistrationSchema), asyncWrapper(authController.completeRegistration.bind(authController)));
router.get('/pending-registration', authRateLimiter, asyncWrapper(authController.checkPendingRegistration.bind(authController)));
router.post('/signin', authRateLimiter, validateRequest(signInSchema), asyncWrapper(authController.signIn.bind(authController)));
router.post('/refresh-token', validateRequest(refreshTokenSchema), asyncWrapper(authController.refreshToken.bind(authController)));
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), asyncWrapper(authController.forgotPassword.bind(authController)));
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), asyncWrapper(authController.resetPassword.bind(authController)));

// Protected routes
router.post('/logout', jwtAuthGuard, asyncWrapper(authController.logout.bind(authController)));
router.post('/verify-email', jwtAuthGuard, asyncWrapper(authController.verifyEmail.bind(authController)));
router.get('/me', jwtAuthGuard, asyncWrapper(authController.getMe.bind(authController)));

export default router;
