import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { asyncWrapper } from '../utils/async-wrapper';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const notificationsController = new NotificationsController();

router.use(jwtAuthGuard);

router.get('/', asyncWrapper(notificationsController.findByUser.bind(notificationsController)));
router.get('/unread-count', asyncWrapper(notificationsController.getUnreadCount.bind(notificationsController)));
router.get('/:id', asyncWrapper(notificationsController.findById.bind(notificationsController)));
router.patch('/:id/read', asyncWrapper(notificationsController.markAsRead.bind(notificationsController)));
router.patch('/read-all', asyncWrapper(notificationsController.markAllAsRead.bind(notificationsController)));

export default router;
