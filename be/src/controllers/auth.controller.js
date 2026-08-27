const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result = await authService.register(value);

    return res.status(201).json({
      success: true,
      message: 'Register successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result = await authService.login(value);

    return res.status(200).json({
      success: true,
      message: 'Login successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;

    const result = await authService.logout(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Logout successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await authService.getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};