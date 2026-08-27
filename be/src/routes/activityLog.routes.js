const express = require('express');

const router = express.Router();

const activityLogController = require('../controllers/activityLog.controller');

const {
  verifyToken,
  requireRole
} = require('../middlewares/auth.middleware');

// Chỉ admin được tạo activity log thủ công
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  activityLogController.createLog
);

// Chỉ admin được xem toàn bộ activity log
router.get(
  '/',
  verifyToken,
  requireRole('admin'),
  activityLogController.getAllLogs
);

// Chỉ admin được xem log theo user
router.get(
  '/user/:userId',
  verifyToken,
  requireRole('admin'),
  activityLogController.getLogsByUser
);

// Chỉ admin được xem log theo target
router.get(
  '/target/:targetType/:targetId',
  verifyToken,
  requireRole('admin'),
  activityLogController.getLogsByTarget
);

module.exports = router;