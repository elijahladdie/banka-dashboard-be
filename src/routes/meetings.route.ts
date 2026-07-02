import { Router } from 'express';
import { MeetingsController } from '../controllers/meetings.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const meetingsController = new MeetingsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  // rolesGuard(ROLES.ADMIN, ROLES.ADVISOR),
  asyncWrapper(meetingsController.findAll.bind(meetingsController))
);

router.get('/:id', asyncWrapper(meetingsController.findById.bind(meetingsController)));
router.post('/', asyncWrapper(meetingsController.create.bind(meetingsController)));
router.put('/:id', asyncWrapper(meetingsController.update.bind(meetingsController)));
router.patch('/:id/status', asyncWrapper(meetingsController.updateStatus.bind(meetingsController)));
router.delete('/:id', asyncWrapper(meetingsController.delete.bind(meetingsController)));

export default router;
