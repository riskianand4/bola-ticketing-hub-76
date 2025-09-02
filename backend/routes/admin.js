const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();

    const [users, news, matches, tickets, merchandise, orders] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
      db.query('SELECT COUNT(*) FROM news WHERE published = true'),
      db.query('SELECT COUNT(*) FROM matches'),
      db.query('SELECT COUNT(*) FROM tickets'),
      db.query('SELECT COUNT(*) FROM merchandise WHERE is_available = true'),
      db.query('SELECT COUNT(*) FROM ticket_orders WHERE payment_status = \'completed\'')
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_news: parseInt(news.rows[0].count),
      total_matches: parseInt(matches.rows[0].count),
      total_tickets: parseInt(tickets.rows[0].count),
      total_merchandise: parseInt(merchandise.rows[0].count),
      total_orders: parseInt(orders.rows[0].count)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;