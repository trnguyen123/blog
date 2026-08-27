const activityLogService = require('../services/activityLog.service');

async function createLog(req, res) {
  try {
    const {
      action,
      targetType,
      targetId
    } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'action là bắt buộc'
      });
    }

    const log = await activityLogService.logActivity({
      userId: req.user.id,
      action,
      targetType: targetType || null,
      targetId: targetId || null
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo activity log thành công',
      data: log
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Tạo activity log thất bại'
    });
  }
}

async function getAllLogs(req, res) {
  try {
    const logs = await activityLogService.getLogs();

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Lấy danh sách activity log thất bại'
    });
  }
}

async function getLogsByUser(req, res) {
  try {
    const { userId } = req.params;

    const logs =
      await activityLogService.getLogsByUser(userId);

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message:
        error.message ||
        'Lấy activity log theo user thất bại'
    });
  }
}

async function getLogsByTarget(req, res) {
  try {
    const {
      targetType,
      targetId
    } = req.params;

    const logs =
      await activityLogService.getLogsByTarget(
        targetType,
        targetId
      );

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message:
        error.message ||
        'Lấy activity log theo target thất bại'
    });
  }
}

module.exports = {
  createLog,
  getAllLogs,
  getLogsByUser,
  getLogsByTarget
};