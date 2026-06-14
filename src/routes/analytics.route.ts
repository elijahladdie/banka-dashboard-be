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
router.get('/revenue-by-plan', asyncWrapper(analyticsController.getRevenueByPlan.bind(analyticsController)));
router.get('/monthly-revenue', asyncWrapper(analyticsController.getMonthlyRevenue.bind(analyticsController)));
router.get('/advisor-capacity', asyncWrapper(analyticsController.getAdvisorCapacity.bind(analyticsController)));
router.get('/goal-completion-rate', asyncWrapper(analyticsController.getGoalCompletionRate.bind(analyticsController)));

export default router;
