const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all published news
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
      SELECT n.*, p.full_name as author_name,
             (SELECT COUNT(*) FROM news_views WHERE news_id = n.id) as view_count,
             (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as like_count
      FROM news n
      LEFT JOIN profiles p ON n.author_id = p.user_id
      WHERE n.published = true
    `;
    
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND n.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY n.published_at DESC, n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM news WHERE published = true';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR content ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
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
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get single news by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = getDB();

    const result = await db.query(`
      SELECT n.*, p.full_name as author_name,
             (SELECT COUNT(*) FROM news_views WHERE news_id = n.id) as view_count,
             (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as like_count
      FROM news n
      LEFT JOIN profiles p ON n.author_id = p.user_id
      WHERE n.slug = $1 AND n.published = true
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    const news = result.rows[0];

    // Record view
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    await db.query(
      'INSERT INTO news_views (news_id, user_id, ip_address) VALUES ($1, $2, $3)',
      [news.id, req.user?.id || null, ipAddress]
    );

    res.json(news);
  } catch (error) {
    console.error('Get news by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Create news (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('featured_image'), handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, excerpt, category, published } = req.body;
    const db = getDB();

    // Generate slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug exists
    const existingSlug = await db.query('SELECT id FROM news WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      return res.status(409).json({ error: 'News with this title already exists' });
    }

    const featuredImage = req.file ? `/uploads/news/${req.file.filename}` : null;
    const publishedAt = published === 'true' ? new Date() : null;

    const result = await db.query(`
      INSERT INTO news (title, slug, content, excerpt, featured_image, category, author_id, published, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [title, slug, content, excerpt, featuredImage, category, req.user.id, published === 'true', publishedAt]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// Update news (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('featured_image'), handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, published } = req.body;
    const db = getDB();

    // Check if news exists
    const existingNews = await db.query('SELECT * FROM news WHERE id = $1', [id]);
    if (existingNews.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    let featuredImage = existingNews.rows[0].featured_image;
    if (req.file) {
      featuredImage = `/uploads/news/${req.file.filename}`;
    }

    const publishedAt = published === 'true' && !existingNews.rows[0].published ? new Date() : existingNews.rows[0].published_at;

    const result = await db.query(`
      UPDATE news 
      SET title = $1, content = $2, excerpt = $3, featured_image = $4, category = $5, 
          published = $6, published_at = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [title, content, excerpt, featuredImage, category, published === 'true', publishedAt, id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// Delete news (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// Like/unlike news
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if already liked
    const existingLike = await db.query(
      'SELECT id FROM news_likes WHERE news_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM news_likes WHERE news_id = $1 AND user_id = $2', [id, req.user.id]);
      res.json({ message: 'News unliked', liked: false });
    } else {
      // Like
      await db.query('INSERT INTO news_likes (news_id, user_id) VALUES ($1, $2)', [id, req.user.id]);
      res.json({ message: 'News liked', liked: true });
    }
  } catch (error) {
    console.error('Like news error:', error);
    res.status(500).json({ error: 'Failed to like/unlike news' });
  }
});

// Get news comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query(`
      SELECT nc.*, p.full_name, p.avatar_url,
             (SELECT COUNT(*) FROM news_comment_likes WHERE comment_id = nc.id) as like_count
      FROM news_comments nc
      LEFT JOIN profiles p ON nc.user_id = p.user_id
      WHERE nc.news_id = $1
      ORDER BY nc.created_at ASC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    const db = getDB();

    const result = await db.query(`
      INSERT INTO news_comments (news_id, user_id, parent_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, req.user.id, parent_id || null, content]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;