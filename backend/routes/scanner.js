const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

const router = express.Router();

// Scanner login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDB();

    const result = await db.query(
      'SELECT * FROM scanner_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Scanner login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Scan ticket
router.post('/scan', async (req, res) => {
  try {
    const { ticket_order_id, scanner_user_id } = req.body;
    const db = getDB();

    // Check if ticket order exists and is paid
    const ticketResult = await db.query(`
      SELECT to.*, t.ticket_type, m.home_team, m.away_team, m.match_date
      FROM ticket_orders to
      LEFT JOIN tickets t ON to.ticket_id = t.id
      LEFT JOIN matches m ON t.match_id = m.id
      WHERE to.id = $1
    `, [ticket_order_id]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tiket tidak ditemukan' });
    }

    const ticket = ticketResult.rows[0];

    if (ticket.payment_status !== 'completed') {
      return res.status(400).json({ error: 'Tiket belum dibayar' });
    }

    // Check if already scanned
    const scanResult = await db.query(
      'SELECT * FROM ticket_scans WHERE ticket_order_id = $1',
      [ticket_order_id]
    );

    if (scanResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Tiket sudah pernah di-scan sebelumnya',
        ticket_info: {
          customer_name: ticket.customer_name,
          ticket_type: ticket.ticket_type,
          match_info: `${ticket.home_team} vs ${ticket.away_team}`,
          scanned_at: scanResult.rows[0].scanned_at
        }
      });
    }

    // Record scan
    await db.query(
      'INSERT INTO ticket_scans (ticket_order_id, scanner_user_id) VALUES ($1, $2)',
      [ticket_order_id, scanner_user_id]
    );

    res.json({
      success: true,
      message: 'Tiket berhasil di-scan',
      ticket_info: {
        customer_name: ticket.customer_name,
        ticket_type: ticket.ticket_type,
        match_info: `${ticket.home_team} vs ${ticket.away_team}`,
        match_date: ticket.match_date,
        quantity: ticket.quantity
      }
    });
  } catch (error) {
    console.error('Scan ticket error:', error);
    res.status(500).json({ error: 'Failed to scan ticket' });
  }
});

module.exports = router;