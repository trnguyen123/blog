import httpClient from './httpClient';

async function getAllActivityLogs() {
  return httpClient('/activity-logs');
}

async function getActivityLogsByUser(userId) {
  return httpClient(`/activity-logs/user/${userId}`);
}

async function getActivityLogsByTarget(targetType, targetId) {
  return httpClient(`/activity-logs/target/${targetType}/${targetId}`);
}

const activityLogService = {
  getAllActivityLogs,
  getActivityLogsByUser,
  getActivityLogsByTarget
};

export default activityLogService;