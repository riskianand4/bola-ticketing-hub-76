const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get website analytics
router.get('/visitors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = getDB();

    let query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_visits,
        COUNT(DISTINCT session_id) as unique_visitors
      FROM website_visitors
      WHERE 1=1
    `;

    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND created_at >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND created_at <= $${params.length}`;
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;