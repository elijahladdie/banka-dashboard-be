import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller';
import { GoalsService } from '../services/goals.service';
import { GoalsRepository } from '../repositories/implementations/goals.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const goalsRepository = new GoalsRepository();
const auditLogsRepository = new AuditLogsRepository();
const goalsService = new GoalsService(goalsRepository, auditLogsRepository);
const goalsController = new GoalsController(goalsService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER, ROLES.FINANCIAL_ADVISOR),
  goalsController.findAll
);

router.get('/my', goalsController.findBySubscriber);
router.get('/:id', goalsController.findById);
router.get('/subscriber/:subscriberId', goalsController.findBySubscriber);

router.post(
  '/',
  rolesGuard(ROLES.SUBSCRIBER, ROLES.FINANCIAL_ADVISOR),
  goalsController.create
);

router.put('/:id', goalsController.update);
router.patch('/:id/progress', goalsController.updateProgress);
router.delete('/:id', goalsController.delete);

export default router;
