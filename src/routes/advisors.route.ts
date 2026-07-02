import { Router } from 'express';
import { AdvisorsController } from '../controllers/advisors.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdmin, isAdminOrAdvisor } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createAdvisorSchema, updateAdvisorSchema } from '../validators';

const router = Router();
const advisorsController = new AdvisorsController();

router.use(jwtAuthGuard);

router.get('/', isAdminOrAdvisor, asyncWrapper(advisorsController.findAll.bind(advisorsController)));
router.get('/:id', asyncWrapper(advisorsController.findById.bind(advisorsController)));
router.post('/', isAdmin, validateRequest(createAdvisorSchema), asyncWrapper(advisorsController.create.bind(advisorsController)));
router.put('/:id', isAdmin, validateRequest(updateAdvisorSchema), asyncWrapper(advisorsController.update.bind(advisorsController)));
router.patch('/:id/toggle-availability', isAdmin, asyncWrapper(advisorsController.toggleAvailability.bind(advisorsController)));

export default router;
