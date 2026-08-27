const { pool } = require('../config/db');

async function createActivityLog({
  userId = null,
  action,
  targetType = null,
  targetId = null
}) {
  const [result] = await pool.execute(
    `INSERT INTO activity_logs (user_id, action, target_type, target_id, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [userId, action, targetType, targetId]
  );

  return result.insertId;
}

async function getAllActivityLogs() {
  const [rows] = await pool.execute(
    `SELECT id, user_id, action, target_type, target_id, created_at
     FROM activity_logs
     ORDER BY id DESC`
  );

  return rows;
}

async function getActivityLogsByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, action, target_type, target_id, created_at
     FROM activity_logs
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId]
  );

  return rows;
}

async function getActivityLogsByTarget(targetType, targetId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, action, target_type, target_id, created_at
     FROM activity_logs
     WHERE target_type = ? AND target_id = ?
     ORDER BY id DESC`,
    [targetType, targetId]
  );

  return rows;
}

module.exports = {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogsByUserId,
  getActivityLogsByTarget
};