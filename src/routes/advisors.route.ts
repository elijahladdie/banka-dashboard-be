import { Router } from 'express';
import { AdvisorsController } from '../controllers/advisors.controller';
import { AdvisorsService } from '../services/advisors.service';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
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
  asyncWrapper(advisorsController.findAll.bind(advisorsController))
);

router.get('/:id', asyncWrapper(advisorsController.findById.bind(advisorsController)));

router.post(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(advisorsController.create.bind(advisorsController))
);

router.put(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(advisorsController.update.bind(advisorsController))
);

router.patch(
  '/:id/toggle-availability',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(advisorsController.toggleAvailability.bind(advisorsController))
);

router.delete(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN),
  asyncWrapper(advisorsController.delete.bind(advisorsController))
);

export default router;
