const userModel = require('../models/user.model');
const activityLogService = require('./activityLog.service');

const ALLOWED_STATUSES = [
  'active',
  'inactive',
  'banned'
];

const ALLOWED_ROLES = [
  'author',
  'admin'
];

async function getAllUsers() {
  return userModel.getAllUsersWithRoles();
}

async function getUserDetail(userId) {
  const user = await userModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const roles = await userModel.getRolesByUserId(userId);
  const profile =
    await userModel.findUserProfileByUserId(userId);

  return {
    ...user,
    roles,
    profile
  };
}

async function updateUserStatus({
  userId,
  status,
  currentUser
}) {
  if (!ALLOWED_STATUSES.includes(status)) {
    const error = new Error('Invalid status');
    error.statusCode = 400;
    throw error;
  }

  if (Number(userId) === Number(currentUser.id)) {
    const error = new Error(
      'You cannot change your own status'
    );

    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await userModel.updateUserStatus(
    userId,
    status
  );

  if (!updated) {
    const error = new Error(
      'Update user status failed'
    );

    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await userModel.findById(userId);

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action: 'UPDATE_USER_STATUS',
    targetType: 'user',
    targetId: userId
  });

  return updatedUser;
}

async function deleteUser({
  userId,
  currentUser
}) {
  if (Number(userId) === Number(currentUser.id)) {
    const error = new Error(
      'You cannot delete your own account'
    );

    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted = await userModel.softDeleteUser(userId);

  if (!deleted) {
    const error = new Error('Delete user failed');
    error.statusCode = 400;
    throw error;
  }

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action: 'DELETE_USER',
    targetType: 'user',
    targetId: userId
  });

  return true;
}

async function assignRole({
  userId,
  roleName,
  currentUser
}) {
  if (!ALLOWED_ROLES.includes(roleName)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const role = await userModel.findRoleByName(roleName);

  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  const alreadyHasRole =
    await userModel.hasRole(userId, roleName);

  if (alreadyHasRole) {
    const error = new Error(
      'User already has this role'
    );

    error.statusCode = 400;
    throw error;
  }

  await userModel.assignRoleToUser(userId, role.id);

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || null,
    action: 'ASSIGN_ROLE',
    targetType: 'user',
    targetId: userId
  });

  return userModel.getRolesByUserId(userId);
}

async function removeRole({
  userId,
  roleName,
  currentUser
}) {
  if (
    Number(userId) === Number(currentUser.id) &&
    roleName === 'admin'
  ) {
    const error = new Error(
      'You cannot remove your own admin role'
    );

    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const role = await userModel.findRoleByName(roleName);

  if (!role) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }

  const userHasRole =
    await userModel.hasRole(userId, roleName);

  if (!userHasRole) {
    const error = new Error(
      'User does not have this role'
    );

    error.statusCode = 400;
    throw error;
  }

  await userModel.removeRoleFromUser(userId, role.id);

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action: 'REMOVE_ROLE',
    targetType: 'user',
    targetId: userId
  });

  return userModel.getRolesByUserId(userId);
}

module.exports = {
  getAllUsers,
  getUserDetail,
  updateUserStatus,
  deleteUser,
  assignRole,
  removeRole
};