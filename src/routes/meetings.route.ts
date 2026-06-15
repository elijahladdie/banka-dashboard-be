import { Router } from 'express';
import { MeetingsController } from '../controllers/meetings.controller';
import { MeetingsService } from '../services/meetings.service';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
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
  asyncWrapper(meetingsController.findAll.bind(meetingsController))
);

router.get('/:id', asyncWrapper(meetingsController.findById.bind(meetingsController)));
router.post('/', asyncWrapper(meetingsController.create.bind(meetingsController)));
router.put('/:id', asyncWrapper(meetingsController.update.bind(meetingsController)));
router.patch('/:id/status', asyncWrapper(meetingsController.updateStatus.bind(meetingsController)));
router.delete('/:id', asyncWrapper(meetingsController.delete.bind(meetingsController)));

export default router;
