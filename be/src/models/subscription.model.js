const { pool } = require('../config/db');

async function createSubscriptionPlan({
  name,
  price,
  duration_days,
  features = null
}) {
  const [result] = await pool.execute(
    `INSERT INTO subscription_plans (
      name, price, duration_days, features, created_at, updated_at
    ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [name, price, duration_days, features ? JSON.stringify(features) : null]
  );

  return result.insertId;
}

async function getAllSubscriptionPlans() {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      name,
      price,
      duration_days,
      features,
      created_at,
      updated_at
    FROM subscription_plans
    ORDER BY price ASC, duration_days ASC`
  );

  return rows.map((row) => ({
    ...row,
    features: parseFeatures(row.features)
  }));
}

async function findSubscriptionPlanById(planId) {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      name,
      price,
      duration_days,
      features,
      created_at,
      updated_at
    FROM subscription_plans
    WHERE id = ?
    LIMIT 1`,
    [planId]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    features: parseFeatures(rows[0].features)
  };
}

async function updateSubscriptionPlan(planId, {
  name,
  price,
  duration_days,
  features = null
}) {
  await pool.execute(
    `UPDATE subscription_plans
     SET name = ?,
         price = ?,
         duration_days = ?,
         features = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [name, price, duration_days, features ? JSON.stringify(features) : null, planId]
  );

  return findSubscriptionPlanById(planId);
}

async function deleteSubscriptionPlan(planId) {
  const [result] = await pool.execute(
    `DELETE FROM subscription_plans WHERE id = ?`,
    [planId]
  );

  return result.affectedRows > 0;
}

async function createSubscription({
  userId,
  planId,
  status = 'pending',
  startDate = null,
  endDate = null,
  autoRenew = false
}) {
  const [result] = await pool.execute(
    `INSERT INTO subscriptions (
      user_id, plan_id, status, start_date, end_date, auto_renew, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [userId, planId, status, startDate, endDate, autoRenew ? 1 : 0]
  );

  return result.insertId;
}

async function findSubscriptionById(subscriptionId) {
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.user_id,
      s.plan_id,
      s.status,
      s.start_date,
      s.end_date,
      s.auto_renew,
      s.created_at,
      s.updated_at,
      sp.name AS plan_name,
      sp.price,
      sp.duration_days,
      sp.features
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.id = ?
    LIMIT 1`,
    [subscriptionId]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    features: parseFeatures(rows[0].features)
  };
}

async function findActiveSubscriptionByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.user_id,
      s.plan_id,
      s.status,
      s.start_date,
      s.end_date,
      s.auto_renew,
      s.created_at,
      s.updated_at,
      sp.name AS plan_name,
      sp.price,
      sp.duration_days,
      sp.features
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = ?
      AND s.status = 'active'
      AND (s.end_date IS NULL OR s.end_date >= NOW())
    ORDER BY s.created_at DESC
    LIMIT 1`,
    [userId]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    features: parseFeatures(rows[0].features)
  };
}

async function getSubscriptionsByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.user_id,
      s.plan_id,
      s.status,
      s.start_date,
      s.end_date,
      s.auto_renew,
      s.created_at,
      s.updated_at,
      sp.name AS plan_name,
      sp.price,
      sp.duration_days,
      sp.features
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    ...row,
    features: parseFeatures(row.features)
  }));
}

async function getAllSubscriptions() {
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.user_id,
      s.plan_id,
      s.status,
      s.start_date,
      s.end_date,
      s.auto_renew,
      s.created_at,
      s.updated_at,
      sp.name AS plan_name,
      sp.price,
      sp.duration_days,
      sp.features
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    ORDER BY s.created_at DESC`
  );

  return rows.map((row) => ({
    ...row,
    features: parseFeatures(row.features)
  }));
}

async function updateSubscriptionStatus(subscriptionId, status) {
  await pool.execute(
    `UPDATE subscriptions
     SET status = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [status, subscriptionId]
  );

  return findSubscriptionById(subscriptionId);
}

async function activateSubscription(subscriptionId, durationDays) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(durationDays));

  await pool.execute(
    `UPDATE subscriptions
     SET status = 'active',
         start_date = ?,
         end_date = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [startDate, endDate, subscriptionId]
  );

  return findSubscriptionById(subscriptionId);
}

async function expireSubscription(subscriptionId) {
  await pool.execute(
    `UPDATE subscriptions
     SET status = 'expired',
         updated_at = NOW()
     WHERE id = ?`,
    [subscriptionId]
  );

  return findSubscriptionById(subscriptionId);
}

async function expireUserActiveSubscriptions(userId) {
  await pool.execute(
    `UPDATE subscriptions
     SET status = 'expired',
         updated_at = NOW()
     WHERE user_id = ?
       AND status = 'active'`,
    [userId]
  );
}

function parseFeatures(features) {
  if (!features) return [];
  try {
    return typeof features === 'string' ? JSON.parse(features) : features;
  } catch (error) {
    return [];
  }
}

module.exports = {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  findSubscriptionPlanById,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createSubscription,
  findSubscriptionById,
  findActiveSubscriptionByUserId,
  getSubscriptionsByUserId,
  getAllSubscriptions,
  updateSubscriptionStatus,
  activateSubscription,
  expireSubscription,
  expireUserActiveSubscriptions
};