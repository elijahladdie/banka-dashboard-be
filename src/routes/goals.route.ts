import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const goalsController = new GoalsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER, ROLES.FINANCIAL_ADVISOR),
  asyncWrapper(goalsController.findAll.bind(goalsController))
);

router.get('/my', asyncWrapper(goalsController.findBySubscriber.bind(goalsController)));
router.get('/:id', asyncWrapper(goalsController.findById.bind(goalsController)));
router.get('/subscriber/:subscriberId', asyncWrapper(goalsController.findBySubscriber.bind(goalsController)));

router.post(
  '/',
  rolesGuard(ROLES.SUBSCRIBER, ROLES.FINANCIAL_ADVISOR),
  asyncWrapper(goalsController.create.bind(goalsController))
);

router.put('/:id', asyncWrapper(goalsController.update.bind(goalsController)));
router.patch('/:id/progress', asyncWrapper(goalsController.updateProgress.bind(goalsController)));
router.delete('/:id', asyncWrapper(goalsController.delete.bind(goalsController)));

export default router;
