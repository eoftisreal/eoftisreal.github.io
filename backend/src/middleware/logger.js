const morgan = require('morgan');

const customLogFormat = (tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTimeMs: tokens['response-time'](req, res),
    ip: req.ip,
    userAgent: tokens['user-agent'](req, res),
    userId: req.user ? req.user.id : undefined, // Log user if authenticated
  });
};

const loggerMiddleware = morgan(customLogFormat);

module.exports = loggerMiddleware;
