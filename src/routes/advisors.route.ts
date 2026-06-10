import { Router } from 'express';
import { AdvisorsController } from '../controllers/advisors.controller';
import { AdvisorsService } from '../services/advisors.service';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const advisorsRepository = new AdvisorsRepository();
const auditLogsRepository = new AuditLogsRepository();
const advisorsService = new AdvisorsService(advisorsRepository, auditLogsRepository);
const advisorsController = new AdvisorsController(advisorsService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER, ROLES.FINANCIAL_ADVISOR),
  advisorsController.findAll
);

router.get('/:id', advisorsController.findById);

router.post(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  advisorsController.create
);

router.put(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  advisorsController.update
);

router.patch(
  '/:id/toggle-availability',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  advisorsController.toggleAvailability
);

router.delete(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN),
  advisorsController.delete
);

export default router;
