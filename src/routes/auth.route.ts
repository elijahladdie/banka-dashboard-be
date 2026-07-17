import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  completeRegistrationSchema,
} from '../validators';

const router = Router();

const authController = new AuthController();

// Public routes with rate limiting
router.post('/signup', authRateLimiter, validateRequest(signUpSchema), asyncWrapper(authController.signUp.bind(authController)));
router.post('/complete-registration', authRateLimiter, validateRequest(completeRegistrationSchema), asyncWrapper(authController.completeRegistration.bind(authController)));
router.get('/pending-registration', authRateLimiter, asyncWrapper(authController.checkPendingRegistration.bind(authController)));
router.post('/signin', authRateLimiter, validateRequest(signInSchema), asyncWrapper(authController.signIn.bind(authController)));
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), asyncWrapper(authController.forgotPassword.bind(authController)));
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), asyncWrapper(authController.resetPassword.bind(authController)));

// Protected routes
router.post('/verify-email', jwtAuthGuard, asyncWrapper(authController.verifyEmail.bind(authController)));
router.get('/me', jwtAuthGuard, asyncWrapper(authController.getMe.bind(authController)));// returns user with embered subscrition and remove me under subscriptions

export default router;
