const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
      SELECT m.*,
             (SELECT COUNT(*) FROM match_events WHERE match_id = m.id) as event_count
      FROM matches m
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND m.status = $${paramCount}`;
      params.push(status);
    }

    if (upcoming === 'true') {
      query += ` AND m.match_date > NOW()`;
    }

    query += ` ORDER BY m.match_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM matches WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = $1';
      countParams.push(status);
    }

    if (upcoming === 'true') {
      countQuery += ' AND match_date > NOW()';
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get single match
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const matchResult = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
    
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Get match events
    const eventsResult = await db.query(
      'SELECT * FROM match_events WHERE match_id = $1 ORDER BY event_time ASC',
      [id]
    );

    // Get available tickets
    const ticketsResult = await db.query(
      'SELECT * FROM tickets WHERE match_id = $1 AND available_quantity > 0',
      [id]
    );

    res.json({
      ...match,
      events: eventsResult.rows,
      tickets: ticketsResult.rows
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Create match (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('home_team').trim().isLength({ min: 1 }),
  body('away_team').trim().isLength({ min: 1 }),
  body('match_date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      home_team, away_team, home_team_logo, away_team_logo,
      match_date, venue, competition
    } = req.body;
    const db = getDB();

    const result = await db.query(`
      INSERT INTO matches (home_team, away_team, home_team_logo, away_team_logo, match_date, venue, competition)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [home_team, away_team, home_team_logo, away_team_logo, match_date, venue, competition]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Update match (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      home_team, away_team, home_team_logo, away_team_logo,
      match_date, venue, competition, status, home_score, away_score
    } = req.body;
    const db = getDB();

    const result = await db.query(`
      UPDATE matches 
      SET home_team = $1, away_team = $2, home_team_logo = $3, away_team_logo = $4,
          match_date = $5, venue = $6, competition = $7, status = $8,
          home_score = $9, away_score = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [home_team, away_team, home_team_logo, away_team_logo, match_date, venue, competition, status, home_score, away_score, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Delete match (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query('DELETE FROM matches WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Get match events
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query(
      'SELECT * FROM match_events WHERE match_id = $1 ORDER BY event_time ASC',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get match events error:', error);
    res.status(500).json({ error: 'Failed to fetch match events' });
  }
});

// Add match event (admin only)
router.post('/:id/events', authenticateToken, requireAdmin, [
  body('event_time').isInt({ min: 0 }),
  body('event_type').isIn(['goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time']),
  body('description').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { event_time, event_type, team, player_name, description } = req.body;
    const db = getDB();

    const result = await db.query(`
      INSERT INTO match_events (match_id, event_time, event_type, team, player_name, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, event_time, event_type, team, player_name, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add match event error:', error);
    res.status(500).json({ error: 'Failed to add match event' });
  }
});

// Update match timer (admin only)
router.post('/:id/timer', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, extra_minutes = 0 } = req.body;
    const db = getDB();

    // Get current match
    const matchResult = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    let updateQuery = '';
    let updateParams = [id];

    switch (action) {
      case 'start':
        updateQuery = `
          UPDATE matches 
          SET status = 'live', is_timer_active = true, match_started_at = NOW(), 
              current_minute = 0, extra_time = 0, half_time_break = false, updated_at = NOW()
          WHERE id = $1
        `;
        break;

      case 'pause':
        updateQuery = `
          UPDATE matches 
          SET is_timer_active = false, updated_at = NOW()
          WHERE id = $1
        `;
        break;

      case 'resume':
        updateQuery = `
          UPDATE matches 
          SET is_timer_active = true, updated_at = NOW()
          WHERE id = $1
        `;
        break;

      case 'add_extra_time':
        updateQuery = `
          UPDATE matches 
          SET extra_time = extra_time + $2, updated_at = NOW()
          WHERE id = $1
        `;
        updateParams.push(extra_minutes);
        break;

      case 'half_time':
        updateQuery = `
          UPDATE matches 
          SET half_time_break = true, is_timer_active = false, updated_at = NOW()
          WHERE id = $1
        `;
        // Add half time event
        await db.query(
          'INSERT INTO match_events (match_id, event_time, event_type, description) VALUES ($1, $2, $3, $4)',
          [id, match.current_minute, 'half_time', 'Turun minum']
        );
        break;

      case 'second_half':
        updateQuery = `
          UPDATE matches 
          SET half_time_break = false, is_timer_active = true, current_minute = 45, updated_at = NOW()
          WHERE id = $1
        `;
        break;

      case 'finish':
        updateQuery = `
          UPDATE matches 
          SET status = 'finished', is_timer_active = false, match_ended_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `;
        // Add full time event
        await db.query(
          'INSERT INTO match_events (match_id, event_time, event_type, description) VALUES ($1, $2, $3, $4)',
          [id, match.current_minute + match.extra_time, 'full_time', 'Pertandingan berakhir']
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await db.query(updateQuery, updateParams);

    // Get updated match
    const updatedMatch = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Match timer updated successfully',
      match: updatedMatch.rows[0]
    });
  } catch (error) {
    console.error('Update match timer error:', error);
    res.status(500).json({ error: 'Failed to update match timer' });
  }
});

module.exports = router;