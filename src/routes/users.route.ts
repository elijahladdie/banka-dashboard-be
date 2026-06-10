import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { UsersRepository } from '../repositories/implementations/users.repository';
import { AuditLogsRepository } from '../repositories/implementations/audit-logs.repository';
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
  usersController.findAll
);

router.get('/:id', usersController.findById);

router.put(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN),
  usersController.update
);

router.delete(
  '/:id',
  rolesGuard(ROLES.PLATFORM_ADMIN),
  usersController.delete
);

export default router;
