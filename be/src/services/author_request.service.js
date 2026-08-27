const authorRequestModel = require('../models/author_request.model');
const activityLogService = require('./activityLog.service');

async function createAuthorRequest({
  userId,
  bio,
  reason,
  experience = null,
  sampleWork = null,
  currentUser
}) {
  const roles = currentUser?.roles || [];

  if (roles.includes('author') || roles.includes('admin')) {
    const error = new Error(
      'You already have permission to create posts'
    );

    error.statusCode = 400;
    throw error;
  }

  const pendingRequest =
    await authorRequestModel.findPendingRequestByUserId(userId);

  if (pendingRequest) {
    const error = new Error(
      'You already have a pending author request'
    );

    error.statusCode = 400;
    throw error;
  }

  const requestId = await authorRequestModel.createAuthorRequest({
    userId,
    bio,
    reason,
    experience,
    sampleWork
  });

  const request =
    await authorRequestModel.findAuthorRequestById(requestId);

  await activityLogService.tryLogActivity({
    userId,
    action: 'CREATE_AUTHOR_REQUEST',
    targetType: 'author_request',
    targetId: requestId
  });

  return request;
}

async function getMyAuthorRequests(userId) {
  return authorRequestModel.getAuthorRequestsByUserId(userId);
}

async function getAllAuthorRequests(status = null) {
  return authorRequestModel.getAllAuthorRequests(status);
}

async function approveAuthorRequest({
  requestId,
  reviewNote = null,
  currentUser
}) {
  const roles = currentUser?.roles || [];

  if (!roles.includes('admin')) {
    const error = new Error(
      'You do not have permission to approve author requests'
    );

    error.statusCode = 403;
    throw error;
  }

  const request =
    await authorRequestModel.findAuthorRequestById(requestId);

  if (!request) {
    const error = new Error('Author request not found');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'pending') {
    const error = new Error(
      'This request has already been reviewed'
    );

    error.statusCode = 400;
    throw error;
  }

  await authorRequestModel.assignAuthorRoleToUser(
    request.user_id
  );

  const updatedRequest =
    await authorRequestModel.updateAuthorRequestStatus({
      requestId,
      status: 'approved',
      reviewedBy: currentUser.id,
      reviewNote
    });

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action: 'APPROVE_AUTHOR_REQUEST',
    targetType: 'author_request',
    targetId: requestId
  });

  return updatedRequest;
}

async function rejectAuthorRequest({
  requestId,
  reviewNote = null,
  currentUser
}) {
  const roles = currentUser?.roles || [];

  if (!roles.includes('admin')) {
    const error = new Error(
      'You do not have permission to reject author requests'
    );

    error.statusCode = 403;
    throw error;
  }

  const request =
    await authorRequestModel.findAuthorRequestById(requestId);

  if (!request) {
    const error = new Error('Author request not found');
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== 'pending') {
    const error = new Error(
      'This request has already been reviewed'
    );

    error.statusCode = 400;
    throw error;
  }

  const updatedRequest =
    await authorRequestModel.updateAuthorRequestStatus({
      requestId,
      status: 'rejected',
      reviewedBy: currentUser.id,
      reviewNote
    });

  await activityLogService.tryLogActivity({
    userId: currentUser.id,
    action: 'REJECT_AUTHOR_REQUEST',
    targetType: 'author_request',
    targetId: requestId
  });

  return updatedRequest;
}

module.exports = {
  createAuthorRequest,
  getMyAuthorRequests,
  getAllAuthorRequests,
  approveAuthorRequest,
  rejectAuthorRequest
};