const notificationModel = require('../models/notification.model');
const { emitToUser, emitToRole } = require('../sockets/socketServer');

/**
 * Tạo 1 notification, lưu DB, rồi đẩy real-time cho đúng người nhận qua WebSocket.
 * Dùng cho các sự kiện "cần người dùng biết và có thể xem lại sau" (persisted).
 */
async function notifyUser({
  recipientId,
  actorId = null,
  entityType = null,
  entityId = null,
  type,
  title = null,
  message,
  meta = null,
  dedupeMinutes = null
}) {
  if (dedupeMinutes) {
    const duplicate = await notificationModel.findRecentDuplicate({
      recipient_id: recipientId,
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      type,
      withinMinutes: dedupeMinutes
    });

    if (duplicate) {
      return null;
    }
  }

  const notificationId = await notificationModel.createNotification({
    recipient_id: recipientId,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    type,
    title,
    message,
    meta_json: meta
  });

  const notification = await notificationModel.findNotificationById(notificationId);

  emitToUser(recipientId, 'notification:new', notification);

  return notification;
}

/**
 * Bắn 1 sự kiện WebSocket "ping" thuần (không lưu DB) cho toàn bộ user thuộc 1 role
 * đang online. Dùng để báo UI tự refetch (ví dụ: có comment mới cần duyệt).
 */
function notifyRole(role, event, payload) {
  emitToRole(role, event, payload);
}

async function getMyNotifications(userId, { limit = 20, offset = 0 } = {}) {
  return notificationModel.getNotificationsByRecipientId(userId, { limit, offset });
}

async function getUnreadCount(userId) {
  const total = await notificationModel.countUnreadNotificationsByRecipientId(userId);
  return { unread_count: Number(total) };
}

async function markAsRead({ notificationId, userId }) {
  const updated = await notificationModel.markNotificationAsRead(notificationId, userId);
  if (!updated) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }
  return true;
}

async function markAllAsRead(userId) {
  const count = await notificationModel.markAllNotificationsAsRead(userId);
  return { updated: count };
}

async function deleteNotification({ notificationId, userId }) {
  const deleted = await notificationModel.deleteNotification(notificationId, userId);
  if (!deleted) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }
  return true;
}

module.exports = {
  notifyUser,
  notifyRole,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};