import { Router } from 'express';
import { AssignmentsController } from '../controllers/assignments.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdmin } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { assignClientSchema } from '../validators';

const router = Router();
const assignmentsController = new AssignmentsController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(assignmentsController.findAll.bind(assignmentsController)));
router.post('/assign', isAdmin, validateRequest(assignClientSchema), asyncWrapper(assignmentsController.assign.bind(assignmentsController)));
router.get('/active/:clientId', asyncWrapper(assignmentsController.getActiveAssignment.bind(assignmentsController)));
router.post('/:id/end', isAdmin, asyncWrapper(assignmentsController.endAssignment.bind(assignmentsController)));

export default router;
