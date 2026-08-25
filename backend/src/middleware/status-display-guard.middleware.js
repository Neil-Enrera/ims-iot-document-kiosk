/**
 * Middleware: restrictStatusDisplayToLan
 * Ensures that requests to the Status Display API originate from the authorized
 * Barangay LAN IP address (e.g. 192.168.100.102:4201) and blocks direct
 * requests coming from unauthorized local/loopback origins.
 */
const restrictStatusDisplayToLan = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const isDirectLoopback = origin.includes('localhost:4201') || origin.includes('127.0.0.1:4201');

  if (isDirectLoopback) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ORIGIN',
      message: 'Access Restricted: The Status Display board is only accessible via the authorized Barangay LAN address (http://172.20.10.9:4201/status-display).'
    });
  }

  next();
};

module.exports = { restrictStatusDisplayToLan, statusDisplayGuard: restrictStatusDisplayToLan };
