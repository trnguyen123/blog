const { pool } = require('../config/db');


async function createCategory({ name, slug, description = null }) {
  const [result] = await pool.execute(
    `INSERT INTO categories (name, slug, description)
     VALUES (?, ?, ?)`,
    [name, slug, description]
  );


  return result.insertId;
}


async function getAllCategories() {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description
     FROM categories
     ORDER BY id DESC`
  );


  return rows;
}


async function findCategoryById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description
     FROM categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );


  return rows[0] || null;
}


async function findCategoryBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description
     FROM categories
     WHERE slug = ?
     LIMIT 1`,
    [slug]
  );


  return rows[0] || null;
}


async function updateCategory(id, { name, slug, description = null }) {
  const [result] = await pool.execute(
    `UPDATE categories
     SET name = ?, slug = ?, description = ?
     WHERE id = ?`,
    [name, slug, description, id]
  );


  return result.affectedRows > 0;
}


async function deleteCategory(id) {
  const [result] = await pool.execute(
    `DELETE FROM categories
     WHERE id = ?`,
    [id]
  );


  return result.affectedRows > 0;
}


module.exports = {
  createCategory,
  getAllCategories,
  findCategoryById,
  findCategoryBySlug,
  updateCategory,
  deleteCategory
};