const { pool } = require('../config/db');

async function createModerationLog({
  comment_id,
  ai_model,
  toxicity_score = 0,
  spam_score = 0,
  decision,
  raw_response = null
}, conn = null) {
  const db = conn || pool;

  const [result] = await db.execute(
    `
    INSERT INTO ai_moderation_logs (
      comment_id,
      ai_model,
      toxicity_score,
      spam_score,
      decision,
      raw_response,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      comment_id,
      ai_model,
      toxicity_score,
      spam_score,
      decision,
      raw_response ? JSON.stringify(raw_response) : null
    ]
  );

  return result.insertId;
}

async function getLogsByCommentId(commentId) {
  const [rows] = await pool.execute(
    `
    SELECT *
    FROM ai_moderation_logs
    WHERE comment_id = ?
    ORDER BY created_at DESC
    `,
    [commentId]
  );

  return rows;
}

module.exports = {
  createModerationLog,
  getLogsByCommentId
};