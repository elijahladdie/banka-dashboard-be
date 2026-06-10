import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../helpers';

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new RateLimitError();
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new RateLimitError('Too many authentication attempts. Please try again later.');
  },
});
