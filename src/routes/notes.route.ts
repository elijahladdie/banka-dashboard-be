import { Router } from 'express';
import { NotesController } from '../controllers/notes.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();
const notesController = new NotesController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(notesController.findByAdvisor.bind(notesController)));

export default router;
