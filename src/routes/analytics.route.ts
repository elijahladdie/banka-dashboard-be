import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, isAdmin } from '../middleware';

const router = Router();

const analyticsController = new AnalyticsController();

router.use(jwtAuthGuard);
router.use(isAdmin);

router.get('/overview', asyncWrapper(analyticsController.getOverview.bind(analyticsController)));


export default router;
