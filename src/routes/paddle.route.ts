import { Router } from 'express';
import { PaddleController } from '../controllers/paddle.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdmin } from '../middleware';
import { verifyActivationSignature, verifyCreationSignature } from '../middleware/validateRequest';

const router = Router();

const paddleController = new PaddleController();

router.post('/webhooks/subscription-creation',
    asyncWrapper(verifyCreationSignature),
    asyncWrapper(paddleController.subscriptionCreation.bind(paddleController)));// change names
router.post('/webhooks/subscription-activation',
    asyncWrapper(verifyActivationSignature),
    asyncWrapper(paddleController.subscriptionActivation.bind(paddleController)));
router.get('/products', asyncWrapper(paddleController.getProducts.bind(paddleController)));

router.use(jwtAuthGuard);
router.use(isAdmin);
router.get('/transactions', asyncWrapper(paddleController.getTransactions.bind(paddleController)));
export default router;
