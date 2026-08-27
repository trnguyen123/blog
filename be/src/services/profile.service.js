const userModel = require('../models/user.model');
const { pick } = require('../utils/pick');

async function getMyProfile(userId) {
  const user = await userModel.findById(userId);

  if (!user) {
    return null;
  }

  const profile = await userModel.findUserProfileByUserId(userId);
  const roles = await userModel.getRolesByUserId(userId);

  return {
    ...user,
    profile,
    roles
  };
}

async function updateMyProfile(userId, payload) {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const userPayload = pick(payload, ['name', 'avatar_url', 'bio']);
  const profilePayload = pick(payload, ['website', 'facebook', 'twitter', 'linkedin']);

  if (Object.keys(userPayload).length > 0) {
    await userModel.updateProfile(userId, {
      name: userPayload.name ?? user.name,
      avatar_url: userPayload.avatar_url ?? user.avatar_url,
      bio: userPayload.bio ?? user.bio
    });
  }

  if (Object.keys(profilePayload).length > 0) {
    await userModel.upsertUserProfile({
      userId,
      website: profilePayload.website ?? null,
      facebook: profilePayload.facebook ?? null,
      twitter: profilePayload.twitter ?? null,
      linkedin: profilePayload.linkedin ?? null
    });
  }

  return getMyProfile(userId);
}

module.exports = {
  getMyProfile,
  updateMyProfile
};