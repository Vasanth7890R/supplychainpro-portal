const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY id DESC LIMIT 20');
    const [unread] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE read_status = 0');

    res.json({
      success: true,
      notifications: rows,
      unreadCount: unread[0]?.count || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read_status = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read_status = 1');
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications read.' });
  }
});

module.exports = router;
