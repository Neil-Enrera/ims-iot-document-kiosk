const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

module.exports = {
  app: {
    name: process.env.APP_NAME || 'IMS Document Request Services',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ims_iot_document_kiosk'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'replace_with_secure_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Barangay San Manuel IMS <no-reply@sanmanuel.gov.ph>'
  },
  log: {
    level: process.env.LOG_LEVEL || 'debug'
  }
};
