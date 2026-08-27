const express = require('express');
const router = express.Router();

const authorRequestController = require('../controllers/author_request.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// User
router.post('/author-requests', verifyToken, authorRequestController.createAuthorRequest);
router.get('/author-requests/me', verifyToken, authorRequestController.getMyAuthorRequests);

// Admin
router.get(
  '/author-requests',
  verifyToken,
  requireRole('admin'),
  authorRequestController.getAllAuthorRequests
);

router.patch(
  '/author-requests/:requestId/approve',
  verifyToken,
  requireRole('admin'),
  authorRequestController.approveAuthorRequest
);

router.patch(
  '/author-requests/:requestId/reject',
  verifyToken,
  requireRole('admin'),
  authorRequestController.rejectAuthorRequest
);

module.exports = router;