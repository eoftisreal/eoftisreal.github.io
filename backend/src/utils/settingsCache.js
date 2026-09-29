const Setting = require('../models/Setting');

let cache = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

async function getSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache && (now - lastFetch < CACHE_TTL)) {
    return cache;
  }

  const settingsRecords = await Setting.find({}).lean();
  const settingsObj = {};
  settingsRecords.forEach(s => {
    settingsObj[s.key] = s.value;
  });

  cache = settingsObj;
  lastFetch = now;
  return cache;
}

function invalidateCache() {
  cache = null;
  lastFetch = 0;
}

module.exports = {
  getSettings,
  invalidateCache
};
