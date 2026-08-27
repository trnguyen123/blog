function validateUpdateMyProfile(req, res, next) {
  const {
    name,
    avatar_url,
    bio,
    website,
    facebook,
    twitter,
    linkedin
  } = req.body;

  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    errors.push('name must be a non-empty string');
  }

  if (avatar_url !== undefined && typeof avatar_url !== 'string') {
    errors.push('avatar_url must be a string');
  }

  if (bio !== undefined && typeof bio !== 'string') {
    errors.push('bio must be a string');
  }

  if (website !== undefined && typeof website !== 'string') {
    errors.push('website must be a string');
  }

  if (facebook !== undefined && typeof facebook !== 'string') {
    errors.push('facebook must be a string');
  }

  if (twitter !== undefined && typeof twitter !== 'string') {
    errors.push('twitter must be a string');
  }

  if (linkedin !== undefined && typeof linkedin !== 'string') {
    errors.push('linkedin must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

module.exports = {
  validateUpdateMyProfile
};