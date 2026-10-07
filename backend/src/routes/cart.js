const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

router.use(auth);

async function getCart(userId) {
  return Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId, items: [] } }, { upsert: true, new: true });
}

function assertProductAvailability(product, quantity) {
  if (!product || !product.isActive) {
    const err = new Error('Product unavailable');
    err.statusCode = 400;
    throw err;
  }

  if (product.stock <= 0) {
    const err = new Error('Product is out of stock');
    err.statusCode = 400;
    throw err;
  }

  if (quantity > product.stock) {
    const err = new Error(`Only ${product.stock} unit(s) available`);
    err.statusCode = 400;
    throw err;
  }
}

router.get('/', async (req, res, next) => {
  try {
    const cart = await getCart(req.user.id);
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

const itemSchema = z.object({
  body: z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    customImage: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional()
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/items', validate(itemSchema), async (req, res, next) => {
  try {
    const { productId, quantity, customImage, size, color } = req.validated.body;
    const product = await Product.findById(productId);
    assertProductAvailability(product, 1); // Basic check if product exists and stock > 0

    const cart = await getCart(req.user.id);

    // Calculate new total quantity for this product in the cart
    let newTotalQuantity = quantity;
    for (const item of cart.items) {
      if (item.productId.toString() === productId) {
        // Exclude the specific variant we are updating, as its quantity is being replaced
        if (!(item.size === size && item.color === color)) {
          newTotalQuantity += item.quantity;
        }
      }
    }

    assertProductAvailability(product, newTotalQuantity);

    const existing = cart.items.find((item) =>
      item.productId.toString() === productId &&
      item.size === size &&
      item.color === color
    );
    if (existing) {
      existing.quantity = quantity;
      if (customImage) existing.customImage = customImage;
    } else {
      cart.items.push({ productId, quantity, customImage, size, color });
    }

    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

const syncSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
      customImage: z.string().optional(),
      size: z.string().optional(),
      color: z.string().optional()
    }))
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/sync', validate(syncSchema), async (req, res, next) => {
  try {
    const { items } = req.validated.body;
    const cart = await getCart(req.user.id);

    for (const item of items) {
      const product = await Product.findById(item.productId);
      assertProductAvailability(product, 1);

      const existing = cart.items.find((i) =>
        i.productId.toString() === item.productId &&
        i.size === item.size &&
        i.color === item.color
      );

      const newVariantQuantity = existing ? existing.quantity + item.quantity : item.quantity;

      // Calculate new total quantity for this product in the cart
      let newTotalQuantity = newVariantQuantity;
      for (const cartItem of cart.items) {
        if (cartItem.productId.toString() === item.productId) {
          // Exclude the specific variant we are updating
          if (!(cartItem.size === item.size && cartItem.color === item.color)) {
            newTotalQuantity += cartItem.quantity;
          }
        }
      }

      assertProductAvailability(product, newTotalQuantity);

      if (existing) {
        existing.quantity = newVariantQuantity;
        if (item.customImage) existing.customImage = item.customImage;
      } else {
        cart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          customImage: item.customImage,
          size: item.size,
          color: item.color
        });
      }
    }

    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

const deleteItemSchema = z.object({
  body: z.object({
    size: z.string().optional(),
    color: z.string().optional()
  }),
  query: z.object({}),
  params: z.object({
    productId: z.string()
  }),
});

router.delete('/items/:productId', validate(deleteItemSchema), async (req, res, next) => {
  try {
    const { size, color } = req.validated.body;
    const cart = await getCart(req.user.id);
    cart.items = cart.items.filter((item) => {
      const isSameProduct = item.productId.toString() === req.validated.params.productId;
      const isSameSize = item.size === size;
      const isSameColor = item.color === color;
      // Filter out the exact match
      return !(isSameProduct && isSameSize && isSameColor);
    });
    await cart.save();
    await cart.populate('items.productId');
    res.json(cart);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
