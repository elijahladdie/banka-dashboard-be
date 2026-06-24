import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const analyticsController = new AnalyticsController();

router.use(jwtAuthGuard);
router.use(rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER));

router.get('/overview', asyncWrapper(analyticsController.getOverview.bind(analyticsController)));


export default router;
