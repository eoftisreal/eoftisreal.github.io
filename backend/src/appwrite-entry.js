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
//   2. Opens the MongoDB connection once, the same way.
//   3. On each invocation, forwards the incoming Appwrite request to the
//      internal server and relays the response back through res.binary().
//
// Nothing in app.js, routes/, or middleware/ needs to change.
//
// Put this file at backend/src/appwrite-entry.js and point appwrite.json's
// "entrypoint" at it (instead of backend/src/server.js).

const http = require('http');
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
      server.once('error', reject);
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

    // Start DB connection, but don't await it so static files can be served immediately.
    getDb().catch((dbErr) => {
      error(`MongoDB connection failed: ${dbErr.message}`);
    });

    const bodyBuffer =
      req.bodyBinary && req.bodyBinary.length ? req.bodyBinary : undefined;

    const forwardedHeaders = { ...req.headers };
    delete forwardedHeaders['content-length'];
    delete forwardedHeaders['host'];

    const proxied = await new Promise((resolve, reject) => {
      // Use internal timeout shorter than Function timeout
      const requestTimeout = setTimeout(() => {
        reject(new Error('Internal Proxy Timeout'));
      }, 12000);

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
          proxyRes.on('data', (chunk) => chunks.push(chunk));
          proxyRes.on('end', () => {
            clearTimeout(requestTimeout);
            resolve({
              statusCode: proxyRes.statusCode || 200,
              headers: proxyRes.headers,
              body: Buffer.concat(chunks),
            });
          });
          proxyRes.on('error', (err) => {
            clearTimeout(requestTimeout);
            reject(err);
          });
        }
      );

      proxyReq.on('error', (err) => {
        clearTimeout(requestTimeout);
        reject(err);
      });

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
    return res.text('Internal Server Error', 500);
  }
};