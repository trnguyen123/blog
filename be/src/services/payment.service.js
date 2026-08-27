const paymentModel = require('../models/payment.model');
const subscriptionModel = require('../models/subscription.model');

const vnpayGateway = require('../services/gateways/vnpay.gateway');
const paypalGateway = require('../services/gateways/paypal.gateway');
const sepayGateway = require('../services/gateways/sepay.gateway');

const activityLogService = require('./activityLog.service');

const ALLOWED_PAYMENT_METHODS = [
  'vnpay',
  'paypal',
  'sepay'
];

function generateTransactionId(
  paymentMethod = 'PAY'
) {
  const prefix = String(paymentMethod || 'PAY')
    .trim()
    .toUpperCase();

  return `${prefix}_${Date.now()}_${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

function normalizeTransactionId(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function convertVndToUsd(vndAmount) {
  const rate = Number(
    process.env.PAYPAL_VND_TO_USD_RATE || 25000
  );

  if (!rate || rate <= 0) {
    throw new Error(
      'INVALID_PAYPAL_VND_TO_USD_RATE'
    );
  }

  const usdAmount = Number(vndAmount) / rate;

  if (!usdAmount || usdAmount <= 0) {
    throw new Error('INVALID_PAYPAL_AMOUNT');
  }

  return usdAmount.toFixed(2);
}

function extractSepayTransactionId(content) {
  if (!content) {
    return null;
  }

  const normalized = String(content)
    .trim()
    .toUpperCase();

  const match = normalized.match(
    /\bSEPAY(?:_\d+_\d+|\d+)\b/
  );

  return match ? match[0] : null;
}

async function activateSubscriptionIfNeeded(
  subscriptionId
) {
  const subscription =
    await subscriptionModel.findSubscriptionById(
      subscriptionId
    );

  if (!subscription) {
    throw new Error('SUBSCRIPTION_NOT_FOUND');
  }

  if (subscription.status !== 'active') {
    await subscriptionModel.activateSubscription(
      subscriptionId,
      subscription.duration_days
    );
  }

  return subscriptionModel.findSubscriptionById(
    subscriptionId
  );
}

async function createPayment({
  userId,
  subscription_id,
  payment_method,
  ipAddr
}) {
  if (!subscription_id || !payment_method) {
    throw new Error(
      'SUBSCRIPTION_ID_AND_PAYMENT_METHOD_REQUIRED'
    );
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      payment_method
    )
  ) {
    throw new Error('INVALID_PAYMENT_METHOD');
  }

  const subscription =
    await subscriptionModel.findSubscriptionById(
      subscription_id
    );

  if (!subscription) {
    throw new Error('SUBSCRIPTION_NOT_FOUND');
  }

  if (
    Number(subscription.user_id) !== Number(userId)
  ) {
    throw new Error('FORBIDDEN');
  }

  if (subscription.status === 'active') {
    throw new Error(
      'SUBSCRIPTION_ALREADY_ACTIVE'
    );
  }

  const pendingPayment =
    await paymentModel.getPendingPaymentBySubscriptionId(
      subscription_id
    );

  if (pendingPayment) {
    throw new Error(
      'PENDING_PAYMENT_ALREADY_EXISTS'
    );
  }

  const amount =
    subscription.price ||
    subscription.plan_price;

  if (!amount) {
    throw new Error(
      'SUBSCRIPTION_PRICE_NOT_FOUND'
    );
  }

  const transactionId =
    generateTransactionId(payment_method);

  const payment = await paymentModel.createPayment({
    user_id: userId,
    subscription_id,
    amount,
    payment_method,
    transaction_id: transactionId,
    status: 'pending'
  });

  await activityLogService.tryLogActivity({
    userId,
    action: 'CREATE_PAYMENT',
    targetType: 'payment',
    targetId: payment.id
  });

  if (payment_method === 'vnpay') {
    const paymentUrl =
      vnpayGateway.createPaymentUrl({
        tmnCode: process.env.VNP_TMN_CODE,
        secretKey: process.env.VNP_HASH_SECRET,
        vnpUrl: process.env.VNP_URL,
        returnUrl: process.env.VNP_RETURN_URL,
        txnRef: payment.transaction_id,
        orderInfo:
          `Thanh toan subscription ${subscription_id}`,
        amount: payment.amount,
        ipAddr: ipAddr || '127.0.0.1'
      });

    return {
      ...payment,
      payment_url: paymentUrl
    };
  }

  if (payment_method === 'paypal') {
    const paypalAmountUsd =
      convertVndToUsd(payment.amount);

    const order =
      await paypalGateway.createOrder({
        amount: paypalAmountUsd,
        currency: 'USD',
        paymentId: payment.id
      });

    const approveLink = order.links.find(
      (link) => link.rel === 'approve'
    );

    if (!approveLink) {
      throw new Error(
        'PAYPAL_APPROVE_URL_NOT_FOUND'
      );
    }

    const updatedPayment =
      await paymentModel.updatePaymentStatus(
        payment.id,
        'pending',
        order.id
      );

    return {
      ...updatedPayment,
      transaction_id: payment.transaction_id,
      paypal_amount_usd: paypalAmountUsd,
      payment_url: approveLink.href
    };
  }

  if (payment_method === 'sepay') {
    const sepayData =
      sepayGateway.createPaymentQr({
        amount: payment.amount,
        transactionId: payment.transaction_id,
        subscriptionId: payment.subscription_id,
        userId: payment.user_id
      });

    return {
      ...payment,
      ...sepayData
    };
  }

  return payment;
}

async function handleVnpayReturn(query) {
  const isValid = vnpayGateway.verifyReturn(
    query,
    process.env.VNP_HASH_SECRET
  );

  if (!isValid) {
    throw new Error(
      'INVALID_VNPAY_SIGNATURE'
    );
  }

  const transactionId = query.vnp_TxnRef;
  const responseCode = query.vnp_ResponseCode;

  const payment =
    await paymentModel.findPaymentByTransactionId(
      transactionId
    );

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  if (payment.status !== 'pending') {
    return payment;
  }

  if (responseCode === '00') {
    const updatedPayment =
      await paymentModel.updatePaymentStatus(
        payment.id,
        'paid',
        transactionId
      );

    await activateSubscriptionIfNeeded(
      payment.subscription_id
    );

    await activityLogService.tryLogActivity({
      userId: payment.user_id,
      action: 'PAYMENT_PAID',
      targetType: 'payment',
      targetId: payment.id
    });

    return updatedPayment;
  }

  const failedPayment =
    await paymentModel.updatePaymentStatus(
      payment.id,
      'failed',
      transactionId
    );

  await activityLogService.tryLogActivity({
    userId: payment.user_id,
    action: 'PAYMENT_FAILED',
    targetType: 'payment',
    targetId: payment.id
  });

  return failedPayment;
}

async function handlePaypalSuccess({
  paymentId,
  token
}) {
  if (!paymentId || !token) {
    throw new Error(
      'PAYPAL_PAYMENT_ID_AND_TOKEN_REQUIRED'
    );
  }

  const payment =
    await paymentModel.findPaymentById(
      paymentId
    );

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  if (payment.status === 'paid') {
    return payment;
  }

  const capture =
    await paypalGateway.captureOrder(token);

  if (capture.status !== 'COMPLETED') {
    throw new Error(
      'PAYPAL_CAPTURE_FAILED'
    );
  }

  const updatedPayment =
    await paymentModel.updatePaymentStatus(
      payment.id,
      'paid',
      token
    );

  await activateSubscriptionIfNeeded(
    payment.subscription_id
  );

  await activityLogService.tryLogActivity({
    userId: payment.user_id,
    action: 'PAYMENT_PAID',
    targetType: 'payment',
    targetId: payment.id
  });

  return updatedPayment;
}

async function handlePaypalCancel({
  paymentId,
  token
}) {
  if (!paymentId) {
    throw new Error(
      'PAYPAL_PAYMENT_ID_REQUIRED'
    );
  }

  const payment =
    await paymentModel.findPaymentById(
      paymentId
    );

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  if (payment.status !== 'pending') {
    return payment;
  }

  const cancelledPayment =
    await paymentModel.updatePaymentStatus(
      payment.id,
      'cancelled',
      token || payment.transaction_id
    );

  await activityLogService.tryLogActivity({
    userId: payment.user_id,
    action: 'PAYMENT_CANCELLED',
    targetType: 'payment',
    targetId: payment.id
  });

  return cancelledPayment;
}

async function handleSepayWebhook(payload) {
  try {
    const {
      content,
      transferType,
      transferAmount
    } = payload;

    if (!content) {
      throw new Error(
        'INVALID_SEPAY_WEBHOOK_DATA'
      );
    }

    const normalizedTransferType = String(
      transferType || ''
    )
      .trim()
      .toLowerCase();

    if (
      normalizedTransferType &&
      normalizedTransferType !== 'in'
    ) {
      throw new Error(
        'SEPAY_TRANSFER_TYPE_NOT_SUPPORTED'
      );
    }

    const transactionId =
      extractSepayTransactionId(content);

    if (!transactionId) {
      throw new Error(
        'SEPAY_TRANSACTION_ID_NOT_FOUND'
      );
    }

    const normalizedTransactionId =
      normalizeTransactionId(transactionId);

    let payment =
      await paymentModel.findPaymentByTransactionId(
        transactionId
      );

    if (!payment) {
      payment =
        await paymentModel.findPaymentByNormalizedTransactionId(
          normalizedTransactionId
        );
    }

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.payment_method !== 'sepay') {
      throw new Error(
        'INVALID_PAYMENT_METHOD_FOR_SEPAY_WEBHOOK'
      );
    }

    if (payment.status === 'paid') {
      return payment;
    }

    if (payment.status !== 'pending') {
      throw new Error(
        'PAYMENT_IS_NOT_PENDING'
      );
    }

    if (
      Number(transferAmount) !==
      Number(payment.amount)
    ) {
      throw new Error(
        'SEPAY_AMOUNT_MISMATCH'
      );
    }

    const updatedPayment =
      await paymentModel.updatePaymentStatus(
        payment.id,
        'paid',
        payment.transaction_id
      );

    await activateSubscriptionIfNeeded(
      payment.subscription_id
    );

    await activityLogService.tryLogActivity({
      userId: payment.user_id,
      action: 'PAYMENT_PAID',
      targetType: 'payment',
      targetId: payment.id
    });

    return updatedPayment;
  } catch (error) {
    console.error(
      'SEPAY WEBHOOK ERROR:',
      error.message
    );

    console.error(error.stack);

    throw error;
  }
}

async function getPaymentById(
  paymentId,
  currentUser
) {
  const payment =
    await paymentModel.findPaymentById(
      paymentId
    );

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  const isOwner =
    Number(payment.user_id) ===
    Number(currentUser.id);

  const roles = currentUser.roles || [];

  const isAdmin =
    roles.includes('admin') ||
    roles.includes('super_admin');

  if (!isOwner && !isAdmin) {
    throw new Error('FORBIDDEN');
  }

  return payment;
}

async function getMyPayments(userId) {
  return paymentModel.getPaymentsByUserId(
    userId
  );
}

async function markPaymentAsPaid(
  paymentId,
  currentUser = null
) {
  const payment =
    await paymentModel.findPaymentById(
      paymentId
    );

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  if (payment.status !== 'pending') {
    throw new Error(
      'PAYMENT_IS_NOT_PENDING'
    );
  }

  const updatedPayment =
    await paymentModel.updatePaymentStatus(
      paymentId,
      'paid',
      payment.transaction_id
    );

  await activateSubscriptionIfNeeded(
    payment.subscription_id
  );

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || payment.user_id,
    action: 'PAYMENT_PAID',
    targetType: 'payment',
    targetId: payment.id
  });

  return updatedPayment;
}

async function markPaymentAsFailed(
  paymentId,
  currentUser = null
) {
  const payment =
    await paymentModel.findPaymentById(
      paymentId
    );

  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  if (payment.status !== 'pending') {
    throw new Error(
      'PAYMENT_IS_NOT_PENDING'
    );
  }

  const updatedPayment =
    await paymentModel.updatePaymentStatus(
      paymentId,
      'failed',
      payment.transaction_id
    );

  await activityLogService.tryLogActivity({
    userId: currentUser?.id || payment.user_id,
    action: 'PAYMENT_FAILED',
    targetType: 'payment',
    targetId: payment.id
  });

  return updatedPayment;
}

async function getAllPayments(currentUser) {
  const roles = currentUser.roles || [];

  const isAdmin =
    roles.includes('admin') ||
    roles.includes('super_admin');

  if (!isAdmin) {
    throw new Error('FORBIDDEN');
  }

  return paymentModel.getAllPayments();
}

module.exports = {
  createPayment,
  handleVnpayReturn,
  handlePaypalSuccess,
  handlePaypalCancel,
  handleSepayWebhook,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  markPaymentAsPaid,
  markPaymentAsFailed
};