import { errorHandler } from './helpers';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { globalRateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';
import { ResponseHandler } from './utils/response-handler';
import router from './routes';
import { CORS_ORIGIN, COOKIE_SECRET, NODE_ENV } from './utils/constants';

const app = express();

app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf.toString('utf-8');
  },
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(COOKIE_SECRET));
if (NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
}
app.use(globalRateLimiter);
app.use('/api', router)

app.use((_req, res) => {
  ResponseHandler.error(res, 404, 'Route not found', 404);
});

app.use(errorHandler);

export default app;
