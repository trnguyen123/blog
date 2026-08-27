const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || []
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const hasRole = (req.user.roles || []).some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission'
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole
};