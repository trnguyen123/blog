const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.post('/payments', verifyToken, paymentController.createPayment);
router.get('/payments/my', verifyToken, paymentController.getMyPayments);
router.get('/payments', verifyToken, requireRole('admin', 'super_admin'), paymentController.getAllPayments);
router.get('/payments/:id', verifyToken, paymentController.getPaymentById);

router.get('/payments/vnpay/return', paymentController.handleVnpayReturn);

router.get('/payments/paypal/success', paymentController.handlePaypalSuccess);
router.get('/payments/paypal/cancel', paymentController.handlePaypalCancel);

router.post('/payments/sepay/webhook', paymentController.handleSepayWebhook);

router.post(
  '/payments/:id/mock-paid',
  verifyToken,
  requireRole('admin', 'super_admin'),
  paymentController.mockMarkPaymentAsPaid
);

router.post(
  '/payments/:id/mock-failed',
  verifyToken,
  requireRole('admin', 'super_admin'),
  paymentController.mockMarkPaymentAsFailed
);

module.exports = router;