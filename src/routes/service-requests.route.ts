import { Router } from 'express';
import { ServiceRequestsController } from '../controllers/service-requests.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdvisor, isClientOrAdvisor } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createServiceRequestSchema, updateServiceRequestSchema, respondServiceRequestSchema, linkMeetingSchema } from '../validators';

const router = Router();
const controller = new ServiceRequestsController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(controller.findAll.bind(controller)));
router.get('/my', asyncWrapper(controller.findByClient.bind(controller)));
router.get('/assigned', isAdvisor, asyncWrapper(controller.findByAdvisor.bind(controller)));
router.get('/:id', asyncWrapper(controller.findById.bind(controller)));
router.get('/client/:clientId', asyncWrapper(controller.findByClient.bind(controller)));
router.get('/advisor/:advisorId', isAdvisor, asyncWrapper(controller.findByAdvisor.bind(controller)));
router.post('/', isClientOrAdvisor, validateRequest(createServiceRequestSchema), asyncWrapper(controller.create.bind(controller)));
router.put('/:id', validateRequest(updateServiceRequestSchema), asyncWrapper(controller.update.bind(controller)));
router.patch('/:id/respond', isAdvisor, validateRequest(respondServiceRequestSchema), asyncWrapper(controller.respond.bind(controller)));
router.patch('/:id/link-meeting', isAdvisor, validateRequest(linkMeetingSchema), asyncWrapper(controller.linkMeeting.bind(controller)));

export default router;
