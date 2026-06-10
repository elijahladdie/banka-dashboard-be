import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, swaggerSpec } from './helpers';
import { logger } from './utils/logger';
import router from './routes';

// Route imports


const app = express();

// ============================================================
// Global Middleware
// ============================================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
// app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser(process.env.COOKIE_SECRET));

// Logging
if (process.env.NODE_ENV !== 'test') {
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

app.use('/api', router)
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
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
  });
});

// ============================================================
// Error Handler
// ============================================================

app.use(errorHandler);

export default app;
