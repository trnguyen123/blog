const authorRequestService = require('../services/author_request.service');

async function createAuthorRequest(req, res, next) {
  try {
    const { bio, reason, experience = null, sampleWork = null } = req.body;

    const request = await authorRequestService.createAuthorRequest({
      userId: req.user.id,
      bio,
      reason,
      experience,
      sampleWork,
      currentUser: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Author request submitted successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

async function getMyAuthorRequests(req, res, next) {
  try {
    const requests = await authorRequestService.getMyAuthorRequests(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'My author requests fetched successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
}

async function getAllAuthorRequests(req, res, next) {
  try {
    const { status } = req.query;

    const requests = await authorRequestService.getAllAuthorRequests(status || null);

    return res.status(200).json({
      success: true,
      message: 'Author requests fetched successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
}

async function approveAuthorRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const { reviewNote = null } = req.body;

    const request = await authorRequestService.approveAuthorRequest({
      requestId: Number(requestId),
      reviewNote,
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Author request approved successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

async function rejectAuthorRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const { reviewNote = null } = req.body;

    const request = await authorRequestService.rejectAuthorRequest({
      requestId: Number(requestId),
      reviewNote,
      currentUser: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Author request rejected successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAuthorRequest,
  getMyAuthorRequests,
  getAllAuthorRequests,
  approveAuthorRequest,
  rejectAuthorRequest
};