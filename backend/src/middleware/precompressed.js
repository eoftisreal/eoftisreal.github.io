const fs = require('fs');
const path = require('path');

/**
 * Middleware to serve precompressed static files (.br or .gz)
 * if the client supports them and the file exists.
 */
module.exports = function precompressed(basePath) {
  return (req, res, next) => {
    // Only intercept GET/HEAD requests for static assets (e.g. .js, .css, .html)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    // Skip requests to API or obvious missing extensions
    if (req.path.startsWith('/api') || !path.extname(req.path)) {
      return next();
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const filePath = path.join(basePath, req.path);

    // Helper to check and serve precompressed
    const tryServe = (encoding, extension) => {
      if (acceptEncoding.includes(encoding)) {
        const compressedPath = filePath + extension;
        if (fs.existsSync(compressedPath)) {
          // Send appropriate headers
          res.setHeader('Content-Encoding', encoding);
          res.setHeader('Vary', 'Accept-Encoding');

          // Determine original content type
          const ext = path.extname(req.path).toLowerCase();
          if (ext === '.js') {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (ext === '.css') {
            res.setHeader('Content-Type', 'text/css');
          } else if (ext === '.html') {
            res.setHeader('Content-Type', 'text/html');
          }

          // Send the compressed file (let express.static handle caching, or set here if needed)
          req.url = req.url + extension; // modify URL so express.static picks up the compressed file
          return true;
        }
      }
      return false;
    };

    // Try brotli first, then gzip
    if (!tryServe('br', '.br')) {
      tryServe('gzip', '.gz');
    }

    next();
  };
};