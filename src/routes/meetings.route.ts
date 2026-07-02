import { Router } from 'express';
import { MeetingsController } from '../controllers/meetings.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createMeetingSchema, updateMeetingSchema, updateMeetingStatusSchema } from '../validators';

const router = Router();
const meetingsController = new MeetingsController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(meetingsController.findAll.bind(meetingsController)));
router.get('/:id', asyncWrapper(meetingsController.findById.bind(meetingsController)));
router.post('/', validateRequest(createMeetingSchema), asyncWrapper(meetingsController.create.bind(meetingsController)));
router.put('/:id', validateRequest(updateMeetingSchema), asyncWrapper(meetingsController.update.bind(meetingsController)));
router.patch('/:id/status', validateRequest(updateMeetingStatusSchema), asyncWrapper(meetingsController.updateStatus.bind(meetingsController)));
router.delete('/:id', asyncWrapper(meetingsController.delete.bind(meetingsController)));

export default router;
