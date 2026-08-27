// services/gateways/paypal.gateway.js
const axios = require('axios');

function getPaypalBaseUrl() {
  return process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
}

async function generateAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    `${getPaypalBaseUrl()}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data.access_token;
}

async function createOrder({ amount, currency = 'USD', paymentId }) {
  const accessToken = await generateAccessToken();

  const returnUrl = `${process.env.APP_URL}/api/payments/paypal/success?paymentId=${paymentId}`;
  const cancelUrl = `${process.env.APP_URL}/api/payments/paypal/cancel?paymentId=${paymentId}`;

  const response = await axios.post(
    `${getPaypalBaseUrl()}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(paymentId),
          amount: {
            currency_code: currency,
            value: Number(amount).toFixed(2)
          }
        }
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW'
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

async function captureOrder(orderId) {
  const accessToken = await generateAccessToken();

  const response = await axios.post(
    `${getPaypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

async function getOrder(orderId) {
  const accessToken = await generateAccessToken();

  const response = await axios.get(
    `${getPaypalBaseUrl()}/v2/checkout/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return response.data;
}

module.exports = {
  generateAccessToken,
  createOrder,
  captureOrder,
  getOrder
};