require('dotenv').config();

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
  log: {
    level: process.env.LOG_LEVEL || 'debug'
  }
};
