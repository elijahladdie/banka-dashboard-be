import { Router } from 'express';
import { MeetingsController } from '../controllers/meetings.controller';
import { MeetingsService } from '../services/meetings.service';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const meetingsRepository = new MeetingsRepository();
const auditLogsRepository = new AuditLogsRepository();
const meetingsService = new MeetingsService(meetingsRepository, auditLogsRepository);
const meetingsController = new MeetingsController(meetingsService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER, ROLES.FINANCIAL_ADVISOR),
  meetingsController.findAll
);

router.get('/:id', meetingsController.findById);
router.post('/', meetingsController.create);
router.put('/:id', meetingsController.update);
router.patch('/:id/status', meetingsController.updateStatus);
router.delete('/:id', meetingsController.delete);

export default router;
