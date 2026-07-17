import { errorHandler } from './helpers';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './utils/logger';
import { ResponseHandler } from './utils/response-handler';
import router from './routes';
import { CORS_ORIGIN, NODE_ENV, MESSAGES } from './constants/constants';

const app = express();

app.set('trust proxy', true);
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
if (NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
}

app.use('/api', router)

app.use((_req, res) => {
  ResponseHandler.error(res, 404, MESSAGES.ROUTE_NOT_FOUND, 404);
});

app.use(errorHandler);

export default app;
