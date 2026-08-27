const express = require('express');
const router = express.Router();

const subscriptionController = require('../controllers/subscription.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Public/User
router.get('/subscription-plans', subscriptionController.getAllSubscriptionPlans);
router.post('/subscriptions', verifyToken, subscriptionController.subscribePlan);
router.get('/subscriptions/me', verifyToken, subscriptionController.getMySubscriptions);
router.get('/subscriptions/me/active', verifyToken, subscriptionController.getMyActiveSubscription);
router.patch('/subscriptions/:id/cancel', verifyToken, subscriptionController.cancelSubscription);

// Admin
router.post(
  '/subscription-plans',
  verifyToken,
  requireRole('admin'),
  subscriptionController.createSubscriptionPlan
);

router.patch(
  '/subscription-plans/:id',
  verifyToken,
  requireRole('admin'),
  subscriptionController.updateSubscriptionPlan
);

router.delete(
  '/subscription-plans/:id',
  verifyToken,
  requireRole('admin'),
  subscriptionController.deleteSubscriptionPlan
);

router.get(
  '/subscriptions',
  verifyToken,
  requireRole('admin'),
  subscriptionController.getAllSubscriptions
);

module.exports = router;