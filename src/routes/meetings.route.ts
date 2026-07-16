import { Router } from 'express';
import { MeetingsController } from '../controllers/meetings.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();
const meetingsController = new MeetingsController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(meetingsController.findAll.bind(meetingsController)));

export default router;
