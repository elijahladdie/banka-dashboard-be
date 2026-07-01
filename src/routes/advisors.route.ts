import { Router } from 'express';
import { AdvisorsController } from '../controllers/advisors.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, isAdmin, isAdminOrAdvisor } from '../middleware';

const router = Router();

const advisorsController = new AdvisorsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  isAdminOrAdvisor,
  asyncWrapper(advisorsController.findAll.bind(advisorsController))
);

router.get('/:id', asyncWrapper(advisorsController.findById.bind(advisorsController)));

router.post(
  '/',
  isAdmin,
  asyncWrapper(advisorsController.create.bind(advisorsController))
);

router.put(
  '/:id',
  isAdmin,
  asyncWrapper(advisorsController.update.bind(advisorsController))
);

router.patch(
  '/:id/toggle-availability',
  isAdmin,
  asyncWrapper(advisorsController.toggleAvailability.bind(advisorsController))
);
export default router;
