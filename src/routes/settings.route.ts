import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const settingsController = new SettingsController();

router.use(jwtAuthGuard);

router.get('/profile', asyncWrapper(settingsController.getProfile.bind(settingsController)));
router.put('/profile', asyncWrapper(settingsController.updateProfile.bind(settingsController)));
router.put('/password', asyncWrapper(settingsController.changePassword.bind(settingsController)));

export default router;
