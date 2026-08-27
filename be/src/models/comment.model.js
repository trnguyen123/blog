const { pool } = require('../config/db');

async function createComment({
  postId,
  userId,
  parentId = null,
  content,
  status = 'pending',
  aiFlag = false,
  aiScore = null,

  post_id,
  user_id,
  parent_id,
  ai_flag,
  ai_score
}, conn = null) {
  const db = conn || pool;

  const finalPostId = post_id ?? postId;
  const finalUserId = user_id ?? userId;
  const finalParentId = parent_id ?? parentId;
  const finalAiFlag = ai_flag ?? (aiFlag ? 1 : 0);
  const finalAiScore = ai_score ?? aiScore;

  const [result] = await db.execute(
    `
    INSERT INTO comments (
      post_id,
      user_id,
      parent_id,
      content,
      status,
      ai_flag,
      ai_score,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      finalPostId,
      finalUserId,
      finalParentId,
      content,
      status,
      finalAiFlag,
      finalAiScore
    ]
  );

  return result.insertId;
}

async function findCommentById(commentId) {
  const [rows] = await pool.execute(
    `
    SELECT *
    FROM comments
    WHERE id = ? AND deleted_at IS NULL
    LIMIT 1
    `,
    [commentId]
  );

  return rows[0] || null;
}

async function getCommentsByPostId(postId, currentUserId = null) {
  const [rows] = await pool.execute(
    `
    SELECT
      c.*,
      u.name AS username,
      u.avatar_url,
      EXISTS (
        SELECT 1
        FROM comment_likes cl
        WHERE cl.comment_id = c.id
          AND cl.user_id = ?
      ) AS is_liked,
      (
        SELECT COUNT(*)
        FROM comment_likes cl2
        WHERE cl2.comment_id = c.id
      ) AS like_count,
      (
        SELECT COUNT(*)
        FROM comments c3
        WHERE c3.parent_id = c.id
          AND c3.deleted_at IS NULL
          AND c3.status = 'approved'
      ) AS reply_count
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
      AND c.parent_id IS NULL
      AND c.deleted_at IS NULL
      AND c.status = 'approved'
    ORDER BY c.created_at ASC
    `,
    [currentUserId || 0, postId]
  );

  return rows;
}

async function getCommentReplies(parentId, currentUserId = null) {
  const [rows] = await pool.execute(
    `
    SELECT
      c.*,
      u.name AS username,
      u.avatar_url,
      EXISTS (
        SELECT 1
        FROM comment_likes cl
        WHERE cl.comment_id = c.id
          AND cl.user_id = ?
      ) AS is_liked,
      (
        SELECT COUNT(*)
        FROM comment_likes cl2
        WHERE cl2.comment_id = c.id
      ) AS like_count
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.parent_id = ?
      AND c.deleted_at IS NULL
      AND c.status = 'approved'
    ORDER BY c.created_at ASC
    `,
    [currentUserId || 0, parentId]
  );

  return rows;
}

async function getPendingCommentsByPostId(postId) {
  const [rows] = await pool.execute(
    `
    SELECT c.*, u.name AS username, u.avatar_url
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
      AND c.deleted_at IS NULL
      AND c.status = 'pending'
    ORDER BY c.created_at DESC
    `,
    [postId]
  );

  return rows;
}

async function updateCommentStatus(commentId, status) {
  const [result] = await pool.execute(
    `
    UPDATE comments
    SET status = ?, updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
    `,
    [status, commentId]
  );

  return result.affectedRows > 0;
}

async function updateCommentContent(commentId, content) {
  const [result] = await pool.execute(
    `
    UPDATE comments
    SET content = ?, updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
    `,
    [content, commentId]
  );

  return result.affectedRows > 0;
}

async function softDeleteComment(commentId) {
  const [result] = await pool.execute(
    `
    UPDATE comments
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
    `,
    [commentId]
  );

  return result.affectedRows > 0;
}

async function getCommentsByUserId(userId) {
  const [rows] = await pool.execute(
    `
    SELECT *
    FROM comments
    WHERE user_id = ?
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows;
}

async function likeComment(commentId, userId) {
  await pool.execute(
    `
    INSERT IGNORE INTO comment_likes (comment_id, user_id, created_at)
    VALUES (?, ?, NOW())
    `,
    [commentId, userId]
  );
}

async function unlikeComment(commentId, userId) {
  await pool.execute(
    `
    DELETE FROM comment_likes
    WHERE comment_id = ? AND user_id = ?
    `,
    [commentId, userId]
  );
}

async function countLikesByCommentId(commentId) {
  const [rows] = await pool.execute(
    `
    SELECT COUNT(*) AS total
    FROM comment_likes
    WHERE comment_id = ?
    `,
    [commentId]
  );

  return rows[0]?.total || 0;
}

async function hasUserReportedComment(commentId, reportedBy) {
  const [rows] = await pool.execute(
    `
    SELECT id
    FROM comment_reports
    WHERE comment_id = ? AND reported_by = ?
    LIMIT 1
    `,
    [commentId, reportedBy]
  );

  return !!rows[0];
}

async function reportComment({ commentId, reportedBy, reason }) {
  const [result] = await pool.execute(
    `
    INSERT INTO comment_reports (
      comment_id,
      reported_by,
      reason,
      created_at
    )
    VALUES (?, ?, ?, NOW())
    `,
    [commentId, reportedBy, reason]
  );

  return result.insertId;
}

async function getReportsByCommentId(commentId) {
  const [rows] = await pool.execute(
    `
    SELECT cr.*, u.name AS reported_by_username
    FROM comment_reports cr
    JOIN users u ON u.id = cr.reported_by
    WHERE cr.comment_id = ?
    ORDER BY cr.created_at DESC
    `,
    [commentId]
  );

  return rows;
}

async function getPendingCommentsByAuthorId(authorId, limit = 10) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

  const [rows] = await pool.execute(
    `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.content,
      c.status,
      c.ai_flag,
      c.ai_score,
      c.created_at,
      u.name AS username,
      u.avatar_url,
      p.title AS post_title
    FROM comments c
    JOIN users u ON u.id = c.user_id
    JOIN posts p ON p.id = c.post_id
    WHERE p.author_id = ?
      AND c.deleted_at IS NULL
      AND c.status = 'pending'
    ORDER BY c.created_at DESC
    LIMIT ${safeLimit}
    `,
    [authorId]
  );

  return rows;
}

