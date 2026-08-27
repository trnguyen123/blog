const { pool } = require('../config/db');

async function createPost({
  title,
  slug,
  content,
  excerpt = null,
  thumbnail_url = null,
  author_id,
  status = 'draft',
  visibility = 'public',
  published_at = null
}) {
  const [result] = await pool.execute(
    `INSERT INTO posts
      (title, slug, content, excerpt, thumbnail_url, author_id, status, visibility, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, content, excerpt, thumbnail_url, author_id, status, visibility, published_at]
  );

  return result.insertId;
}

async function findPostById(id) {
  const [rows] = await pool.execute(
    `SELECT id, title, slug, content, excerpt, thumbnail_url, author_id, status, visibility, view_count, published_at, created_at, updated_at
     FROM posts
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findPostBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT 
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.thumbnail_url,
        p.author_id,
        u.name AS author_name,
        u.avatar_url AS author_avatar_url,
        p.status,
        p.visibility,
        p.view_count,
        p.published_at,
        p.created_at,
        p.updated_at
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     WHERE p.slug = ? AND p.deleted_at IS NULL
     LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
}

async function getAllPosts() {
  const [rows] = await pool.execute(
    `SELECT id, title, slug, excerpt, thumbnail_url, author_id, status, visibility, view_count, published_at, created_at, updated_at
     FROM posts
     WHERE deleted_at IS NULL
     ORDER BY id DESC`
  );

  return rows;
}

async function getPublishedPosts() {
  const [rows] = await pool.execute(
    `SELECT 
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.thumbnail_url,
        p.author_id,
        u.name AS author_name,
        u.avatar_url AS author_avatar_url,
        p.status,
        p.visibility,
        p.view_count,
        p.published_at,
        p.created_at,
        p.updated_at
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     WHERE p.status = 'published' AND p.deleted_at IS NULL
     ORDER BY p.published_at DESC, p.id DESC`
  );

  if (!rows.length) return rows;

  const postIds = rows.map((post) => post.id);

  const [categoryRows] = await pool.query(
    `SELECT
        pc.post_id,
        c.id,
        c.name,
        c.slug
     FROM posts_categories pc
     JOIN categories c ON c.id = pc.category_id
     WHERE pc.post_id IN (?)`,
    [postIds]
  );

  const categoryMap = new Map();

  for (const row of categoryRows) {
    if (!categoryMap.has(row.post_id)) {
      categoryMap.set(row.post_id, []);
    }

    categoryMap.get(row.post_id).push({
      id: row.id,
      name: row.name,
      slug: row.slug,
    });
  }

  return rows.map((post) => ({
    ...post,
    categories: categoryMap.get(post.id) || [],
    category_name: categoryMap.get(post.id)?.[0]?.name || null,
  }));
}

async function getPostsByAuthor(authorId) {
  const [rows] = await pool.execute(
    `SELECT id, title, slug, excerpt, thumbnail_url, author_id, status, visibility, view_count, published_at, created_at, updated_at
     FROM posts
     WHERE author_id = ? AND deleted_at IS NULL
     ORDER BY id DESC`,
    [authorId]
  );

  return rows;
}

async function updatePost(id, {
  title,
  slug,
  content,
  excerpt = null,
  thumbnail_url = null,
  status,
  visibility,
  published_at = null
}) {
  const [result] = await pool.execute(
    `UPDATE posts
     SET title = ?, slug = ?, content = ?, excerpt = ?, thumbnail_url = ?, status = ?, visibility = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [title, slug, content, excerpt, thumbnail_url, status, visibility, published_at, id]
  );

  return result.affectedRows > 0;
}

async function incrementViewCount(id) {
  const [result] = await pool.execute(
    `UPDATE posts
     SET view_count = view_count + 1
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  return result.affectedRows > 0;
}

async function softDeletePost(id) {
  const [result] = await pool.execute(
    `UPDATE posts
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  return result.affectedRows > 0;
}

/* posts_categories */

async function addCategoryToPost(post_id, category_id) {
  const [result] = await pool.execute(
    `INSERT INTO posts_categories (post_id, category_id)
     VALUES (?, ?)`,
    [post_id, category_id]
  );

  return result.insertId;
}

async function getCategoriesByPostId(postId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.slug
     FROM posts_categories pc
     INNER JOIN categories c ON pc.category_id = c.id
     WHERE pc.post_id = ?
     ORDER BY c.id ASC`,
    [postId]
  );

  return rows;
}

async function removeCategoriesByPostId(postId) {
  const [result] = await pool.execute(
    `DELETE FROM posts_categories
     WHERE post_id = ?`,
    [postId]
  );

  return result.affectedRows;
}

/* posts_tags */

async function addTagToPost(post_id, tag_id) {
  const [result] = await pool.execute(
    `INSERT INTO posts_tags (post_id, tag_id)
     VALUES (?, ?)`,
    [post_id, tag_id]
  );

  return result.insertId;
}

async function getTagsByPostId(postId) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.name, t.slug
     FROM posts_tags pt
     INNER JOIN tags t ON pt.tag_id = t.id
     WHERE pt.post_id = ?
     ORDER BY t.id ASC`,
    [postId]
  );

  return rows;
}

async function removeTagsByPostId(postId) {
  const [result] = await pool.execute(
    `DELETE FROM posts_tags
     WHERE post_id = ?`,
    [postId]
  );

  return result.affectedRows;
}

async function setPostCategories(post_id, categoryIds = []) {
  await pool.execute(
    `DELETE FROM posts_categories
     WHERE post_id = ?`,
    [post_id]
  );

  for (const category_id of categoryIds) {
    await pool.execute(
      `INSERT INTO posts_categories (post_id, category_id)
       VALUES (?, ?)`,
      [post_id, category_id]
    );
  }

  return true;
}

async function setPostTags(post_id, tagIds = []) {
  await pool.execute(
    `DELETE FROM posts_tags
     WHERE post_id = ?`,
    [post_id]
  );

  for (const tag_id of tagIds) {
    await pool.execute(
      `INSERT INTO posts_tags (post_id, tag_id)
       VALUES (?, ?)`,
      [post_id, tag_id]
    );
  }

  return true;
}

/* post_likes */

async function createPostLike(post_id, user_id) {
  const [result] = await pool.execute(
    `INSERT INTO post_likes (post_id, user_id)
     VALUES (?, ?)`,
    [post_id, user_id]
  );

  return result.insertId;
}

async function findPostLike(post_id, user_id) {
  const [rows] = await pool.execute(
    `SELECT id, post_id, user_id, created_at
     FROM post_likes
     WHERE post_id = ? AND user_id = ?
     LIMIT 1`,
    [post_id, user_id]
  );

  return rows[0] || null;
}

async function deletePostLike(post_id, user_id) {
  const [result] = await pool.execute(
    `DELETE FROM post_likes
     WHERE post_id = ? AND user_id = ?`,
    [post_id, user_id]
  );

  return result.affectedRows > 0;
}

async function countLikesByPostId(postId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM post_likes
     WHERE post_id = ?`,
    [postId]
  );

  return rows[0].total;
}

