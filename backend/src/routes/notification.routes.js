const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const controller = require('../controllers/notification.controller');
const sseManager = require('../services/notification-sse');

// SSE endpoint for real-time notifications (must be before other /notifications routes)
router.get('/notifications/stream', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial connected message
  res.write(`event: connected\ndata: ${JSON.stringify({ userId: req.user.userId })}\n\n`);

  // Register this client
  sseManager.addClient(req.user.userId, res);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

router.get('/notifications/unread-count', auth, controller.getUnreadCount);
router.patch('/notifications/read-all', auth, controller.markAllAsRead);
router.get('/notifications', auth, controller.getAll);
router.post('/notifications', auth, authorize('Administrator'), controller.create);
router.get('/notifications/:id', auth, controller.getById);
router.patch('/notifications/:id/read', auth, controller.markAsRead);
router.delete('/notifications/:id', auth, controller.remove);

module.exports = router;