async function getCommentsForModerationByAuthorId(authorId, limit = 50) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 50;

  const [rows] = await pool.execute(
    `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.content,
      c.status,
      c.ai_flag,
      c.ai_score,
      c.created_at,
      u.name AS username,
      u.avatar_url,
      p.title AS post_title
    FROM comments c
    JOIN users u ON u.id = c.user_id
    JOIN posts p ON p.id = c.post_id
    WHERE p.author_id = ?
      AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT ${safeLimit}
    `,
    [authorId]
  );

  return rows;
}

async function getAllCommentsForModeration(limit = 50) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 50;

  const [rows] = await pool.execute(
    `
    SELECT
      c.id,
      c.post_id,
      c.user_id,
      c.content,
      c.status,
      c.ai_flag,
      c.ai_score,
      c.created_at,
      u.name AS username,
      u.avatar_url,
      p.title AS post_title
    FROM comments c
    JOIN users u ON u.id = c.user_id
    JOIN posts p ON p.id = c.post_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT ${safeLimit}
    `
  );

  return rows;
}

module.exports = {
  createComment,
  findCommentById,
  getCommentsByPostId,
  getCommentReplies,
  getPendingCommentsByPostId,
  getPendingCommentsByAuthorId,
  getCommentsForModerationByAuthorId,
  getAllCommentsForModeration,
  updateCommentStatus,
  updateCommentContent,
  softDeleteComment,
  getCommentsByUserId,
  likeComment,
  unlikeComment,
  countLikesByCommentId,
  hasUserReportedComment,
  reportComment,
  getReportsByCommentId
};