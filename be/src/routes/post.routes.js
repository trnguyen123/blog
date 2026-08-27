const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const {
  validateCreatePost,
  validateUpdatePost
} = require('../validators/post.validator');

// Public routes
router.get('/published', postController.getPublishedPosts);
router.get('/search', postController.searchPosts);
router.get('/filter', postController.filterPosts);
router.get('/slug/:slug', postController.getPostDetail);
router.post('/:id/view', postController.recordPostView);

// Logged-in user routes
router.post('/:id/like', verifyToken, postController.toggleLike);

// Author/Admin routes
router.get(
  '/me/list',
  verifyToken,
  requireRole('author', 'admin'),
  postController.getMyPosts
);

router.post(
  '/',
  verifyToken,
  requireRole('author', 'admin'),
  validateCreatePost,
  postController.createPost
);

router.patch(
  '/:id',
  verifyToken,
  requireRole('author', 'admin'),
  validateUpdatePost,
  postController.updateMyPost
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('author', 'admin'),
  postController.deleteMyPost
);

module.exports = router;