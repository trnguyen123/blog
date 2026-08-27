const adminDashboardService = require('../services/admin-dashboard.service');

async function getDashboardOverview(req, res, next) {
  try {
    const data = await adminDashboardService.getDashboardOverview();

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard overview fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getDashboardContentStats(req, res, next) {
  try {
    const limit = req.query.limit || 5;
    const data = await adminDashboardService.getDashboardContentStats(limit);

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard content stats fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getDashboardPaymentStats(req, res, next) {
  try {
    const data = await adminDashboardService.getDashboardPaymentStats();

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard payment stats fetched successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardOverview,
  getDashboardContentStats,
  getDashboardPaymentStats
};