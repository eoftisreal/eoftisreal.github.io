function notFound(_req, _res, next) {
  const error = new Error('Resource not found');
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { fieldErrors: { body: errors } }
      }
    });
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
      }
    });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const message = statusCode === 500 && isProduction ? 'Internal server error' : (err.message || 'Internal server error');

  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    error: {
      code: statusCode === 500 ? 'INTERNAL_ERROR' : (err.code || 'API_ERROR'),
      message,
      details: err.details || undefined,
    }
  });
}

module.exports = { notFound, errorHandler };
