import { Router } from 'express';
import { AssignmentsController } from '../controllers/assignments.controller';
import { AssignmentsService } from '../services/assignments.service';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { AdvisorsRepository } from '../repositories/implementations/advisors.repository';
import { UsersRepository } from '../repositories/implementations/users.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const assignmentsRepository = new AssignmentsRepository();
const advisorsRepository = new AdvisorsRepository();
const usersRepository = new UsersRepository();
const auditLogsRepository = new AuditLogsRepository();
const assignmentsService = new AssignmentsService(
  assignmentsRepository,
  advisorsRepository,
  usersRepository,
  auditLogsRepository
);
const assignmentsController = new AssignmentsController(assignmentsService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
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
