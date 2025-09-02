const express = require('express');
const { getDB } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all merchandise
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, available_only = 'true' } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
      SELECT m.*, mc.name as category_name
      FROM merchandise m
      LEFT JOIN merchandise_categories mc ON m.category_id = mc.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (available_only === 'true') {
      query += ' AND m.is_available = true AND m.stock_quantity > 0';
    }

    if (category) {
      paramCount++;
      query += ` AND m.category_id = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (m.name ILIKE $${paramCount} OR m.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM merchandise WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (available_only === 'true') {
      countQuery += ' AND is_available = true AND stock_quantity > 0';
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND category_id = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
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
    console.error('Get merchandise error:', error);
    res.status(500).json({ error: 'Failed to fetch merchandise' });
  }
});

// Get merchandise categories
router.get('/categories', async (req, res) => {
  try {
    const db = getDB();
    
    const result = await db.query(`
      SELECT mc.*, COUNT(m.id) as product_count
      FROM merchandise_categories mc
      LEFT JOIN merchandise m ON mc.id = m.category_id AND m.is_available = true
      GROUP BY mc.id, mc.name, mc.description, mc.created_at, mc.updated_at
      ORDER BY mc.name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single merchandise
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query(`
      SELECT m.*, mc.name as category_name
      FROM merchandise m
      LEFT JOIN merchandise_categories mc ON m.category_id = mc.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Merchandise not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get merchandise error:', error);
    res.status(500).json({ error: 'Failed to fetch merchandise' });
  }
});

// Create merchandise (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), handleUploadError, [
  body('name').trim().isLength({ min: 1 }),
  body('price').isDecimal({ decimal_digits: '0,2' }),
  body('stock_quantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, category_id, colors, sizes, stock_quantity, is_available } = req.body;
    const db = getDB();

    const imageUrl = req.file ? `/uploads/merchandise/${req.file.filename}` : null;
    const colorsArray = colors ? colors.split(',').map(c => c.trim()) : [];
    const sizesArray = sizes ? sizes.split(',').map(s => s.trim()) : [];

    const result = await db.query(`
      INSERT INTO merchandise (name, description, price, category_id, image_url, colors, sizes, stock_quantity, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, description, price, category_id, imageUrl, colorsArray, sizesArray, stock_quantity, is_available !== 'false']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create merchandise error:', error);
    res.status(500).json({ error: 'Failed to create merchandise' });
  }
});

// Update merchandise (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, colors, sizes, stock_quantity, is_available } = req.body;
    const db = getDB();

    // Get existing merchandise
    const existing = await db.query('SELECT * FROM merchandise WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Merchandise not found' });
    }

    let imageUrl = existing.rows[0].image_url;
    if (req.file) {
      imageUrl = `/uploads/merchandise/${req.file.filename}`;
    }

    const colorsArray = colors ? colors.split(',').map(c => c.trim()) : existing.rows[0].colors;
    const sizesArray = sizes ? sizes.split(',').map(s => s.trim()) : existing.rows[0].sizes;

    const result = await db.query(`
      UPDATE merchandise 
      SET name = $1, description = $2, price = $3, category_id = $4, image_url = $5,
          colors = $6, sizes = $7, stock_quantity = $8, is_available = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [name, description, price, category_id, imageUrl, colorsArray, sizesArray, stock_quantity, is_available !== 'false', id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update merchandise error:', error);
    res.status(500).json({ error: 'Failed to update merchandise' });
  }
});

// Delete merchandise (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const result = await db.query('DELETE FROM merchandise WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Merchandise not found' });
    }

    res.json({ message: 'Merchandise deleted successfully' });
  } catch (error) {
    console.error('Delete merchandise error:', error);
    res.status(500).json({ error: 'Failed to delete merchandise' });
  }
});

// Add to cart
router.post('/:id/cart', authenticateToken, [
  body('quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, size, color } = req.body;
    const db = getDB();

    // Check if item already in cart
    const existingItem = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND merchandise_id = $2 AND size = $3 AND color = $4',
      [req.user.id, id, size || null, color || null]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      await db.query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2',
        [quantity, existingItem.rows[0].id]
      );
    } else {
      // Insert new item
      await db.query(
        'INSERT INTO cart_items (user_id, merchandise_id, quantity, size, color) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, id, quantity, size || null, color || null]
      );
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Get cart items
router.get('/cart/items', authenticateToken, async (req, res) => {
  try {
    const db = getDB();

    const result = await db.query(`
      SELECT ci.*, m.name, m.price, m.image_url, m.stock_quantity, m.is_available
      FROM cart_items ci
      LEFT JOIN merchandise m ON ci.merchandise_id = m.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

// Update cart item
router.put('/cart/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const db = getDB();

    const result = await db.query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, itemId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove cart item
router.delete('/cart/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const db = getDB();

    const result = await db.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [itemId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

module.exports = router;