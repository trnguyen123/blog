const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userModel = require('../models/user.model');
const refreshTokenModel = require('../models/refreshToken.model');
const activityLogService = require('./activityLog.service');
const { pool } = require('../config/db');

function signAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roles: user.roles || []
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  );
}

function generateRefreshTokenValue() {
  return crypto.randomBytes(64).toString('hex');
}

function buildRefreshTokenExpiryDate() {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() +
      Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7)
  );

  return expiresAt;
}

async function register(payload) {
  const existingUser = await userModel.findByEmail(payload.email);

  if (existingUser) {
    const error = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(payload.password, 10);

  const userId = await userModel.createUser({
    name: payload.name,
    email: payload.email,
    password_hash
  });

  const [roleRows] = await pool.execute(
    `
      SELECT id
      FROM roles
      WHERE name = ?
      LIMIT 1
    `,
    ['user']
  );

  if (roleRows.length > 0) {
    await userModel.assignRoleToUser(userId, roleRows[0].id);
  }

  const user = await userModel.findById(userId);
  const roleObjects = await userModel.getRolesByUserId(userId);
  const roles = roleObjects.map((role) => role.name);

  const accessToken = signAccessToken({
    ...user,
    roles
  });

  const refreshToken = generateRefreshTokenValue();
  const refreshTokenExpiresAt = buildRefreshTokenExpiryDate();

  await refreshTokenModel.createRefreshToken({
    userId,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt
  });

  await activityLogService.tryLogActivity({
    userId,
    action: 'USER_REGISTER',
    targetType: 'user',
    targetId: userId
  });

  return {
    user: {
      ...user,
      roles
    },
    accessToken,
    refreshToken
  };
}

async function login(payload) {
  const user = await userModel.findByEmail(payload.email);

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('Account is inactive');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(
    payload.password,
    user.password_hash
  );

  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const roleObjects = await userModel.getRolesByUserId(user.id);
  const roles = roleObjects.map((role) => role.name);

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    roles
  });

  const refreshToken = generateRefreshTokenValue();
  const refreshTokenExpiresAt = buildRefreshTokenExpiryDate();

  await refreshTokenModel.createRefreshToken({
    userId: user.id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt
  });

  await activityLogService.tryLogActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    targetType: 'user',
    targetId: user.id
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
      status: user.status,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles
    },
    accessToken,
    refreshToken
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }

  await refreshTokenModel.deleteExpiredTokens();

  const existingRefreshToken =
    await refreshTokenModel.findRefreshTokenByToken(refreshToken);

  if (!existingRefreshToken) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await userModel.findById(
    existingRefreshToken.user_id
  );

  if (!user) {
    await refreshTokenModel.deleteRefreshToken(refreshToken);

    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== 'active') {
    await refreshTokenModel.deleteRefreshToken(refreshToken);

    const error = new Error('Account is inactive');
    error.statusCode = 403;
    throw error;
  }

  const roleObjects = await userModel.getRolesByUserId(user.id);
  const roles = roleObjects.map((role) => role.name);

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    roles
  });

  return {
    accessToken
  };
}

async function logout(refreshToken) {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }

  const existingRefreshToken =
    await refreshTokenModel.findRefreshTokenByToken(refreshToken);

  const deleted =
    await refreshTokenModel.deleteRefreshToken(refreshToken);

  if (deleted && existingRefreshToken) {
    await activityLogService.tryLogActivity({
      userId: existingRefreshToken.user_id,
      action: 'USER_LOGOUT',
      targetType: 'user',
      targetId: existingRefreshToken.user_id
    });
  }

  return {
    loggedOut: deleted
  };
}

async function getCurrentUser(userId) {
  const user = await userModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const roleObjects = await userModel.getRolesByUserId(userId);
  const roles = roleObjects.map((role) => role.name);

  return {
    ...user,
    roles
  };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser
};