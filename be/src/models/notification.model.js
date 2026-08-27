const { pool } = require('../config/db');

async function createNotification({
  recipient_id,
  title = null,
  actor_id = null,
  entity_type = null,
  entity_id = null,
  meta_json = null,
  type,
  message,
  is_read = 0
}) {
  const [result] = await pool.execute(
    `INSERT INTO notifications
      (recipient_id, title, actor_id, entity_type, entity_id, meta_json, type, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      recipient_id,
      title,
      actor_id,
      entity_type,
      entity_id,
      meta_json ? JSON.stringify(meta_json) : null,
      type,
      message,
      is_read
    ]
  );

  return result.insertId;
}

async function findNotificationById(id) {
  const [rows] = await pool.execute(
    `SELECT n.id, n.recipient_id, n.title, n.actor_id, n.entity_type, n.entity_id,
            n.meta_json, n.type, n.message, n.is_read, n.created_at,
            u.name AS actor_name
     FROM notifications n
     LEFT JOIN users u ON n.actor_id = u.id
     WHERE n.id = ?
     LIMIT 1`,
    [id]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    meta_json: rows[0].meta_json ? JSON.parse(rows[0].meta_json) : null
  };
}

async function getNotificationsByRecipientId(recipientId, {
  limit = 20,
  offset = 0
} = {}) {
  const [rows] = await pool.execute(
    `SELECT n.id, n.recipient_id, n.title, n.actor_id, n.entity_type, n.entity_id,
            n.meta_json, n.type, n.message, n.is_read, n.created_at,
            u.name AS actor_name
     FROM notifications n
     LEFT JOIN users u ON n.actor_id = u.id
     WHERE n.recipient_id = ?
     ORDER BY n.id DESC
     LIMIT ? OFFSET ?`,
    [recipientId, Number(limit), Number(offset)]
  );

  return rows.map((row) => ({
    ...row,
    meta_json: row.meta_json ? JSON.parse(row.meta_json) : null
  }));
}

async function countUnreadNotificationsByRecipientId(recipientId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM notifications
     WHERE recipient_id = ? AND is_read = 0`,
    [recipientId]
  );

  return rows[0].total;
}

async function markNotificationAsRead(id, recipientId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ? AND recipient_id = ?`,
    [id, recipientId]
  );

  return result.affectedRows > 0;
}

async function markAllNotificationsAsRead(recipientId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE recipient_id = ? AND is_read = 0`,
    [recipientId]
  );

  return result.affectedRows;
}

async function deleteNotification(id, recipientId) {
  const [result] = await pool.execute(
    `DELETE FROM notifications
     WHERE id = ? AND recipient_id = ?`,
    [id, recipientId]
  );

  return result.affectedRows > 0;
}

async function findRecentDuplicate({
  recipient_id,
  actor_id = null,
  entity_type = null,
  entity_id = null,
  type,
  withinMinutes = 10
}) {
  const [rows] = await pool.execute(
    `SELECT id, recipient_id, actor_id, entity_type, entity_id, type, created_at
     FROM notifications
     WHERE recipient_id = ?
       AND type = ?
       AND (actor_id <=> ?)
       AND (entity_type <=> ?)
       AND (entity_id <=> ?)
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY id DESC
     LIMIT 1`,
    [recipient_id, type, actor_id, entity_type, entity_id, withinMinutes]
  );

  return rows[0] || null;
}

module.exports = {
  createNotification,
  findNotificationById,
  getNotificationsByRecipientId,
  countUnreadNotificationsByRecipientId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  findRecentDuplicate
};