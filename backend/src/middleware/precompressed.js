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

    const filePath = path.join(basePath, req.path);

    // Build list of representations actually present on disk
    const availableEncodings = ['identity']; // the uncompressed file
    if (fs.existsSync(filePath + '.br')) availableEncodings.push('br');
    if (fs.existsSync(filePath + '.gz')) availableEncodings.push('gzip');

    res.vary('Accept-Encoding');

    const bestEncoding = req.acceptsEncodings(availableEncodings);

    if (!bestEncoding) {
      // 406 Not Acceptable if no representation matches the client's strict q=0 constraints
      return res.status(406).send('Not Acceptable');
    }

    // Determine original content type
    const ext = path.extname(req.path).toLowerCase();
    const setContentType = () => {
      if (ext === '.js') res.setHeader('Content-Type', 'application/javascript');
      else if (ext === '.css') res.setHeader('Content-Type', 'text/css');
      else if (ext === '.html') res.setHeader('Content-Type', 'text/html');
    };

    if (bestEncoding === 'br') {
      res.setHeader('Content-Encoding', 'br');
      setContentType();
      // Insert .br before query string (e.g., /app.js?v=1 -> /app.js.br?v=1)
      const qIndex = req.url.indexOf('?');
      if (qIndex !== -1) {
        req.url = req.url.slice(0, qIndex) + '.br' + req.url.slice(qIndex);
      } else {
        req.url += '.br';
      }
    } else if (bestEncoding === 'gzip') {
      res.setHeader('Content-Encoding', 'gzip');
      setContentType();
      const qIndex = req.url.indexOf('?');
      if (qIndex !== -1) {
        req.url = req.url.slice(0, qIndex) + '.gz' + req.url.slice(qIndex);
      } else {
        req.url += '.gz';
      }
    }
    // For 'identity', we leave req.url untouched, passing it directly to express.static

    next();
  };
};