import { Router } from 'express';
import { NotesController } from '../controllers/notes.controller';
import { NotesService } from '../services/notes.service';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const notesService = new NotesService();
const notesController = new NotesController(notesService);

router.use(jwtAuthGuard);

router.get(
  '/',
  rolesGuard(ROLES.FINANCIAL_ADVISOR, ROLES.PLATFORM_ADMIN),
  notesController.findByAdvisor
);

router.get('/:id', notesController.findById);

router.post(
  '/',
  rolesGuard(ROLES.FINANCIAL_ADVISOR),
  notesController.create
);

router.put(
  '/:id',
  rolesGuard(ROLES.FINANCIAL_ADVISOR),
  notesController.update
);

router.delete(
  '/:id',
  rolesGuard(ROLES.FINANCIAL_ADVISOR, ROLES.PLATFORM_ADMIN),
  notesController.delete
);

export default router;
