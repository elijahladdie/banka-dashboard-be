import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdminOrAdvisor, isClientOrAdvisor } from '../middleware';

const router = Router();

const goalsController = new GoalsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  isAdminOrAdvisor,
  asyncWrapper(goalsController.findAll.bind(goalsController))
);

router.get('/my', asyncWrapper(goalsController.findByClient.bind(goalsController)));
router.get('/:id', asyncWrapper(goalsController.findById.bind(goalsController)));
router.get('/client/:clientId', asyncWrapper(goalsController.findByClient.bind(goalsController)));

router.post(
  '/',
  isClientOrAdvisor,
  asyncWrapper(goalsController.create.bind(goalsController))
);

router.put('/:id', asyncWrapper(goalsController.update.bind(goalsController)));
router.patch('/:id/progress', asyncWrapper(goalsController.updateProgress.bind(goalsController)));
router.delete('/:id', asyncWrapper(goalsController.delete.bind(goalsController)));

export default router;
