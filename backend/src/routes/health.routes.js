const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const pkg = require('../../package.json');

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'IMS Backend API is running.',
    version: pkg.version
  });
});

router.get('/health/database', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'Database connected successfully.'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed.',
      error: error.message
    });
  }
});

module.exports = router;
