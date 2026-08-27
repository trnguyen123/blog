const express = require('express');
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const profileRoutes = require('./profile.routes');
const commentRoutes = require('./comment.routes');
const authorRequestRoutes = require('./author_request.routes');
const subscriptionRoutes = require('./subscription.routes');
const paymentRoutes = require('./payment.routes');
const categoryRoutes = require('./category.routes');
const tagRoutes = require('./tag.routes');
const authorStatsRoutes = require('./author-stats.routes');
const adminDashboardRoutes = require('./admin-dashboard.routes');
const userAdminRoutes = require('./user-admin.routes');
const notificationRoutes = require('./notification.routes');
const activityLogRoutes = require('./activityLog.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/profile', profileRoutes);
router.use('/', commentRoutes);
router.use('/', authorRequestRoutes);
router.use('/', subscriptionRoutes);
router.use('/', paymentRoutes);
router.use('/', categoryRoutes);
router.use('/', tagRoutes);
router.use('/', authorStatsRoutes);
router.use('/', adminDashboardRoutes);
router.use('/', userAdminRoutes);
router.use('/', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);

module.exports = router;