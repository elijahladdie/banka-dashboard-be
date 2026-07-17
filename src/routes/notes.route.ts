import { Router } from 'express';
import { NotesController } from '../controllers/notes.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdvisor } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createNoteSchema, updateNoteSchema } from '../validators';

const router = Router();
const notesController = new NotesController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(notesController.findByAdvisor.bind(notesController)));
router.get('/:id', asyncWrapper(notesController.findById.bind(notesController)));
router.post('/', isAdvisor, validateRequest(createNoteSchema), asyncWrapper(notesController.create.bind(notesController)));
router.put('/:id', isAdvisor, validateRequest(updateNoteSchema), asyncWrapper(notesController.update.bind(notesController)));
router.delete('/:id', isAdvisor, asyncWrapper(notesController.delete.bind(notesController)));

export default router;
