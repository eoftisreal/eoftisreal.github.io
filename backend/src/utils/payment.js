const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');

const razorpay = env.razorpayKeyId && env.razorpayKeySecret
  ? new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
  : null;

async function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
  if (!razorpay) {
    return {
      id: `sim_${receipt}`,
      amount,
      currency,
      status: 'created',
      simulated: true,
    };
  }

  return razorpay.orders.create({ amount, currency, receipt, payment_capture: 1 });
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!env.razorpayKeySecret) {
    return true;
  }

  const generated = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generated === signature;
}

module.exports = { createRazorpayOrder, verifyRazorpaySignature };
