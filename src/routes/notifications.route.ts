import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { NotificationsService } from '../services/notifications.service';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { jwtAuthGuard } from '../middleware';

const router = Router();

const notificationsRepository = new NotificationsRepository();
const notificationsService = new NotificationsService(notificationsRepository);
const notificationsController = new NotificationsController(notificationsService);

router.use(jwtAuthGuard);

router.get('/', notificationsController.findByUser);
router.get('/unread-count', notificationsController.getUnreadCount);
router.get('/:id', notificationsController.findById);
router.patch('/:id/read', notificationsController.markAsRead);
router.patch('/read-all', notificationsController.markAllAsRead);
router.delete('/:id', notificationsController.delete);

export default router;
