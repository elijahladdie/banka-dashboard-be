import { Router } from 'express';
import { PaddleService } from '../services/paddle.service';
import { PaddleController } from '../controllers/paddle.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const paddleService = new PaddleService();
const paddleController = new PaddleController(paddleService);

// Webhook endpoint — must be public (no auth), Paddle signs requests.
// The raw body is captured via express.json({ verify }) in app.ts before parsing.
router.post('/webhooks', asyncWrapper(paddleController.handleWebhook.bind(paddleController)));

// router.use(jwtAuthGuard);
// router.use(rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER, ROLES.FINANCIAL_ADVISOR));

router.get('/products', asyncWrapper(paddleController.getProducts.bind(paddleController)));

export default router;
