/**
 * Middleware: restrictStatusDisplayToLan
 * Ensures that requests to the Status Display API originate from the authorized
 * Barangay LAN IP address (e.g. 192.168.100.102:4201) and blocks direct
 * unauthorized access from localhost:4201 loopback.
 */
const restrictStatusDisplayToLan = (req, res, next) => {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';

  const isLocalhostKiosk = origin.includes('localhost:4201') ||
                           origin.includes('127.0.0.1:4201') ||
                           referer.includes('localhost:4201') ||
                           referer.includes('127.0.0.1:4201');

  if (isLocalhostKiosk) {
    return res.status(403).json({
      success: false,
      message: 'Access Restricted: The Status Display board is only accessible via the authorized Barangay LAN address (http://192.168.100.102:4201/status-display).'
    });
  }

  next();
};

module.exports = { restrictStatusDisplayToLan };
