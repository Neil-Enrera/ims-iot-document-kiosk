const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const authenticate = (req, res, next) => {
  // Support both Authorization header and query string token (for SSE)
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required.',
      errors: []
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      errors: []
    });
  }
};

module.exports = authenticate;
