const { pool } = require('../config/db');

async function createUser({
  name,
  email,
  password_hash,
  avatar_url = null,
  bio = null,
  status = 'active',
  email_verified = 0
}) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, avatar_url, bio, status, email_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, password_hash, avatar_url, bio, status, email_verified]
  );

  return result.insertId;
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, avatar_url, bio, status, email_verified, created_at, updated_at
     FROM users
     WHERE email = ? AND deleted_at IS NULL
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, avatar_url, bio, status, email_verified, created_at, updated_at
     FROM users
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function updateProfile(id, { name, avatar_url = null, bio = null }) {
  const [result] = await pool.execute(
    `UPDATE users
     SET name = ?, avatar_url = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [name, avatar_url, bio, id]
  );

  return result.affectedRows > 0;
}

async function softDeleteUser(id) {
  const [result] = await pool.execute(
    `UPDATE users
     SET deleted_at = CURRENT_TIMESTAMP, status = 'inactive'
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  return result.affectedRows > 0;
}

async function getAllUsers() {
  const [rows] = await pool.execute(
    `SELECT id, name, email, avatar_url, bio, status, email_verified, created_at, updated_at
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY id DESC`
  );

  return rows;
}

/* user_roles gộp chung vào user.model */

async function assignRoleToUser(user_id, role_id) {
  const [result] = await pool.execute(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES (?, ?)`,
    [user_id, role_id]
  );

  return result.insertId;
}

async function getRolesByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.name, r.description
     FROM user_roles ur
     INNER JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ?
     ORDER BY r.id ASC`,
    [userId]
  );

  return rows;
}

async function removeRoleFromUser(user_id, role_id) {
  const [result] = await pool.execute(
    `DELETE FROM user_roles
     WHERE user_id = ? AND role_id = ?`,
    [user_id, role_id]
  );

  return result.affectedRows > 0;
}

async function hasRole(userId, roleName) {
  const [rows] = await pool.execute(
    `SELECT r.id
     FROM user_roles ur
     INNER JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ? AND r.name = ?
     LIMIT 1`,
    [userId, roleName]
  );

  return !!rows[0];
}

/* user_profiles */

async function createUserProfile({
  userId,
  website = null,
  facebook = null,
  twitter = null,
  linkedin = null
}) {
  const [result] = await pool.execute(
    `INSERT INTO user_profiles (
      user_id, website, facebook, twitter, linkedin, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [userId, website, facebook, twitter, linkedin]
  );

  return result.affectedRows > 0;
}

async function findUserProfileByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT user_id, website, facebook, twitter, linkedin, created_at, updated_at
     FROM user_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function updateUserProfile(userId, {
  website = null,
  facebook = null,
  twitter = null,
  linkedin = null
}) {
  const [result] = await pool.execute(
    `UPDATE user_profiles
     SET website = ?, facebook = ?, twitter = ?, linkedin = ?, updated_at = NOW()
     WHERE user_id = ?`,
    [website, facebook, twitter, linkedin, userId]
  );

  return result.affectedRows > 0;
}

async function upsertUserProfile({
  userId,
  website = null,
  facebook = null,
  twitter = null,
  linkedin = null
}) {
  const existingProfile = await findUserProfileByUserId(userId);

  if (!existingProfile) {
    await createUserProfile({
      userId,
      website,
      facebook,
      twitter,
      linkedin
    });

    return findUserProfileByUserId(userId);
  }

  await updateUserProfile(userId, {
    website,
    facebook,
    twitter,
    linkedin
  });

  return findUserProfileByUserId(userId);
}

/*
  BỔ SUNG vào file models/user.model.js hiện có của bạn.
  Thêm các hàm dưới đây vào file, và nhớ thêm chúng vào module.exports ở cuối file.
*/

async function getAllUsersWithRoles() {
  const [rows] = await pool.execute(
    `SELECT
        u.id, u.name, u.email, u.avatar_url, u.bio, u.status, u.email_verified,
        u.created_at, u.updated_at,
        GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.deleted_at IS NULL
     GROUP BY u.id
     ORDER BY u.id DESC`
  );

  return rows.map((row) => ({
    ...row,
    roles: row.roles ? row.roles.split(',') : []
  }));
}

async function updateUserStatus(id, status) {
  const [result] = await pool.execute(
    `UPDATE users
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [status, id]
  );

  return result.affectedRows > 0;
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
    createUser,
    findByEmail,
    findById,
    updateProfile,
    softDeleteUser,
    getAllUsers,
    assignRoleToUser,
    getRolesByUserId,
    removeRoleFromUser,
    hasRole,
    createUserProfile,
    findUserProfileByUserId,
    updateUserProfile,
    upsertUserProfile,
    getAllUsersWithRoles,   
    updateUserStatus,       
    findRoleByName         
  };