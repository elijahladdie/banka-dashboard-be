import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../helpers';
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new RateLimitError('Too many authentication attempts. Please try again later.');
  },
});
