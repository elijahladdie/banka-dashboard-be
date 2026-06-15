import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { SettingsService } from '../services/settings.service';
import { SettingsRepository } from '../repositories/implementations/settings.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const settingsRepository = new SettingsRepository();
const auditLogsRepository = new AuditLogsRepository();
const settingsService = new SettingsService(settingsRepository, auditLogsRepository);
const settingsController = new SettingsController(settingsService);

router.use(jwtAuthGuard);

router.get('/profile', asyncWrapper(settingsController.getProfile.bind(settingsController)));
router.put('/profile', asyncWrapper(settingsController.updateProfile.bind(settingsController)));
router.put('/password', asyncWrapper(settingsController.changePassword.bind(settingsController)));

export default router;
