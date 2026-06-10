import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsRepository } from '../repositories/implementations/analytics.repository';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const analyticsRepository = new AnalyticsRepository();
const analyticsService = new AnalyticsService(analyticsRepository);
const analyticsController = new AnalyticsController(analyticsService);

router.use(jwtAuthGuard);
router.use(rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER));

router.get('/overview', analyticsController.getOverview);
router.get('/revenue-by-plan', analyticsController.getRevenueByPlan);
router.get('/monthly-revenue', analyticsController.getMonthlyRevenue);
router.get('/advisor-capacity', analyticsController.getAdvisorCapacity);
router.get('/goal-completion-rate', analyticsController.getGoalCompletionRate);

export default router;
