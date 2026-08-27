const { pool } = require('../config/db');

async function getAuthorOverview(authorId) {
  const [rows] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT p.id) AS total_posts,
      COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) AS published_posts,
      COUNT(DISTINCT CASE WHEN p.status = 'draft' THEN p.id END) AS draft_posts,
      COALESCE(SUM(p.view_count), 0) AS total_views,
      COALESCE((
        SELECT COUNT(*)
        FROM post_likes pl
        JOIN posts p2 ON p2.id = pl.post_id
        WHERE p2.author_id = ? AND p2.deleted_at IS NULL
      ), 0) AS total_likes,
      COALESCE((
        SELECT COUNT(*)
        FROM comments c
        JOIN posts p3 ON p3.id = c.post_id
        WHERE p3.author_id = ? AND p3.deleted_at IS NULL AND c.deleted_at IS NULL
      ), 0) AS total_comments
    FROM posts p
    WHERE p.author_id = ? AND p.deleted_at IS NULL
    `,
    [authorId, authorId, authorId]
  );

  return rows[0];
}

async function getAuthorTopPosts(authorId, limit = 5) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 5;

  const [rows] = await pool.execute(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.status,
      p.visibility,
      p.view_count,
      p.published_at,
      COUNT(DISTINCT pl.id) AS like_count,
      COUNT(DISTINCT c.id) AS comment_count
    FROM posts p
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
    WHERE p.author_id = ? AND p.deleted_at IS NULL
    GROUP BY p.id, p.title, p.slug, p.status, p.visibility, p.view_count, p.published_at
    ORDER BY p.view_count DESC, like_count DESC, comment_count DESC
    LIMIT ${safeLimit}
    `,
    [authorId]
  );

  return rows;
}

module.exports = {
  getAuthorOverview,
  getAuthorTopPosts
};