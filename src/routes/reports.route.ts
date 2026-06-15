import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';
import { ReportsRepository } from '../repositories/implementations/reports.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const reportsRepository = new ReportsRepository();
const auditLogsRepository = new AuditLogsRepository();
const reportsService = new ReportsService(reportsRepository, auditLogsRepository);
const reportsController = new ReportsController(reportsService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER, ROLES.FINANCIAL_ADVISOR),
  asyncWrapper(reportsController.findAll.bind(reportsController))
);

router.get('/:id', asyncWrapper(reportsController.findById.bind(reportsController)));
router.post('/', asyncWrapper(reportsController.create.bind(reportsController)));
router.put('/:id', asyncWrapper(reportsController.update.bind(reportsController)));
router.delete('/:id', asyncWrapper(reportsController.delete.bind(reportsController)));

export default router;
