//export all routes here 
import authRoutes from './auth.route';
import usersRoutes from './users.route';
import subscriptionsRoutes from './subscriptions.route';
import advisorsRoutes from './advisors.route';
import assignmentsRoutes from './assignments.route';
import goalsRoutes from './goals.route';
import meetingsRoutes from './meetings.route';
import notificationsRoutes from './notifications.route';
import analyticsRoutes from './analytics.route';
import settingsRoutes from './settings.route';
import notesRoutes from './notes.route';
import paddleRoutes from './paddle.route';
import serviceRequestsRoutes from './service-requests.route';
import express from 'express';
import { swaggerSpec } from '../helpers';
import swaggerUi from 'swagger-ui-express';
import { RequestHandler } from 'express';

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/advisors', advisorsRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/goals', goalsRoutes);
router.use('/meetings', meetingsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/notes', notesRoutes);
router.use('/service-requests', serviceRequestsRoutes);
router.use('/paddle', paddleRoutes);

router.use('/docs', [swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Banka API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
})] as unknown as RequestHandler[]);
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Banka API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
export default router;