const subscriptionService = require('../services/subscription.service');

async function createSubscriptionPlan(req, res, next) {
  try {
    const plan = await subscriptionService.createSubscriptionPlan(req.body, req.user);

    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
}

async function updateSubscriptionPlan(req, res, next) {
  try {
    const { id } = req.params;

    const plan = await subscriptionService.updateSubscriptionPlan(
      Number(id),
      req.body,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSubscriptionPlan(req, res, next) {
  try {
    const { id } = req.params;

    const result = await subscriptionService.deleteSubscriptionPlan(
      Number(id),
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getAllSubscriptionPlans(req, res, next) {
  try {
    const plans = await subscriptionService.getAllSubscriptionPlans();

    return res.status(200).json({
      success: true,
      message: 'Subscription plans fetched successfully',
      data: plans
    });
  } catch (error) {
    next(error);
  }
}

async function subscribePlan(req, res, next) {
  try {
    const { planId, autoRenew = false } = req.body;

    const subscription = await subscriptionService.subscribePlan({
      planId,
      autoRenew,
      currentUser: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Subscribed successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

async function getMySubscriptions(req, res, next) {
  try {
    const subscriptions = await subscriptionService.getMySubscriptions(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'My subscriptions fetched successfully',
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
}

async function getMyActiveSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getMyActiveSubscription(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'My active subscription fetched successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

async function getAllSubscriptions(req, res, next) {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions(req.user);

    return res.status(200).json({
      success: true,
      message: 'All subscriptions fetched successfully',
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
}

async function cancelSubscription(req, res, next) {
  try {
    const { id } = req.params;

    const subscription = await subscriptionService.cancelSubscription(Number(id), req.user);

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllSubscriptionPlans,
  subscribePlan,
  getMySubscriptions,
  getMyActiveSubscription,
  getAllSubscriptions,
  cancelSubscription
};