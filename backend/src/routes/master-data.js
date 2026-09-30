const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');

/**
 * GET /api/master-data
 * Returns categories, brands, tags in ONE call
 * Reduces 3 API calls to 1
 */
router.get('/', async (req, res) => {
  try {
    const [categories, brands, tags] = await Promise.all([
      Category.find({ isActive: true }).select('_id name').lean(),
      Brand.find({ isActive: true }).select('_id name').lean(),
      Product.distinct('tags', { isActive: true }),
    ]);

    res.json({
      categories: categories || [],
      brands: brands || [],
      tags: tags || [],
    });
  } catch (err) {
    console.error('Error fetching master data:', err);
    res.status(500).json({ error: { code: 'API_ERROR', message: 'Failed to fetch master data' } });
  }
});

module.exports = router;