/* post_shares */

async function createPostShare(post_id, user_id, platform = 'internal') {
  const [result] = await pool.execute(
    `INSERT INTO post_shares (post_id, user_id, platform)
     VALUES (?, ?, ?)`,
    [post_id, user_id, platform]
  );

  return result.insertId;
}

async function countSharesByPostId(postId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM post_shares
     WHERE post_id = ?`,
    [postId]
  );

  return rows[0].total;
}

async function searchPublishedPosts({
  keyword = null,
  categoryId = null,
  tagId = null,
  limit = 10,
  offset = 0
}) {
  const conditions = [
    `p.status = 'published'`,
    `p.deleted_at IS NULL`
  ];

  const params = [];

  if (keyword) {
    conditions.push(`(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)`);
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
  }

  if (categoryId) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM posts_categories pc
        WHERE pc.post_id = p.id
          AND pc.category_id = ?
      )
    `);
    params.push(categoryId);
  }

  if (tagId) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM posts_tags pt
        WHERE pt.post_id = p.id
          AND pt.tag_id = ?
      )
    `);
    params.push(tagId);
  }

  params.push(Number(limit), Number(offset));

  const [rows] = await pool.execute(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      p.thumbnail_url,
      p.author_id,
      p.status,
      p.visibility,
      p.view_count,
      p.published_at,
      p.created_at,
      p.updated_at
    FROM posts p
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.published_at DESC, p.id DESC
    LIMIT ? OFFSET ?
    `,
    params
  );

  return rows;
}

