const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
    errors: []
  });
};

module.exports = notFoundHandler;
