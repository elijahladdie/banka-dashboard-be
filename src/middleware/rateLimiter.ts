import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../helpers';
import { MESSAGES } from '../constants';
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new RateLimitError(MESSAGES.AUTH.TOO_MANY_ATTEMPTS);
  },
});
