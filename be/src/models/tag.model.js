const { pool } = require('../config/db');

async function createTag({ name, slug, description = null }) {
  const [result] = await pool.execute(
    `INSERT INTO tags (name, slug, description)
     VALUES (?, ?, ?)`,
    [name, slug, description]
  );

  return result.insertId;
}

async function getAllTags() {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description
     FROM tags
     ORDER BY id DESC`
  );

  return rows;
}

async function findTagById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description
     FROM tags
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findTagBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description
     FROM tags
     WHERE slug = ?
     LIMIT 1`,
    [slug]
  );

  return rows[0] || null;
}

async function updateTag(id, { name, slug, description = null }) {
  const [result] = await pool.execute(
    `UPDATE tags
     SET name = ?, slug = ?, description = ?
     WHERE id = ?`,
    [name, slug, description, id]
  );

  return result.affectedRows > 0;
}

async function deleteTag(id) {
  const [result] = await pool.execute(
    `DELETE FROM tags
     WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createTag,
  getAllTags,
  findTagById,
  findTagBySlug,
  updateTag,
  deleteTag
};