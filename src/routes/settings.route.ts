import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateProfileSchema, changePasswordSchema } from '../validators';

const router = Router();
const settingsController = new SettingsController();

router.use(jwtAuthGuard);

router.get('/profile', asyncWrapper(settingsController.getProfile.bind(settingsController)));
router.put('/profile', validateRequest(updateProfileSchema), asyncWrapper(settingsController.updateProfile.bind(settingsController)));
router.put('/password', validateRequest(changePasswordSchema), asyncWrapper(settingsController.changePassword.bind(settingsController)));

export default router;
