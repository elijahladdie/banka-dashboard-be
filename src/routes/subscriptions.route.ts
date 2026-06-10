import { Router } from 'express';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { SubscriptionsService } from '../services/subscriptions.service';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const subscriptionsRepository = new SubscriptionsRepository();
const auditLogsRepository = new AuditLogsRepository();
const subscriptionsService = new SubscriptionsService(subscriptionsRepository, auditLogsRepository);
const subscriptionsController = new SubscriptionsController(subscriptionsService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  subscriptionsController.findAll
);

router.get('/my', subscriptionsController.findByUserId);
router.get('/:id', subscriptionsController.findById);
router.post('/', subscriptionsController.create);
router.put('/:id', subscriptionsController.update);
router.post('/:id/cancel', subscriptionsController.cancel);

export default router;
