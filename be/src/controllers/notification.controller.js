const notificationService = require('../services/notification.service');

async function getMyNotifications(req, res, next) {
  try {
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const notifications = await notificationService.getMyNotifications(req.user.id, {
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const data = await notificationService.getUnreadCount(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Unread count fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;

    await notificationService.markAsRead({
      notificationId: Number(notificationId),
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const data = await notificationService.markAllAsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { notificationId } = req.params;

    await notificationService.deleteNotification({
      notificationId: Number(notificationId),
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};