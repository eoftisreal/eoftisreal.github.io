const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Get user's wishlist
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
      await wishlist.save();
    }
    res.json(wishlist.products);
  } catch (error) {
    next(error);
  }
});

// Add to wishlist
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [productId] });
    } else {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();
    await wishlist.populate('products');
    res.json(wishlist.products);
  } catch (error) {
    next(error);
  }
});

// Remove from wishlist
router.post('/remove', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
      await wishlist.populate('products');
      res.json(wishlist.products);
    } else {
      res.json([]);
    }
  } catch (error) {
    next(error);
  }
});

// Sync local wishlist with server
router.post('/sync', requireAuth, async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: 'productIds must be an array' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const validProducts = await Product.find({ _id: { $in: productIds } });
    const validProductIds = validProducts.map(p => p._id.toString());

    let updated = false;
    for (const pid of validProductIds) {
      if (!wishlist.products.some(existingId => existingId.toString() === pid)) {
        wishlist.products.push(pid);
        updated = true;
      }
    }

    if (updated || wishlist.isNew) {
      await wishlist.save();
    }

    await wishlist.populate('products');
    res.json(wishlist.products);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
