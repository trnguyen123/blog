const {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogsByUserId,
  getActivityLogsByTarget
} = require('../models/activityLog.model');

// Service layer: chứa business logic, validate dữ liệu trước khi
// gọi xuống model. Controller chỉ gọi hàm ở đây, không đụng model trực tiếp.

async function logActivity({ userId = null, action, targetType = null, targetId = null }) {
  if (!action || typeof action !== 'string' || !action.trim()) {
    throw new Error('action là bắt buộc và phải là chuỗi không rỗng');
  }

  const id = await createActivityLog({
    userId,
    action: action.trim(),
    targetType,
    targetId
  });

  return { id, userId, action, targetType, targetId };
}

async function getLogs() {
  return await getAllActivityLogs();
}

async function getLogsByUser(userId) {
  if (!userId) {
    throw new Error('userId là bắt buộc');
  }
  return await getActivityLogsByUserId(userId);
}

async function getLogsByTarget(targetType, targetId) {
  if (!targetType || !targetId) {
    throw new Error('targetType và targetId là bắt buộc');
  }
  return await getActivityLogsByTarget(targetType, targetId);
}

async function tryLogActivity(data) {
  try {
    await logActivity(data);
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
}

module.exports = {
  logActivity,
  getLogs,
  getLogsByUser,
  getLogsByTarget,
  tryLogActivity
};