import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { SettingsService } from '../services/settings.service';
import { SettingsRepository } from '../repositories/implementations/settings.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const settingsRepository = new SettingsRepository();
const auditLogsRepository = new AuditLogsRepository();
const settingsService = new SettingsService(settingsRepository, auditLogsRepository);
const settingsController = new SettingsController(settingsService);

router.use(jwtAuthGuard);

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.put('/password', settingsController.changePassword);

export default router;
