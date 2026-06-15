import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { NotificationsService } from '../services/notifications.service';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const notificationsRepository = new NotificationsRepository();
const notificationsService = new NotificationsService(notificationsRepository);
const notificationsController = new NotificationsController(notificationsService);

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(notificationsController.findByUser.bind(notificationsController)));
router.get('/unread-count', asyncWrapper(notificationsController.getUnreadCount.bind(notificationsController)));
router.get('/:id', asyncWrapper(notificationsController.findById.bind(notificationsController)));
router.patch('/:id/read', asyncWrapper(notificationsController.markAsRead.bind(notificationsController)));
router.patch('/read-all', asyncWrapper(notificationsController.markAllAsRead.bind(notificationsController)));
router.delete('/:id', asyncWrapper(notificationsController.delete.bind(notificationsController)));

export default router;
