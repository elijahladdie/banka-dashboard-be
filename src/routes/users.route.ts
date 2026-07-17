import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { asyncWrapper } from '../middleware/async-wrapper';
import { jwtAuthGuard, isAdmin } from '../middleware';
import { validateRequest } from '../middleware/validateRequest';
import { updateUserSchema } from '../validators';

const router = Router();
const usersController = new UsersController();

router.use(jwtAuthGuard);

router.get('/', isAdmin, asyncWrapper(usersController.findAll.bind(usersController)));
router.get('/:id', asyncWrapper(usersController.findById.bind(usersController)));
router.put('/:id', isAdmin, validateRequest(updateUserSchema), asyncWrapper(usersController.update.bind(usersController)));

export default router;
