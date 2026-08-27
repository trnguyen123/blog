const { pool } = require('../config/db');

async function getAllRoles() {
  const [rows] = await pool.execute(
    `SELECT id, name, description
     FROM roles
     ORDER BY id ASC`
  );

  return rows;
}

async function findRoleByName(name) {
  const [rows] = await pool.execute(
    `SELECT id, name, description
     FROM roles
     WHERE name = ?
     LIMIT 1`,
    [name]
  );

  return rows[0] || null;
}

module.exports = {
  getAllRoles,
  findRoleByName
};