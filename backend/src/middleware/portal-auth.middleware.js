const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const authenticatePortal = (req, res, next) => {
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
    if (!decoded || decoded.type !== 'portal' || !decoded.portalAccountId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid portal access token.',
        errors: []
      });
    }
    req.portalUser = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      errors: []
    });
  }
};

module.exports = authenticatePortal;
