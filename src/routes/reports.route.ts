import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';
import { ReportsRepository } from '../repositories/implementations/reports.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
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
  reportsController.findAll
);

router.get('/:id', reportsController.findById);
router.post('/', reportsController.create);
router.put('/:id', reportsController.update);
router.delete('/:id', reportsController.delete);

export default router;
