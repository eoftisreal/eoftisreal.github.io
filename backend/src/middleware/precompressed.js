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
    const availableEncodings = ['identity'];

    if (fs.existsSync(filePath + '.br')) availableEncodings.push('br');
    if (fs.existsSync(filePath + '.gz')) availableEncodings.push('gzip');

    const acceptedEncoding = req.acceptsEncodings(...availableEncodings);

    // Always preserve Vary: Accept-Encoding
    res.vary('Accept-Encoding');

    if (!acceptedEncoding) {
      return res.status(406).send('Not Acceptable');
    }

    if (acceptedEncoding === 'identity') {
      return next();
    }

    const extension = acceptedEncoding === 'br' ? '.br' : '.gz';

    res.setHeader('Content-Encoding', acceptedEncoding);

    const ext = path.extname(req.path).toLowerCase();
    if (ext === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css');
    } else if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html');
    }

    // Preserve query strings by modifying path rather than just appending to url
    req.url = req.path + extension + (req.url.substring(req.path.length) || '');

    next();
  };
};