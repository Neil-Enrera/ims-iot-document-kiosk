const errorHandler = (err, _req, res, _next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  const errors = process.env.NODE_ENV === 'development' ? [err.stack] : [];

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = errorHandler;
