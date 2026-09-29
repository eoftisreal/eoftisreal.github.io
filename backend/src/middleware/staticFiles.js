const express = require('express');
const fs = require('fs/promises');
const path = require('path');

function setAssetHeaders(res, filename) {
  const hashed = /-[a-zA-Z0-9_-]{8,}\.(?:js|css|woff2?|png|jpe?g|webp|svg|avif)(?:\.(?:br|gz))?$/.test(filename);
  const revalidate = /(?:\.html|(?:^|\/)sw\.js|manifest\.webmanifest)(?:\.(?:br|gz))?$/.test(filename);
  res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' :
    revalidate ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600');
}

module.exports = function staticFiles(root) {
  const absoluteRoot = path.resolve(root);
  const router = express.Router();
  router.use(async (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    try {
      const pathname = decodeURIComponent(req.path);
      const file = path.resolve(absoluteRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(absoluteRoot + path.sep) || pathname.split('/').some(part => part.startsWith('.'))) return next();
      if (!/\.(js|css|html|svg|json|webmanifest)$/.test(file)) return next();
      const available = [];
      for (const [encoding, extension] of [['br', '.br'], ['gzip', '.gz']]) {
        try {
          if ((await fs.stat(file + extension)).isFile()) available.push(encoding);
        } catch (err) { if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') throw err; }
      }
      res.vary('Accept-Encoding');
      const encoding = req.acceptsEncodings(...available, 'identity');
      if (!encoding) return res.sendStatus(406);
      if (encoding === 'identity') return next();
      const compressed = file + (encoding === 'br' ? '.br' : '.gz');
      res.type(path.extname(file));
      res.set('Content-Encoding', encoding);
      setAssetHeaders(res, file);
      res.sendFile(compressed, { cacheControl: false }, (err) => {
        if (err) {
          res.removeHeader('Content-Encoding');
          next(err);
        }
      });
    } catch (err) {
      if (err instanceof URIError) return res.sendStatus(400);
      next(err);
    }
  });
  router.use(express.static(absoluteRoot, { etag: true, setHeaders: setAssetHeaders }));
  return router;
};