async function countSearchPublishedPosts({
  keyword = null,
  categoryId = null,
  tagId = null
}) {
  const conditions = [
    `p.status = 'published'`,
    `p.deleted_at IS NULL`
  ];

  const params = [];

  if (keyword) {
    conditions.push(`(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)`);
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
  }

  if (categoryId) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM posts_categories pc
        WHERE pc.post_id = p.id
          AND pc.category_id = ?
      )
    `);
    params.push(categoryId);
  }

  if (tagId) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM posts_tags pt
        WHERE pt.post_id = p.id
          AND pt.tag_id = ?
      )
    `);
    params.push(tagId);
  }

  const [rows] = await pool.execute(
    `
    SELECT COUNT(*) AS total
    FROM posts p
    WHERE ${conditions.join(' AND ')}
    `,
    params
  );

  return rows[0]?.total || 0;
}

async function filterPosts({
  q = null,
  categoryId = null,
  tagId = null,
  status = null,
  visibility = null,
  authorId = null
}) {
  let sql = `
    SELECT DISTINCT
      p.id,
      p.author_id,
      p.title,
      p.slug,
      p.excerpt,
      p.cover_image,
      p.status,
      p.visibility,
      p.is_premium,
      p.published_at,
      p.created_at,
      p.updated_at
    FROM posts p
    LEFT JOIN posts_categories pc ON pc.post_id = p.id
    LEFT JOIN posts_tags pt ON pt.post_id = p.id
    WHERE 1 = 1
  `;

  const params = [];

  if (q) {
    sql += ` AND p.title LIKE ?`;
    params.push(`%${q}%`);
  }

  if (categoryId) {
    sql += ` AND pc.category_id = ?`;
    params.push(categoryId);
  }

  if (tagId) {
    sql += ` AND pt.tag_id = ?`;
    params.push(tagId);
  }

  if (status) {
    sql += ` AND p.status = ?`;
    params.push(status);
  }

  if (visibility) {
    sql += ` AND p.visibility = ?`;
    params.push(visibility);
  }

  if (authorId) {
    sql += ` AND p.author_id = ?`;
    params.push(authorId);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

function getFiveMinuteBucket() {
  const now = new Date();
  const minutes = now.getMinutes();
  const flooredMinutes = Math.floor(minutes / 5) * 5;

  now.setMinutes(flooredMinutes);
  now.setSeconds(0);
  now.setMilliseconds(0);

  return now;
}

async function findPostViewByUser(postId, userId, viewBucket) {
  const [rows] = await pool.execute(
    `
    SELECT id, post_id, user_id, ip_address, view_bucket, created_at
    FROM post_views
    WHERE post_id = ? AND user_id = ? AND view_bucket = ?
    LIMIT 1
    `,
    [postId, userId, viewBucket]
  );

  return rows[0] || null;
}

async function findPostViewByIp(postId, ipAddress, viewBucket) {
  const [rows] = await pool.execute(
    `
    SELECT id, post_id, user_id, ip_address, view_bucket, created_at
    FROM post_views
    WHERE post_id = ? AND ip_address = ? AND view_bucket = ?
    LIMIT 1
    `,
    [postId, ipAddress, viewBucket]
  );

  return rows[0] || null;
}

async function createPostView({ postId, userId = null, ipAddress = null, viewBucket }) {
  const [result] = await pool.execute(
    `
    INSERT INTO post_views (post_id, user_id, ip_address, view_bucket, created_at)
    VALUES (?, ?, ?, ?, NOW())
    `,
    [postId, userId, ipAddress, viewBucket]
  );

  return result.insertId;
}

async function incrementPostViewCount(postId) {
  const [result] = await pool.execute(
    `
    UPDATE posts
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = ?
    `,
    [postId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createPost,
  findPostById,
  findPostBySlug,
  getAllPosts,
  getPublishedPosts,
  getPostsByAuthor,
  updatePost,
  incrementViewCount,
  softDeletePost,
  addCategoryToPost,
  getCategoriesByPostId,
  removeCategoriesByPostId,
  addTagToPost,
  getTagsByPostId,
  removeTagsByPostId,
  setPostCategories,
  setPostTags,
  createPostLike,
  findPostLike,
  deletePostLike,
  countLikesByPostId,
  createPostShare,
  countSharesByPostId,
  searchPublishedPosts,
  countSearchPublishedPosts,
  filterPosts,
  findPostViewByUser,
  findPostViewByIp,
  createPostView,
  incrementPostViewCount,
  getFiveMinuteBucket
};