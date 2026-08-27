const express = require('express');
const router = express.Router();

const authorStatsController = require('../controllers/author-stats.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.get(
  '/authors/me/stats/overview',
  verifyToken,
  requireRole('author', 'admin'),
  authorStatsController.getMyAuthorOverview
);

router.get(
  '/authors/me/stats/top-posts',
  verifyToken,
  requireRole('author', 'admin'),
  authorStatsController.getMyTopPosts
);

module.exports = router;