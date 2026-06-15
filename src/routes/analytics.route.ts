import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsRepository } from '../repositories/implementations/analytics.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const analyticsRepository = new AnalyticsRepository();
const analyticsService = new AnalyticsService(analyticsRepository);
const analyticsController = new AnalyticsController(analyticsService);

router.use(jwtAuthGuard);
router.use(rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER));

router.get('/overview', asyncWrapper(analyticsController.getOverview.bind(analyticsController)));
router.get('/revenue-by-plan', asyncWrapper(analyticsController.getRevenueByPlan.bind(analyticsController)));
router.get('/monthly-revenue', asyncWrapper(analyticsController.getMonthlyRevenue.bind(analyticsController)));
router.get('/advisor-capacity', asyncWrapper(analyticsController.getAdvisorCapacity.bind(analyticsController)));
router.get('/goal-completion-rate', asyncWrapper(analyticsController.getGoalCompletionRate.bind(analyticsController)));

export default router;
