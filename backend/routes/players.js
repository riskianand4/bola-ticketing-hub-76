const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Get all players
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.query('SELECT * FROM players WHERE is_active = true ORDER BY sort_order, jersey_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get single player
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const result = await db.query('SELECT * FROM players WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Create player (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('photo'), handleUploadError, async (req, res) => {
  try {
    const { name, position, jersey_number, nationality, date_of_birth, height, weight, bio, player_type, role_title, experience_years } = req.body;
    const db = getDB();

    const photoUrl = req.file ? `/uploads/players/${req.file.filename}` : null;
    const achievements = req.body.achievements ? req.body.achievements.split(',').map(a => a.trim()) : [];

    const result = await db.query(`
      INSERT INTO players (name, position, jersey_number, nationality, date_of_birth, height, weight, bio, photo_url, player_type, role_title, experience_years, achievements)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [name, position, jersey_number, nationality, date_of_birth, height, weight, bio, photoUrl, player_type, role_title, experience_years, achievements]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

module.exports = router;