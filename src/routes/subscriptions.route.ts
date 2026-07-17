import { Router } from 'express';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdminOrAdvisor } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateSubscriptionSchema } from '../validators';

const router = Router();
const subscriptionsController = new SubscriptionsController();

router.use(jwtAuthGuard);

router.get('/', isAdminOrAdvisor, asyncWrapper(subscriptionsController.findAll.bind(subscriptionsController)));
router.get('/access-info', asyncWrapper(subscriptionsController.getAccessInfo.bind(subscriptionsController)));
router.get('/me', asyncWrapper(subscriptionsController.findByUserId.bind(subscriptionsController)));
router.get('/:id', asyncWrapper(subscriptionsController.findById.bind(subscriptionsController)));
router.post('/', asyncWrapper(subscriptionsController.create.bind(subscriptionsController)));
router.put('/:id', validateRequest(updateSubscriptionSchema), asyncWrapper(subscriptionsController.update.bind(subscriptionsController)));
router.post('/:id/cancel', asyncWrapper(subscriptionsController.cancel.bind(subscriptionsController)));
router.post('/:id/reactivate', asyncWrapper(subscriptionsController.reactivate.bind(subscriptionsController)));

export default router;
