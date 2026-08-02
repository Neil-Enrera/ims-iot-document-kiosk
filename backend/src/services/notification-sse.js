/**
 * Server-Sent Events manager for real-time notifications.
 * Tracks connected admin clients and broadcasts events to them.
 */

class NotificationSSEManager {
  constructor() {
    // Map of userId -> Set of response objects
    this.clients = new Map();
  }

  /**
   * Register a client (admin user) for SSE updates.
   * @param {number} userId
   * @param {import('express').Response} res
   */
  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);

    // Remove client on close
    res.on('close', () => {
      this.clients.get(userId)?.delete(res);
      if (this.clients.get(userId)?.size === 0) {
        this.clients.delete(userId);
      }
    });
  }

  /**
   * Send a notification event to a specific user.
   * @param {number} userId
   * @param {object} notification
   */
  sendToUser(userId, notification) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const data = JSON.stringify(notification);
    for (const res of userClients) {
      res.write(`event: notification\ndata: ${data}\n\n`);
    }
  }

  /**
   * Broadcast an event with a custom event type to all connected clients.
   * @param {string} eventType - SSE event name (e.g. 'request-approved')
   * @param {object} data - payload
   */
  broadcastEvent(eventType, data) {
    const payload = JSON.stringify(data);
    for (const [, clients] of this.clients) {
      for (const res of clients) {
        res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
      }
    }
  }

  /**
   * Send a notification event to all connected admin clients.
   * @param {object} notification
   * @param {number[]} excludeUserIds - User IDs to exclude (e.g., the creator)
   */
  broadcast(notification, excludeUserIds = []) {
    for (const [userId, clients] of this.clients) {
      if (excludeUserIds.includes(userId)) continue;
      const data = JSON.stringify(notification);
      for (const res of clients) {
        res.write(`event: notification\ndata: ${data}\n\n`);
      }
    }
  }

  /**
   * Send an unread count update to a specific user.
   * @param {number} userId
   * @param {number} count
   */
  sendUnreadCount(userId, count) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const data = JSON.stringify({ count });
    for (const res of userClients) {
      res.write(`event: unread-count\ndata: ${data}\n\n`);
    }
  }

  /**
   * Broadcast unread count update to all connected clients.
   */
  broadcastUnreadCount() {
    // This is a simple approach - each client will get their own count
    // when they reconnect or poll. For now, we just notify that counts changed.
    for (const [userId, clients] of this.clients) {
      const data = JSON.stringify({ changed: true });
      for (const res of clients) {
        res.write(`event: unread-count-changed\ndata: ${data}\n\n`);
      }
    }
  }

  /**
   * Get the number of connected clients.
   */
  getClientCount() {
    let count = 0;
    for (const clients of this.clients.values()) {
      count += clients.size;
    }
    return count;
  }
}

// Singleton instance
const sseManager = new NotificationSSEManager();

module.exports = sseManager;
