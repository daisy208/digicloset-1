import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Get clothing items with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  query('style').optional().isIn(['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().isString(),
  query('brandId').optional().isUUID()
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    page = 1,
    limit = 20,
    category,
    style,
    minPrice,
    maxPrice,
    search,
    brandId
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions: string[] = ['ci.is_active = true'];
  const values: any[] = [];
  let paramCount = 1;

  // Build WHERE conditions
  if (category) {
    conditions.push(`ci.category = $${paramCount++}`);
    values.push(category);
  }

  if (style) {
    conditions.push(`ci.style = $${paramCount++}`);
    values.push(style);
  }

  if (minPrice) {
    conditions.push(`ci.price >= $${paramCount++}`);
    values.push(minPrice);
  }

  if (maxPrice) {
    conditions.push(`ci.price <= $${paramCount++}`);
    values.push(maxPrice);
  }

  if (search) {
    conditions.push(`(ci.name ILIKE $${paramCount} OR array_to_string(ci.tags, ' ') ILIKE $${paramCount})`);
    values.push(`%${search}%`);
    paramCount++;
  }

  if (brandId) {
    conditions.push(`ci.brand_id = $${paramCount++}`);
    values.push(brandId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM clothing_items ci ${whereClause}`,
    values
  );
  const totalItems = parseInt(countResult.rows[0].count);

  // Get items with pagination
  const itemsResult = await pool.query(
    `SELECT ci.*, b.name as brand_name
     FROM clothing_items ci
     LEFT JOIN brands b ON ci.brand_id = b.id
     ${whereClause}
     ORDER BY ci.created_at DESC
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.json({
    items: itemsResult.rows.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      style: item.style,
      colors: item.colors,
      price: parseFloat(item.price),
      imageUrl: item.image_url,
      overlayImageUrl: item.overlay_image_url,
      tags: item.tags,
      rating: parseFloat(item.rating || 0),
      sizes: item.sizes,
      brandId: item.brand_id,
      brandName: item.brand_name,
      metadata: item.metadata,
      createdAt: item.created_at
    })),
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems,
      itemsPerPage: Number(limit)
    }
  });
}));

// Get single clothing item
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT ci.*, b.name as brand_name
     FROM clothing_items ci
     LEFT JOIN brands b ON ci.brand_id = b.id
     WHERE ci.id = $1 AND ci.is_active = true`,
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('Clothing item not found', 404);
  }

  const item = result.rows[0];
  res.json({
    item: {
      id: item.id,
      name: item.name,
      category: item.category,
      style: item.style,
      colors: item.colors,
      price: parseFloat(item.price),
      imageUrl: item.image_url,
      overlayImageUrl: item.overlay_image_url,
      tags: item.tags,
      rating: parseFloat(item.rating || 0),
      sizes: item.sizes,
      brandId: item.brand_id,
      brandName: item.brand_name,
      metadata: item.metadata,
      createdAt: item.created_at
    }
  });
}));

// Create new clothing item (brand admin only)
router.post('/', authenticateToken, requireRole(['admin', 'brand_admin']), [
  body('name').trim().isLength({ min: 2 }),
  body('category').isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  body('style').isIn(['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist']),
  body('colors').isArray(),
  body('price').isFloat({ min: 0 }),
  body('imageUrl').isURL(),
  body('overlayImageUrl').isURL(),
  body('tags').optional().isArray(),
  body('sizes').optional().isArray(),
  body('brandId').isUUID()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    name,
    category,
    style,
    colors,
    price,
    imageUrl,
    overlayImageUrl,
    tags = [],
    sizes = [],
    brandId,
    metadata = {}
  } = req.body;

  // Check if user has access to this brand
  if (req.user?.role !== 'admin' && req.user?.brandId !== brandId) {
    throw createError('Access denied to this brand', 403);
  }

  const result = await pool.query(
    `INSERT INTO clothing_items 
     (brand_id, name, category, style, colors, price, image_url, overlay_image_url, tags, sizes, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [brandId, name, category, style, colors, price, imageUrl, overlayImageUrl, tags, sizes, JSON.stringify(metadata)]
  );

  const item = result.rows[0];

  // Log creation event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data) 
     VALUES ($1, $2, 'clothing_item_created', $3)`,
    [req.user?.id, brandId, JSON.stringify({ itemId: item.id, name })]
  );

  res.status(201).json({
    message: 'Clothing item created successfully',
    item: {
      id: item.id,
      name: item.name,
      category: item.category,
      style: item.style,
      colors: item.colors,
      price: parseFloat(item.price),
      imageUrl: item.image_url,
      overlayImageUrl: item.overlay_image_url,
      tags: item.tags,
      sizes: item.sizes,
      brandId: item.brand_id,
      metadata: item.metadata,
      createdAt: item.created_at
    }
  });
}));

// Update clothing item
router.put('/:id', authenticateToken, requireRole(['admin', 'brand_admin']), [
  body('name').optional().trim().isLength({ min: 2 }),
  body('category').optional().isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']),
  body('style').optional().isIn(['casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist']),
  body('colors').optional().isArray(),
  body('price').optional().isFloat({ min: 0 }),
  body('imageUrl').optional().isURL(),
  body('overlayImageUrl').optional().isURL(),
  body('tags').optional().isArray(),
  body('sizes').optional().isArray()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;

  // Check if item exists and user has access
  const existingItem = await pool.query(
    'SELECT brand_id FROM clothing_items WHERE id = $1 AND is_active = true',
    [id]
  );

  if (existingItem.rows.length === 0) {
    throw createError('Clothing item not found', 404);
  }

  if (req.user?.role !== 'admin' && req.user?.brandId !== existingItem.rows[0].brand_id) {
    throw createError('Access denied to this item', 403);
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Build update query dynamically
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      const dbField = key === 'imageUrl' ? 'image_url' : 
                     key === 'overlayImageUrl' ? 'overlay_image_url' : key;
      updates.push(`${dbField} = $${paramCount++}`);
      values.push(req.body[key]);
    }
  });

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE clothing_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  res.json({
    message: 'Clothing item updated successfully',
    item: result.rows[0]
  });
}));

// Delete clothing item (soft delete)
router.delete('/:id', authenticateToken, requireRole(['admin', 'brand_admin']), 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  // Check if item exists and user has access
  const existingItem = await pool.query(
    'SELECT brand_id FROM clothing_items WHERE id = $1 AND is_active = true',
    [id]
  );

  if (existingItem.rows.length === 0) {
    throw createError('Clothing item not found', 404);
  }

  if (req.user?.role !== 'admin' && req.user?.brandId !== existingItem.rows[0].brand_id) {
    throw createError('Access denied to this item', 403);
  }

  await pool.query(
    'UPDATE clothing_items SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  res.json({ message: 'Clothing item deleted successfully' });
}));

export default router;