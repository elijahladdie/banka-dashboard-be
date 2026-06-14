import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { globalRateLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './helpers';
import logger from './utils/logger';
import { ResponseHandler } from './utils/response-handler';
import router from './routes';
import { CORS_ORIGIN, COOKIE_SECRET, NODE_ENV } from './utils/constants';

const app = express();

// ============================================================
// Global Middleware
// ============================================================

// Security
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing — capture raw body before parsing for webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf.toString('utf-8');
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser(COOKIE_SECRET));

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
}

// Rate limiting
app.use(globalRateLimiter);

// ============================================================
// Health Check
// ============================================================

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Banka API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================
// API Routes
// ============================================================

app.use('/api', router);

// ============================================================
// Swagger Documentation
// ============================================================

app.use('/api/docs', [swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Banka API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
})] as any);

// ============================================================
// 404 Handler
// ============================================================

app.use((_req, res) => {
  ResponseHandler.error(res, 404, 'Route not found', 404);
});

// ============================================================
// Global Error Handler (safety net)
// ============================================================

import { errorHandler } from './helpers';
app.use(errorHandler);

export default app;
