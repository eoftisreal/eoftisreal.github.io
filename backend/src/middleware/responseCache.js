// Best-effort per-instance cache for anonymous catalogue reads only.
// Other instances may serve data for up to TTL after a catalogue update.
const cache = new Map();
const TTL = 30 * 1000;
const MAX_ENTRIES = 200;
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ENTRY_BYTES = 256 * 1024;
let bytes = 0;
let generation = 0;
const publicPath = /^\/products(?:\/(?:categories|brands|tags|product-types|[a-f0-9]{24}))?\/?$/i;
const changesCatalogue = /^\/(?:products|master|master-data|admin)(?:\/|$)/;

function remove(key) {
  const entry = cache.get(key);
  if (entry) bytes -= entry.size;
  cache.delete(key);
}

module.exports = function responseCacheMiddleware(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && changesCatalogue.test(req.path)) {
    res.once('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        generation += 1;
        cache.clear();
        bytes = 0;
      }
    });
  }
  if (req.method !== 'GET' || req.headers.authorization || req.headers.cookie || !publicPath.test(req.path)) {
    return next();
  }

  const now = Date.now();
  for (const [key, entry] of cache) if (entry.expires <= now) remove(key);
  const key = req.originalUrl;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit); // least recently used entries are evicted first
    res.set(hit.headers);
    // Retain the age of the original response for browser cache freshness.
    res.set('Age', String(Math.floor((now - hit.created) / 1000)));
    res.set('X-Cache', 'HIT');
    return res.status(200).type('json').send(hit.body);
  }

  const startedGeneration = generation;
  const originalJson = res.json;
  res.json = function (body) {
    const policy = String(res.getHeader('Cache-Control') || '');
    if (res.statusCode === 200 && /\bpublic\b/.test(policy) && !/no-store|private/.test(policy) &&
        !res.getHeader('Set-Cookie') && startedGeneration === generation) {
      const serialized = JSON.stringify(body);
      const size = Buffer.byteLength(serialized);
      if (size <= MAX_ENTRY_BYTES) {
        remove(key);
        while (cache.size && (cache.size >= MAX_ENTRIES || bytes + size > MAX_BYTES)) {
          remove(cache.keys().next().value);
        }
        const headers = {};
        for (const name of ['Cache-Control', 'Vary', 'Last-Modified']) {
          const value = res.getHeader(name);
          if (value !== undefined) headers[name] = value;
        }
        const created = Date.now();
        cache.set(key, { body: serialized, headers, size, created, expires: created + TTL });
        bytes += size;
      }
    }
    res.set('X-Cache', 'MISS');
    return originalJson.call(this, body);
  };
  next();
};
