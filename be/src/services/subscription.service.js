const subscriptionModel = require('../models/subscription.model');

async function createSubscriptionPlan(data, currentUser) {
  const roles = currentUser.roles || [];
  if (!roles.includes('admin')) {
    const error = new Error('You do not have permission to create subscription plans');
    error.statusCode = 403;
    throw error;
  }

  const { name, price, duration_days, features = null } = data;

  if (!name || !price || !duration_days) {
    const error = new Error('Name, price and duration_days are required');
    error.statusCode = 400;
    throw error;
  }

  const planId = await subscriptionModel.createSubscriptionPlan({
    name,
    price,
    duration_days,
    features
  });

  return subscriptionModel.findSubscriptionPlanById(planId);
}

async function updateSubscriptionPlan(planId, data, currentUser) {
  const roles = currentUser.roles || [];
  if (!roles.includes('admin')) {
    const error = new Error('You do not have permission to update subscription plans');
    error.statusCode = 403;
    throw error;
  }

  const existingPlan = await subscriptionModel.findSubscriptionPlanById(planId);
  if (!existingPlan) {
    const error = new Error('Subscription plan not found');
    error.statusCode = 404;
    throw error;
  }

  const { name, price, duration_days, features = null } = data;

  if (!name || !price || !duration_days) {
    const error = new Error('Name, price and duration_days are required');
    error.statusCode = 400;
    throw error;
  }

  return subscriptionModel.updateSubscriptionPlan(planId, {
    name,
    price,
    duration_days,
    features
  });
}

async function deleteSubscriptionPlan(planId, currentUser) {
  const roles = currentUser.roles || [];
  if (!roles.includes('admin')) {
    const error = new Error('You do not have permission to delete subscription plans');
    error.statusCode = 403;
    throw error;
  }

  const existingPlan = await subscriptionModel.findSubscriptionPlanById(planId);
  if (!existingPlan) {
    const error = new Error('Subscription plan not found');
    error.statusCode = 404;
    throw error;
  }

  const deleted = await subscriptionModel.deleteSubscriptionPlan(planId);
  return { deleted };
}

async function getAllSubscriptionPlans() {
  return subscriptionModel.getAllSubscriptionPlans();
}

async function subscribePlan({ planId, autoRenew = false, currentUser }) {
  const plan = await subscriptionModel.findSubscriptionPlanById(planId);
  if (!plan) {
    const error = new Error('Subscription plan not found');
    error.statusCode = 404;
    throw error;
  }

  const activeSubscription = await subscriptionModel.findActiveSubscriptionByUserId(currentUser.id);
  if (activeSubscription) {
    await subscriptionModel.expireUserActiveSubscriptions(currentUser.id);
  }

  const subscriptionId = await subscriptionModel.createSubscription({
    userId: currentUser.id,
    planId,
    status: 'pending',
    startDate: null,
    endDate: null,
    autoRenew
  });

  return subscriptionModel.findSubscriptionById(subscriptionId);
}

async function getMySubscriptions(userId) {
  return subscriptionModel.getSubscriptionsByUserId(userId);
}

async function getMyActiveSubscription(userId) {
  return subscriptionModel.findActiveSubscriptionByUserId(userId);
}

async function hasActiveSubscription(userId) {
  const subscription = await subscriptionModel.findActiveSubscriptionByUserId(userId);
  return !!subscription;
}

async function getAllSubscriptions(currentUser) {
  const roles = currentUser.roles || [];
  if (!roles.includes('admin')) {
    const error = new Error('You do not have permission to view all subscriptions');
    error.statusCode = 403;
    throw error;
  }

  return subscriptionModel.getAllSubscriptions();
}

async function cancelSubscription(subscriptionId, currentUser) {
  const subscription = await subscriptionModel.findSubscriptionById(subscriptionId);
  if (!subscription) {
    const error = new Error('Subscription not found');
    error.statusCode = 404;
    throw error;
  }

  const roles = currentUser.roles || [];
  const isAdmin = roles.includes('admin');
  const isOwner = Number(subscription.user_id) === Number(currentUser.id);

  if (!isAdmin && !isOwner) {
    const error = new Error('You do not have permission to cancel this subscription');
    error.statusCode = 403;
    throw error;
  }

  return subscriptionModel.updateSubscriptionStatus(subscriptionId, 'cancelled');
}

module.exports = {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getAllSubscriptionPlans,
  subscribePlan,
  getMySubscriptions,
  getMyActiveSubscription,
  hasActiveSubscription,
  getAllSubscriptions,
  cancelSubscription
};