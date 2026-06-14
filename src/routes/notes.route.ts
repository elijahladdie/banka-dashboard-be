import { Router } from 'express';
import { NotesController } from '../controllers/notes.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const notesController = new NotesController();

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.FINANCIAL_ADVISOR, ROLES.PLATFORM_ADMIN),
  asyncWrapper(notesController.findByAdvisor.bind(notesController))
);

router.get('/:id', asyncWrapper(notesController.findById.bind(notesController)));

router.post(
  '/',
  rolesGuard(ROLES.FINANCIAL_ADVISOR),
  asyncWrapper(notesController.create.bind(notesController))
);

router.put(
  '/:id',
  rolesGuard(ROLES.FINANCIAL_ADVISOR),
  asyncWrapper(notesController.update.bind(notesController))
);

router.delete(
  '/:id',
  rolesGuard(ROLES.FINANCIAL_ADVISOR, ROLES.PLATFORM_ADMIN),
  asyncWrapper(notesController.delete.bind(notesController))
);

export default router;
