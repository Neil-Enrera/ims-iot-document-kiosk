const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const apiRoutes = require('./routes/api');
const notFoundHandler = require('./middleware/not-found.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors({ 
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:4200',
    process.env.KIOSK_URL || 'http://localhost:4201'
  ]
}));

// Serve uploaded files (photos, signatures, documents) with cross-origin headers
// so the admin panel (port 4200) can display images from the backend (port 3000).
// This must be registered AFTER CORS so the Access-Control-Allow-Origin header is
// already set, and with an explicit Cross-Origin-Resource-Policy override because
// Helmet's default is 'same-origin' which blocks cross-site image loads.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug: log kiosk request bodies
app.use('/api/v1/kiosk/requests', (req, res, next) => {
  const rawBody = req.body ? JSON.stringify(req.body) : '(no body)';
  console.log(`[Kiosk POST] content-type=${req.headers['content-type']} body=${rawBody.slice(0, 500)}`);
  next();
});

app.use(logger.morganDev);

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
