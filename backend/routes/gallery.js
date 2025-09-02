const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Get all gallery items
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = 'SELECT * FROM gallery WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// Create gallery item (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { title, description, category, event_date } = req.body;
    const db = getDB();

    const imageUrl = req.file ? `/uploads/gallery/${req.file.filename}` : null;

    const result = await db.query(`
      INSERT INTO gallery (title, description, image_url, category, event_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description, imageUrl, category, event_date]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

module.exports = router;