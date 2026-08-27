const express = require('express');
const router = express.Router();

const adminDashboardController = require('../controllers/admin-dashboard.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.get(
  '/admin/dashboard/overview',
  verifyToken,
  requireRole('admin'),
  adminDashboardController.getDashboardOverview
);

router.get(
  '/admin/dashboard/content-stats',
  verifyToken,
  requireRole('admin'),
  adminDashboardController.getDashboardContentStats
);

router.get(
  '/admin/dashboard/payment-stats',
  verifyToken,
  requireRole('admin'),
  adminDashboardController.getDashboardPaymentStats
);

module.exports = router;