import { Router } from 'express';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdminOrAdvisor } from '../middleware';

const router = Router();

const subscriptionsController = new SubscriptionsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  isAdminOrAdvisor,
  asyncWrapper(subscriptionsController.findAll.bind(subscriptionsController))
);

router.get('/my', asyncWrapper(subscriptionsController.findByUserId.bind(subscriptionsController)));
router.get('/:id', asyncWrapper(subscriptionsController.findById.bind(subscriptionsController)));
router.post('/', asyncWrapper(subscriptionsController.create.bind(subscriptionsController)));
router.put('/:id', asyncWrapper(subscriptionsController.update.bind(subscriptionsController)));
router.post('/:id/cancel', asyncWrapper(subscriptionsController.cancel.bind(subscriptionsController)));

export default router;
