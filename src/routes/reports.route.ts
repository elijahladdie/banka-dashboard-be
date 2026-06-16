import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard, rolesGuard } from '../middleware';
import { ROLES } from '../constants';

const router = Router();

const reportsController = new ReportsController();

router.use(jwtAuthGuard);

router.get(
  '/',
  asyncWrapper(reportsController.findAll.bind(reportsController))
);

router.get('/:id', asyncWrapper(reportsController.findById.bind(reportsController)));
router.post('/', asyncWrapper(reportsController.create.bind(reportsController)));
router.put('/:id', asyncWrapper(reportsController.update.bind(reportsController)));

export default router;
