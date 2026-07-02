import { Router } from 'express';
import { PaddleController } from '../controllers/paddle.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdmin } from '../middleware';

const router = Router();

const paddleController = new PaddleController();

router.post('/webhooks/creation', asyncWrapper(paddleController.handleCreationWebhook.bind(paddleController)));// change names
router.post('/webhooks/subscriptions', asyncWrapper(paddleController.handleSubscriptionWebhook.bind(paddleController)));
router.get('/products', asyncWrapper(paddleController.getProducts.bind(paddleController)));

router.use(jwtAuthGuard);
router.use(isAdmin);
router.get('/transactions', asyncWrapper(paddleController.getTransactions.bind(paddleController)));
export default router;
