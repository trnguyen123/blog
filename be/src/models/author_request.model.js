const { pool } = require('../config/db');

async function createAuthorRequest({
  userId,
  bio,
  reason,
  experience = null,
  sampleWork = null
}) {
  const [result] = await pool.execute(
    `INSERT INTO author_requests (
      user_id, bio, reason, experience, sample_work, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
    [userId, bio, reason, experience, sampleWork]
  );

  return result.insertId;
}

async function findAuthorRequestById(id) {
  const [rows] = await pool.execute(
    `SELECT ar.*, u.name AS user_name, u.email,
            reviewer.name AS reviewed_by_name
     FROM author_requests ar
     INNER JOIN users u ON ar.user_id = u.id
     LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
     WHERE ar.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findPendingRequestByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM author_requests
     WHERE user_id = ? AND status = 'pending'
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function getAuthorRequestsByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT ar.*, reviewer.name AS reviewed_by_name
     FROM author_requests ar
     LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
     WHERE ar.user_id = ?
     ORDER BY ar.created_at DESC`,
    [userId]
  );

  return rows;
}

async function getAllAuthorRequests(status = null) {
  let query = `
    SELECT ar.*, u.name AS user_name, u.email,
           reviewer.name AS reviewed_by_name
    FROM author_requests ar
    INNER JOIN users u ON ar.user_id = u.id
    LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
  `;
  const params = [];

  if (status) {
    query += ` WHERE ar.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY ar.created_at DESC`;

  const [rows] = await pool.execute(query, params);
  return rows;
}

async function updateAuthorRequestStatus({
  requestId,
  status,
  reviewedBy,
  reviewNote = null
}) {
  const [result] = await pool.execute(
    `UPDATE author_requests
     SET status = ?, reviewed_by = ?, review_note = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, reviewedBy, reviewNote, requestId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findAuthorRequestById(requestId);
}

async function assignAuthorRoleToUser(userId) {
  const [roleRows] = await pool.execute(
    `SELECT id FROM roles WHERE name = 'author' LIMIT 1`
  );

  if (!roleRows.length) {
    return null;
  }

  const authorRoleId = roleRows[0].id;

  await pool.execute(
    `INSERT IGNORE INTO user_roles (user_id, role_id)
     VALUES (?, ?)`,
    [userId, authorRoleId]
  );

  return true;
}

module.exports = {
  createAuthorRequest,
  findAuthorRequestById,
  findPendingRequestByUserId,
  getAuthorRequestsByUserId,
  getAllAuthorRequests,
  updateAuthorRequestStatus,
  assignAuthorRoleToUser
};