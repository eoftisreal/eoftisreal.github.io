// backend/src/appwrite-entry.js
//
// Appwrite Function entrypoint that adapts the existing Express app
// (backend/src/app.js) to Appwrite's per-invocation function model.
//
// Appwrite calls this file's default export fresh on every HTTP request:
//   export default async ({ req, res, log, error }) => { ... }
// It does NOT run a persistent server the way `node server.js` does, so
// app.listen() alone never gets wired up to real traffic.
//
// Instead, this file:
//   1. Starts the existing Express app on an internal loopback port once
//      per container (cached at module scope, reused across warm/"hot"
//      invocations - the same container is reused for many requests).
//   2. Opens MongoDB lazily for API requests, reusing warm connections.
//   3. On each invocation, forwards the incoming Appwrite request to the
//      internal server and relays the response back through res.binary().
//
// Nothing in app.js, routes/, or middleware/ needs to change.
//
// Put this file at backend/src/appwrite-entry.js and point appwrite.json's
// "entrypoint" at it (instead of backend/src/server.js).

const http = require('http');
const { isIP } = require('net');
const app = require('./app');
const connectDb = require('./config/db');

let serverPromise = null;
let dbPromise = null;
const proxyAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 256,
});

function getServer() {
  if (!serverPromise) {
    serverPromise = new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.once('error', (err) => { serverPromise = null; reject(err); });
      server.listen(0, '127.0.0.1', () => resolve(server));
    });
  }
  return serverPromise;
}

function getDb() {
  if (!dbPromise) {
    dbPromise = connectDb().catch((err) => {
      dbPromise = null; // allow the next invocation to retry the connection
      throw err;
    });
  }
  return dbPromise;
}

module.exports = async ({ req, res, log, error }) => {
  try {
    const server = await getServer();
    const port = server.address().port;

    // Static files, SPA routes and liveness must work during database outages.
    if ((req.path === '/api' || req.path.startsWith('/api/')) &&
        req.path !== '/api/health' && req.method !== 'OPTIONS') {
      try {
        await getDb();
      } catch (dbErr) {
        error(`MongoDB connection failed: ${dbErr.message}`);
        return res.json({ message: 'Service temporarily unavailable. Please retry.' }, 503, {
          'cache-control': 'no-store', 'retry-after': '5',
        });
      }
    }

    const bodyBuffer =
      req.bodyBinary && req.bodyBinary.length ? req.bodyBinary : undefined;

    const forwardedHeaders = { ...req.headers };
    delete forwardedHeaders['content-length'];
    delete forwardedHeaders['host'];
    // Forward only the platform-provided client IP, never a caller's proxy chain.
    delete forwardedHeaders['x-forwarded-for'];
    delete forwardedHeaders['x-appwrite-key'];
    const clientIp = req.headers['x-appwrite-client-ip'];
    if (typeof clientIp === 'string' && isIP(clientIp)) {
      forwardedHeaders['x-forwarded-for'] = clientIp;
    }

    const proxied = await new Promise((resolve, reject) => {
      // A deadline includes both response headers and body transfer.
      const deadlineMs = Math.max(1000, Math.min(Number(process.env.PROXY_TIMEOUT_MS) || 25000, 120000));
      let deadline;
      const finish = (err, value) => {
        clearTimeout(deadline);
        if (err) reject(err); else resolve(value);
      };
      const proxyReq = http.request(
        {
          agent: proxyAgent,
          hostname: '127.0.0.1',
          port,
          path: req.path + (req.queryString ? `?${req.queryString}` : ''),
          method: req.method,
          headers: forwardedHeaders,
        },
        (proxyRes) => {
          const chunks = [];
          let size = 0;
          const maxBytes = Math.max(1024, Number(process.env.PROXY_MAX_RESPONSE_BYTES) || 10 * 1024 * 1024);
          proxyRes.on('error', (err) => finish(err));
          proxyRes.on('aborted', () => finish(new Error('Upstream response aborted')));
          proxyRes.on('data', (chunk) => {
            size += chunk.length;
            if (size > maxBytes) {
              proxyRes.destroy(new Error('Upstream response exceeds configured size limit'));
              return;
            }
            chunks.push(chunk);
          });
          proxyRes.on('end', () => {
            finish(null, {
              statusCode: proxyRes.statusCode || 200,
              headers: proxyRes.headers,
              body: Buffer.concat(chunks),
            });
          });
        }
      );

      proxyReq.on('error', (err) => finish(err));
      deadline = setTimeout(() => {
        const err = new Error('Upstream request timed out');
        err.statusCode = 504;
        proxyReq.destroy(err);
        finish(err);
      }, deadlineMs);

      if (bodyBuffer) {
        proxyReq.write(bodyBuffer);
      }
      proxyReq.end();
    });

    const responseHeaders = {};
    for (const [key, value] of Object.entries(proxied.headers)) {
      // Strip headers that interfere with Appwrite's response handling
      if (
        key.toLowerCase() === 'transfer-encoding' ||
        key.toLowerCase() === 'connection' ||
        key.toLowerCase() === 'keep-alive'
      ) {
        continue;
      }
      if (value !== undefined) {
        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    }

    return res.binary(proxied.body, proxied.statusCode, responseHeaders);
  } catch (err) {
    error(err.stack || err.message);
    return res.text(err.statusCode === 504 ? 'Gateway Timeout' : 'Internal Server Error', err.statusCode === 504 ? 504 : 500, { 'cache-control': 'no-store' });
  }
};