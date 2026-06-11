import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { UsersRepository } from '../repositories/implementations/users.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const usersRepository = new UsersRepository();
const auditLogsRepository = new AuditLogsRepository();
const usersService = new UsersService(usersRepository, auditLogsRepository);
const usersController = new UsersController(usersService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.PLATFORM_ADMIN, ROLES.FINANCE_OFFICER),
  asyncWrapper(usersController.findAll.bind(usersController))
);

router.get('/:id', asyncWrapper(usersController.findById.bind(usersController)));

router.put(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN),
  asyncWrapper(usersController.update.bind(usersController))
);

router.delete(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN),
  asyncWrapper(usersController.delete.bind(usersController))
);

export default router;
