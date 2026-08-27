const paymentService = require('../services/payment.service');

async function createPayment(req, res, next) {
  try {
    const {
      subscription_id,
      payment_method
    } = req.body;

    const payment =
      await paymentService.createPayment({
        userId: req.user.id,
        subscription_id,
        payment_method,
        ipAddr:
          req.ip ||
          req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress
      });

    return res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function handleVnpayReturn(
  req,
  res,
  next
) {
  try {
    const payment =
      await paymentService.handleVnpayReturn(
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        'VNPay payment processed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function handlePaypalSuccess(
  req,
  res,
  next
) {
  try {
    const payment =
      await paymentService.handlePaypalSuccess({
        paymentId: req.query.paymentId,
        token: req.query.token
      });

    return res.status(200).json({
      success: true,
      message:
        'PayPal payment processed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function handlePaypalCancel(
  req,
  res,
  next
) {
  try {
    const payment =
      await paymentService.handlePaypalCancel({
        paymentId: req.query.paymentId,
        token: req.query.token
      });

    return res.status(200).json({
      success: false,
      message: 'PayPal payment cancelled',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function handleSepayWebhook(
  req,
  res,
  next
) {
  try {
    const payment =
      await paymentService.handleSepayWebhook(
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        'SePay webhook processed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function getPaymentById(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const payment =
      await paymentService.getPaymentById(
        id,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: 'Payment fetched successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPayments(
  req,
  res,
  next
) {
  try {
    const payments =
      await paymentService.getMyPayments(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: 'My payments fetched successfully',
      data: payments
    });
  } catch (error) {
    next(error);
  }
}

async function mockMarkPaymentAsPaid(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const payment =
      await paymentService.markPaymentAsPaid(
        id,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        'Payment marked as paid successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function mockMarkPaymentAsFailed(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const payment =
      await paymentService.markPaymentAsFailed(
        id,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        'Payment marked as failed successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
}

async function getAllPayments(
  req,
  res,
  next
) {
  try {
    const payments =
      await paymentService.getAllPayments(
        req.user
      );

    return res.status(200).json({
      success: true,
      message: 'All payments fetched successfully',
      data: payments
    });
  } catch (error) {
    next(error);
  }
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
  mockMarkPaymentAsPaid,
  mockMarkPaymentAsFailed
};