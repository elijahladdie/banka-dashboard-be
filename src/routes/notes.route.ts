import { Router } from 'express';
import { NotesController } from '../controllers/notes.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdvisor } from '../middleware';

const router = Router();

const notesController = new NotesController();

router.use(jwtAuthGuard);

router.get(
  '/',
  // rolesGuard(ROLES.ADVISOR, ROLES.ADMIN),
  asyncWrapper(notesController.findByAdvisor.bind(notesController))
);

router.get('/:id', asyncWrapper(notesController.findById.bind(notesController)));

router.post(
  '/',
  isAdvisor,
  asyncWrapper(notesController.create.bind(notesController))
);

router.put(
  '/:id',
  isAdvisor,
  asyncWrapper(notesController.update.bind(notesController))
);

router.delete(
  '/:id',
  isAdvisor,
  asyncWrapper(notesController.delete.bind(notesController))
);

export default router;
