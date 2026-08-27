const { pool } = require('../config/db');

async function createPayment({
  user_id,
  subscription_id,
  amount,
  payment_method,
  transaction_id = null,
  status = 'pending'
}) {
  const [result] = await pool.execute(
    `INSERT INTO payments (
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [user_id, subscription_id, amount, payment_method, transaction_id, status]
  );

  return findPaymentById(result.insertId);
}

async function findPaymentById(paymentId) {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    WHERE id = ?
    LIMIT 1`,
    [paymentId]
  );

  return rows[0] || null;
}

async function findPaymentByTransactionId(transactionId) {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    WHERE transaction_id = ?
    LIMIT 1`,
    [transactionId]
  );

  return rows[0] || null;
}

async function findPaymentByNormalizedTransactionId(transactionId) {
  const normalized = String(transactionId || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    WHERE REPLACE(REPLACE(UPPER(transaction_id), '_', ''), '-', '') = ?
    LIMIT 1`,
    [normalized]
  );

  return rows[0] || null;
}

async function getPaymentsByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    WHERE user_id = ?
    ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

async function getPaymentBySubscriptionId(subscriptionId) {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    WHERE subscription_id = ?
    ORDER BY created_at DESC
    LIMIT 1`,
    [subscriptionId]
  );

  return rows[0] || null;
}

async function getPendingPaymentBySubscriptionId(subscriptionId) {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    WHERE subscription_id = ? AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1`,
    [subscriptionId]
  );

  return rows[0] || null;
}

async function updatePaymentStatus(paymentId, status, transaction_id = null) {
  await pool.execute(
    `UPDATE payments
    SET status = ?,
        transaction_id = COALESCE(?, transaction_id)
    WHERE id = ?`,
    [status, transaction_id, paymentId]
  );

  return findPaymentById(paymentId);
}

async function getAllPayments() {
  const [rows] = await pool.execute(
    `SELECT 
      id,
      user_id,
      subscription_id,
      amount,
      payment_method,
      transaction_id,
      status,
      created_at
    FROM payments
    ORDER BY created_at DESC`
  );

  return rows;
}

module.exports = {
  createPayment,
  findPaymentById,
  findPaymentByTransactionId,
  findPaymentByNormalizedTransactionId,
  getPaymentsByUserId,
  getPaymentBySubscriptionId,
  getPendingPaymentBySubscriptionId,
  getAllPayments,
  updatePaymentStatus
};