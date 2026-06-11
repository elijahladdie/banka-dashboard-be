import { Router } from 'express';
import { AuditLogsController } from '../controllers/audit-logs.controller';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const auditLogsRepository = new AuditLogsRepository();
const auditLogsService = new AuditLogsService(auditLogsRepository);
const auditLogsController = new AuditLogsController(auditLogsService);

router.use(jwtAuthGuard);
router.use(rolesGuard(ROLES.PLATFORM_ADMIN));

router.get('/', asyncWrapper(auditLogsController.findAll.bind(auditLogsController)));
router.get('/:id', asyncWrapper(auditLogsController.findById.bind(auditLogsController)));

export default router;
