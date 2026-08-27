const userAdminService = require('../services/user-admin.service');

async function getAllUsers(req, res, next) {
  try {
    const users = await userAdminService.getAllUsers();

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function getUserDetail(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await userAdminService.getUserDetail(Number(userId));

    return res.status(200).json({
      success: true,
      message: 'User detail fetched successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await userAdminService.updateUserStatus({
      userId: Number(userId),
      status,
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;

    await userAdminService.deleteUser({
      userId: Number(userId),
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function assignRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const roles = await userAdminService.assignRole({
      userId: Number(userId),
      roleName: role,
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: roles
    });
  } catch (error) {
    next(error);
  }
}

async function removeRole(req, res, next) {
  try {
    const { userId, role } = req.params;

    const roles = await userAdminService.removeRole({
      userId: Number(userId),
      roleName: role,
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Role removed successfully',
      data: roles
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserDetail,
  updateUserStatus,
  deleteUser,
  assignRole,
  removeRole
};