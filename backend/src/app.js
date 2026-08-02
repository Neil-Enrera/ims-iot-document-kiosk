const express = require('express');
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
