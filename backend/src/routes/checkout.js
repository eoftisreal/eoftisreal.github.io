const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const Setting = require('../models/Setting');
const User = require('../models/User');
const { getSettings } = require('../utils/settingsCache');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

const router = express.Router();

async function generateUniquePaymentAmount(baseTotal, session) {
  let isUnique = false;
  let uniqueAmount = baseTotal;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    attempts++;
    const fraction = Math.floor(Math.random() * 99) + 1; // 1 to 99
    uniqueAmount = Number((baseTotal + fraction / 100).toFixed(2));

    const existingOrder = await Order.findOne({
      uniquePaymentAmount: uniqueAmount,
      'payment.status': { $in: ['pending', 'awaiting_verification'] }
    }).session(session);

    if (!existingOrder) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error('Could not generate a unique payment amount. Please try again later.');
  }

  return uniqueAmount;
}

const checkoutSchema = z.object({
  body: z.object({
    checkoutAttemptId: z.string().optional(),
    shippingAddress: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      line1: z.string().min(2),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().min(2),
    }),
    deliveryMethod: z.enum(['email', 'whatsapp']).optional(),
    promoCode: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/create', auth, validate(checkoutSchema), async (req, res, next) => {
  try {
    // 1. Initial lookup outside the transaction to catch duplicates created by previous timed-out attempts
    // before we even check the cart state (which would otherwise incorrectly fail if it's empty now).
    if (req.validated.body.checkoutAttemptId) {
      const existingOrder = await Order.findOne({
        checkoutAttemptId: req.validated.body.checkoutAttemptId,
        userId: req.user.id
      });
      if (existingOrder) {
        return res.status(201).json({ order: existingOrder, message: 'Order already created' });
      }
    }

    let finalOrder;
    let attempts = 0;

    // Retry loop for uniquePaymentAmount collisions
    while (!finalOrder && attempts < 10) {
      attempts++;

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // Reset finalOrder at the start of each transaction attempt to prevent state leakage on transient retries
          finalOrder = null;

          // Re-check for concurrent creations
          if (req.validated.body.checkoutAttemptId) {
            const existingOrder = await Order.findOne({
              checkoutAttemptId: req.validated.body.checkoutAttemptId,
              userId: req.user.id
            }).session(session);

            if (existingOrder) {
              finalOrder = existingOrder;
              return;
            }
          }

          // 2. Fetch and validate cart INSIDE the transaction
          const cart = await Cart.findOne({ userId: req.user.id })
            .populate('items.productId')
            .session(session);

          if (!cart || cart.items.length === 0) {
            const err = new Error('Cart is empty');
            err.statusCode = 400;
            throw err;
          }

          const subtotal = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);
          let discount = 0;

          if (req.validated.body.promoCode) {
            const coupon = await Coupon.findOne({
              code: req.validated.body.promoCode.toUpperCase(),
              isActive: true
            }).session(session);

            if (!coupon) {
              const err = new Error('Invalid or expired coupon code');
              err.statusCode = 400;
              throw err;
            }

            if (subtotal < coupon.minOrderValue) {
              const err = new Error(`Minimum order value of ${coupon.minOrderValue} required for this coupon`);
              err.statusCode = 400;
              throw err;
            }

            if (coupon.discountType === 'percentage') {
              discount = subtotal * (coupon.discountValue / 100);
              if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
              }
            } else {
              discount = coupon.discountValue;
            }
          }

          const discountedSubtotal = Math.max(0, subtotal - discount);

          // Get settings (we don't need this in the session directly as it's typically cached/static
          // but fetching it inside ensures totals match current state)
          const settings = await getSettings();
          let tax = 0;
          if (settings.enableTax !== false) {
            const taxPercentage = settings.taxPercentage !== undefined ? Number(settings.taxPercentage) : 18;
            tax = Number((discountedSubtotal * (taxPercentage / 100)).toFixed(2));
          }

          let deliveryCharge = 0;
          if (settings.enableDeliveryCharge !== false) {
            deliveryCharge = settings.deliveryCharge !== undefined ? Number(settings.deliveryCharge) : 0;
          }

          const total = Number((discountedSubtotal + tax + deliveryCharge).toFixed(2));

          const items = cart.items.map((item) => ({
            productId: item.productId.id,
            title: item.productId.title,
            quantity: item.quantity,
            unitPrice: item.productId.price,
            image: item.productId.images?.[0] || '',
            customImage: item.customImage,
            size: item.productId.enableSizes ? item.size : undefined,
            color: item.productId.enableColors ? item.color : undefined
          }));

          const uniquePaymentAmount = await generateUniquePaymentAmount(total, session);

          const orderDocs = await Order.create([{
            checkoutAttemptId: req.validated.body.checkoutAttemptId,
            discount,
            userId: req.user.id,
            items,
            subtotal,
            tax,
            deliveryCharge,
            total,
            uniquePaymentAmount,
            shippingAddress: req.validated.body.shippingAddress,
            deliveryMethod: req.validated.body.deliveryMethod || 'email',
            promoCode: req.validated.body.promoCode || undefined,
            status: 'pending_payment',
            payment: {
              provider: 'manual_upi',
              status: 'pending',
            },
            timeline: [{ status: 'pending_payment', note: 'Order created and awaiting UPI payment' }],
          }], { session });

          const newOrder = orderDocs[0];

          await OrderStatusHistory.create([{
            orderId: newOrder._id,
            newStatus: 'pending_payment',
            changedBy: req.user.id,
            note: 'Order created'
          }], { session });

          await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [] } }, { session });

          finalOrder = newOrder;
        });
      } catch (err) {
        // If a duplicate key error occurs, it's either checkoutAttemptId or uniquePaymentAmount.
        // The transaction is automatically aborted by Mongo.
        if (err.code === 11000) {
          if (err.keyPattern && err.keyPattern.uniquePaymentAmount) {
             // Continue loop to try a new amount
             finalOrder = null;
             continue;
          }
          if (err.keyPattern && err.keyPattern.checkoutAttemptId && req.validated.body.checkoutAttemptId) {
            // It was a duplicate checkoutAttemptId, let's just grab it outside of this aborted session
            finalOrder = await Order.findOne({ checkoutAttemptId: req.validated.body.checkoutAttemptId, userId: req.user.id });
            if (finalOrder) {
              break;
            }
          }
        }
        // If it's a different error, we throw it up
        throw err;
      } finally {
        await session.endSession();
      }
    }

    if (!finalOrder) {
      throw new Error('Could not generate a unique payment amount after multiple attempts. Please try again.');
    }

    res.status(201).json({ order: finalOrder, message: 'Order created' });

  } catch (error) {
    next(error);
  }
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string()
  })
});

router.post('/validate-coupon', auth, validate(validateCouponSchema), async (req, res, next) => {
  try {
    const { code } = req.validated.body;

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    const subtotal = cart ? cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0) : 0;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(400).json({ error: { code: 'API_ERROR', message: 'Invalid or expired coupon code' } });
    }

    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({ error: { code: 'API_ERROR', message: `Minimum order value of ${coupon.minOrderValue} required` } });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = subtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({
      code: coupon.code,
      discountAmount: Number(discountAmount.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
