const express = require('express');
const Setting = require('../models/Setting');
const { getSettings } = require('../utils/settingsCache');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/public/settings', async (_req, res, next) => {
  try {
    const publicKeys = [
      'heroBannerUrl',
      'heroBannerUrls',
      'enableEmailDelivery',
      'enableWhatsappDelivery',
      'customFeatureIconUrl',
      'enableTax',
      'taxPercentage',
      'enableDeliveryCharge',
      'deliveryCharge'
    ];
    const settingsDocs = await Setting.find({ key: { $in: publicKeys } })
      .select({ key: 1, value: 1, _id: 0 })
      .lean();
    const settings = {};
    settingsDocs.forEach(s => {
      settings[s.key] = s.value;
    });
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
