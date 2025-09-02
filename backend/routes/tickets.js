const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { match_id } = req.query;
    const db = getDB();

    let query = `
      SELECT t.*, m.home_team, m.away_team, m.match_date, m.venue, m.status as match_status
      FROM tickets t
      LEFT JOIN matches m ON t.match_id = m.id
      WHERE t.available_quantity > 0
    `;
    
    const params = [];

    if (match_id) {
      query += ' AND t.match_id = $1';
      params.push(match_id);
    }

    query += ' ORDER BY t.price ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query(`
      SELECT t.*, m.home_team, m.away_team, m.match_date, m.venue, m.status as match_status
      FROM tickets t
      LEFT JOIN matches m ON t.match_id = m.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create ticket (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('ticket_type').trim().isLength({ min: 1 }),
  body('price').isDecimal({ decimal_digits: '0,2' }),
  body('total_quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { match_id, ticket_type, price, total_quantity, description } = req.body;
    const db = getDB();

    const result = await db.query(`
      INSERT INTO tickets (match_id, ticket_type, price, total_quantity, available_quantity, description)
      VALUES ($1, $2, $3, $4, $4, $5)
      RETURNING *
    `, [match_id, ticket_type, price, total_quantity, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ticket_type, price, total_quantity, available_quantity, description } = req.body;
    const db = getDB();

    const result = await db.query(`
      UPDATE tickets 
      SET ticket_type = $1, price = $2, total_quantity = $3, available_quantity = $4, 
          description = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [ticket_type, price, total_quantity, available_quantity, description, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// Purchase ticket
router.post('/:id/purchase', authenticateToken, [
  body('quantity').isInt({ min: 1 }),
  body('customer_name').trim().isLength({ min: 1 }),
  body('customer_email').isEmail(),
  body('customer_phone').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, customer_name, customer_email, customer_phone } = req.body;
    const db = getDB();

    await db.query('BEGIN');

    try {
      // Check ticket availability
      const ticketResult = await db.query(
        'SELECT * FROM tickets WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (ticketResult.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketResult.rows[0];

      if (ticket.available_quantity < quantity) {
        throw new Error('Not enough tickets available');
      }

      // Calculate total amount
      const totalAmount = ticket.price * quantity;

      // Create ticket order
      const orderResult = await db.query(`
        INSERT INTO ticket_orders (user_id, ticket_id, quantity, total_amount, customer_name, customer_email, customer_phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [req.user.id, id, quantity, totalAmount, customer_name, customer_email, customer_phone]);

      // Update ticket availability
      await db.query(
        'UPDATE tickets SET available_quantity = available_quantity - $1 WHERE id = $2',
        [quantity, id]
      );

      await db.query('COMMIT');

      res.status(201).json({
        message: 'Ticket order created successfully',
        order: orderResult.rows[0]
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Purchase ticket error:', error);
    if (error.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (error.message === 'Not enough tickets available') {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }
    res.status(500).json({ error: 'Failed to purchase ticket' });
  }
});

// Get user's ticket orders
router.get('/orders/my', authenticateToken, async (req, res) => {
  try {
    const db = getDB();

    const result = await db.query(`
      SELECT to.*, t.ticket_type, m.home_team, m.away_team, m.match_date, m.venue
      FROM ticket_orders to
      LEFT JOIN tickets t ON to.ticket_id = t.id
      LEFT JOIN matches m ON t.match_id = m.id
      WHERE to.user_id = $1
      ORDER BY to.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get user ticket orders error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket orders' });
  }
});

// Get specific ticket order
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const db = getDB();

    const result = await db.query(`
      SELECT to.*, t.ticket_type, m.home_team, m.away_team, m.match_date, m.venue
      FROM ticket_orders to
      LEFT JOIN tickets t ON to.ticket_id = t.id
      LEFT JOIN matches m ON t.match_id = m.id
      WHERE to.id = $1 AND to.user_id = $2
    `, [orderId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get ticket order error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket order' });
  }
});

module.exports = router;