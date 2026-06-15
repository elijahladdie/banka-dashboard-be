import { Router } from 'express';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { SubscriptionsService } from '../services/subscriptions.service';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
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
  asyncWrapper(subscriptionsController.findAll.bind(subscriptionsController))
);

router.get('/my', asyncWrapper(subscriptionsController.findByUserId.bind(subscriptionsController)));
router.get('/:id', asyncWrapper(subscriptionsController.findById.bind(subscriptionsController)));
router.post('/', asyncWrapper(subscriptionsController.create.bind(subscriptionsController)));
router.put('/:id', asyncWrapper(subscriptionsController.update.bind(subscriptionsController)));
router.post('/:id/cancel', asyncWrapper(subscriptionsController.cancel.bind(subscriptionsController)));

export default router;
