const profileService = require('../services/profile.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function getMyProfile(req, res) {
  try {
    const profile = await profileService.getMyProfile(req.user.id);

    if (!profile) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, profile, 'Profile fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch profile', 500);
  }
}

async function updateMyProfile(req, res) {
  try {
    const profile = await profileService.updateMyProfile(req.user.id, req.body);
    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return errorResponse(res, 'User not found', 404);
    }

    return errorResponse(res, error.message || 'Failed to update profile', 500);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile
};