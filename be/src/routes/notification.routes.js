const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/notifications', notificationController.getMyNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.patch('/notifications/:notificationId/read', notificationController.markAsRead);
router.patch('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:notificationId', notificationController.deleteNotification);

module.exports = router;