/**
 * Sitemap Routes for Kapda Kraft
 * Add this route to your backend server (backend/src/routes/)
 *
 * Usage:
 * - POST /api/sitemap/generate - Generate dynamic sitemaps
 * - GET /api/sitemap/products - Get product sitemap
 * - GET /api/sitemap/index - Get sitemap index
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * Helper function to escape XML special characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * Helper to format date for sitemap (YYYY-MM-DD)
 */
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * GET /api/sitemap/index
 * Returns the sitemap index pointing to all sub-sitemaps
 */
router.get('/sitemap/index', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://kapdakraft.live';

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/api/sitemap/products</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/api/sitemap/categories</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // 24 hour cache
    res.send(sitemapIndex);
  } catch (error) {
    console.error('Sitemap index error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap index' });
  }
});

/**
 * GET /api/sitemap/products
 * Returns sitemap for all products
 * Pagination: ?page=1&limit=50000 (Google limit is 50,000 URLs per sitemap)
 */
router.get('/sitemap/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50000; // Google sitemap limit
    const skip = (page - 1) * limit;

    const products = await Product.find({ status: true })
      .select('_id slug name updatedAt images')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const baseUrl = process.env.FRONTEND_URL || 'https://kapdakraft.live';

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const product of products) {
      const productUrl = `${baseUrl}/products/${product._id}`;
      const lastmod = formatDate(product.updatedAt);

      sitemap += '  <url>\n';
      sitemap += `    <loc>${escapeXml(productUrl)}</loc>\n`;
      sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.8</priority>\n';

      // Add primary product image
      if (product.images && product.images.length > 0) {
        sitemap += '    <image:image>\n';
        sitemap += `      <image:loc>${escapeXml(product.images[0])}</image:loc>\n`;
        sitemap += `      <image:title>${escapeXml(product.name)}</image:title>\n`;
        sitemap += '    </image:image>\n';
      }

      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>';

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=86400'); // 24 hour cache
    res.send(sitemap);
  } catch (error) {
    console.error('Product sitemap error:', error);
    res.status(500).json({ error: 'Failed to generate product sitemap' });
  }
});

/**
 * GET /api/sitemap/categories
 * Returns sitemap for all categories
 */
router.get('/sitemap/categories', async (req, res) => {
  try {
    const categories = await Category.find({ status: true })
      .select('_id name slug updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const baseUrl = process.env.FRONTEND_URL || 'https://kapdakraft.live';

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add category filter URLs
    for (const category of categories) {
      const categoryUrl = `${baseUrl}/products?category=${category._id}`;
      const lastmod = formatDate(category.updatedAt);

      sitemap += '  <url>\n';
      sitemap += `    <loc>${escapeXml(categoryUrl)}</loc>\n`;
      sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.6</priority>\n';
      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>';

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=86400'); // 24 hour cache
    res.send(sitemap);
  } catch (error) {
    console.error('Category sitemap error:', error);
    res.status(500).json({ error: 'Failed to generate category sitemap' });
  }
});

/**
 * POST /api/sitemap/generate
 * Trigger sitemap generation (for admin/cron jobs)
 * Returns count of products indexed
 */
router.post('/sitemap/generate', async (req, res) => {
  try {
    // Optional: Add auth check for admin only
    // if (!req.user || !req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

    const productCount = await Product.countDocuments({ status: true });
    const categoryCount = await Category.countDocuments({ status: true });

    res.json({
      success: true,
      message: 'Sitemaps generated successfully',
      data: {
        productsIndexed: productCount,
        categoriesIndexed: categoryCount,
        sitemapUrls: [
          '/sitemap.xml',
          '/api/sitemap/index',
          '/api/sitemap/products',
          '/api/sitemap/categories',
        ],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemaps' });
  }
});

module.exports = router;
