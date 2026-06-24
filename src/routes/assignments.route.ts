import { Router } from 'express';
import { AssignmentsController } from '../controllers/assignments.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const assignmentsController = new AssignmentsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  // rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(assignmentsController.findAll.bind(assignmentsController))
);

router.post(
  '/assign',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(assignmentsController.assign.bind(assignmentsController))
);

router.get(
  '/active/:subscriberId',
  asyncWrapper(assignmentsController.getActiveAssignment.bind(assignmentsController))
);

router.post(
  '/:id/end',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(assignmentsController.endAssignment.bind(assignmentsController))
);

export default router;
