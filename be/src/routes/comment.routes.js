const express = require('express');
const router = express.Router();

const commentController = require('../controllers/comment.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Public
router.get('/posts/:postId/comments', commentController.getCommentsByPostId);
router.get('/comments/:commentId/replies', commentController.getCommentReplies);

// User
router.post('/posts/:postId/comments', verifyToken, commentController.createComment);
router.post('/posts/:postId/comments/:commentId/replies', verifyToken, commentController.createReply);
router.patch('/comments/:commentId', verifyToken, commentController.updateMyComment);
router.delete('/comments/:commentId', verifyToken, commentController.deleteMyComment);
router.get('/comments/me/list', verifyToken, commentController.getMyComments);

// Like / Report comment
router.post('/comments/:commentId/like', verifyToken, commentController.likeComment);
router.delete('/comments/:commentId/like', verifyToken, commentController.unlikeComment);
router.post('/comments/:commentId/report', verifyToken, commentController.reportComment);

// Admin view reports
router.get(
  '/comments/:commentId/reports',
  verifyToken,
  requireRole('admin', 'super_admin'),
  commentController.getReportsByCommentId
);

// Author/Admin moderation
router.get(
  '/posts/:postId/comments/pending',
  verifyToken,
  requireRole('author', 'admin', 'super_admin'),
  commentController.getPendingCommentsByPostId
);

router.patch(
  '/comments/:commentId/status',
  verifyToken,
  requireRole('author', 'admin', 'super_admin'),
  commentController.updateCommentStatus
);

router.get(
  '/comments/pending/me',
  verifyToken,
  requireRole('author', 'admin', 'super_admin'),
  commentController.getMyPendingComments
);

router.get(
  '/posts/:postId/comments/pending',
  verifyToken,
  requireRole('author', 'admin', 'super_admin'),
  commentController.getPendingCommentsByPostId
);

router.get(
  '/comments/moderation/me',
  verifyToken,
  requireRole('author', 'admin', 'super_admin'),
  commentController.getMyModerationComments
);

module.exports = router;