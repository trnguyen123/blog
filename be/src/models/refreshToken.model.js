const { pool } = require('../config/db');

async function createRefreshToken({ userId, token, expiresAt }) {
  const [result] = await pool.execute(
    `
    INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
    VALUES (?, ?, ?, NOW())
    `,
    [userId, token, expiresAt]
  );

  return result.insertId;
}

async function findRefreshTokenByToken(token) {
  const [rows] = await pool.execute(
    `
    SELECT id, user_id, token, expires_at, created_at
    FROM refresh_tokens
    WHERE token = ?
    LIMIT 1
    `,
    [token]
  );

  return rows[0] || null;
}

async function deleteRefreshToken(token) {
  const [result] = await pool.execute(
    `
    DELETE FROM refresh_tokens
    WHERE token = ?
    `,
    [token]
  );

  return result.affectedRows > 0;
}

async function deleteRefreshTokensByUserId(userId) {
  const [result] = await pool.execute(
    `
    DELETE FROM refresh_tokens
    WHERE user_id = ?
    `,
    [userId]
  );

  return result.affectedRows;
}

async function deleteExpiredTokens() {
  const [result] = await pool.execute(
    `
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW()
    `
  );

  return result.affectedRows;
}

module.exports = {
  createRefreshToken,
  findRefreshTokenByToken,
  deleteRefreshToken,
  deleteRefreshTokensByUserId,
  deleteExpiredTokens
};