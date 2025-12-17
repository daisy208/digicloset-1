import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all brands (admin only)
router.get('/brands', authenticateToken, requireRole(['admin']), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive', 'trial'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (status) {
    conditions.push(`b.status = $${paramCount++}`);
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get brands with user count and try-on statistics
  const brandsResult = await pool.query(`
    SELECT 
      b.*,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT ts.id) as try_on_count,
      COUNT(DISTINCT CASE WHEN ts.converted THEN ts.id END) as conversion_count,
      COALESCE(AVG(CASE WHEN ts.converted THEN 1.0 ELSE 0.0 END) * 100, 0) as conversion_rate
    FROM brands b
    LEFT JOIN users u ON b.id = u.brand_id AND u.is_active = true
    LEFT JOIN try_on_sessions ts ON u.id = ts.user_id AND ts.created_at >= NOW() - INTERVAL '30 days'
    ${whereClause}
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `, [...values, limit, offset]);

  // Get total count
  const countResult = await pool.query(`
    SELECT COUNT(*) FROM brands b ${whereClause}
  `, values);

  const totalItems = parseInt(countResult.rows[0].count);

  res.json({
    brands: brandsResult.rows.map(brand => ({
      id: brand.id,
      name: brand.name,
      logoUrl: brand.logo_url,
      status: brand.status,
      subscriptionPlan: brand.subscription_plan,
      userCount: parseInt(brand.user_count),
      tryOnCount: parseInt(brand.try_on_count),
      conversionCount: parseInt(brand.conversion_count),
      conversionRate: parseFloat(brand.conversion_rate).toFixed(1),
      settings: brand.settings,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at
    })),
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems,
      itemsPerPage: Number(limit)
    }
  });
}));

// Create new brand (admin only)
router.post('/brands', authenticateToken, requireRole(['admin']), [
  body('name').trim().isLength({ min: 2 }),
  body('logoUrl').optional().isURL(),
  body('subscriptionPlan').optional().isIn(['starter', 'professional', 'enterprise'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { name, logoUrl, subscriptionPlan = 'starter' } = req.body;

  // Generate API key for the brand
  const apiKey = `vf_${uuidv4().replace(/-/g, '')}`;

  const result = await pool.query(`
    INSERT INTO brands (name, logo_url, subscription_plan, api_key)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [name, logoUrl, subscriptionPlan, apiKey]);

  const brand = result.rows[0];

  res.status(201).json({
    message: 'Brand created successfully',
    brand: {
      id: brand.id,
      name: brand.name,
      logoUrl: brand.logo_url,
      status: brand.status,
      subscriptionPlan: brand.subscription_plan,
      apiKey: brand.api_key,
      createdAt: brand.created_at
    }
  });
}));

// Update brand (admin only)
router.put('/brands/:id', authenticateToken, requireRole(['admin']), [
  body('name').optional().trim().isLength({ min: 2 }),
  body('logoUrl').optional().isURL(),
  body('status').optional().isIn(['active', 'inactive', 'trial']),
  body('subscriptionPlan').optional().isIn(['starter', 'professional', 'enterprise'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Build update query dynamically
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      const dbField = key === 'logoUrl' ? 'logo_url' : 
                     key === 'subscriptionPlan' ? 'subscription_plan' : key;
      updates.push(`${dbField} = $${paramCount++}`);
      values.push(req.body[key]);
    }
  });

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(`
    UPDATE brands SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *
  `, values);

  if (result.rows.length === 0) {
    throw createError('Brand not found', 404);
  }

  res.json({
    message: 'Brand updated successfully',
    brand: result.rows[0]
  });
}));

// Get all users (admin only)
router.get('/users', authenticateToken, requireRole(['admin']), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'brand_admin', 'user']),
  query('brandId').optional().isUUID()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20, role, brandId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (role) {
    conditions.push(`u.role = $${paramCount++}`);
    values.push(role);
  }

  if (brandId) {
    conditions.push(`u.brand_id = $${paramCount++}`);
    values.push(brandId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const usersResult = await pool.query(`
    SELECT 
      u.*,
      b.name as brand_name,
      COUNT(DISTINCT ts.id) as try_on_count,
      MAX(ts.created_at) as last_try_on
    FROM users u
    LEFT JOIN brands b ON u.brand_id = b.id
    LEFT JOIN try_on_sessions ts ON u.id = ts.user_id
    ${whereClause}
    GROUP BY u.id, b.name
    ORDER BY u.created_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `, [...values, limit, offset]);

  // Get total count
  const countResult = await pool.query(`
    SELECT COUNT(*) FROM users u ${whereClause}
  `, values);

  const totalItems = parseInt(countResult.rows[0].count);

  res.json({
    users: usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      brandId: user.brand_id,
      brandName: user.brand_name,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      tryOnCount: parseInt(user.try_on_count),
      lastTryOn: user.last_try_on,
      createdAt: user.created_at,
      lastLogin: user.last_login
    })),
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems,
      itemsPerPage: Number(limit)
    }
  });
}));

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireRole(['admin']), [
  body('name').optional().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['admin', 'brand_admin', 'user']),
  body('isActive').optional().isBoolean(),
  body('brandId').optional().isUUID()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Build update query dynamically
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      const dbField = key === 'isActive' ? 'is_active' : 
                     key === 'brandId' ? 'brand_id' : key;
      updates.push(`${dbField} = $${paramCount++}`);
      values.push(req.body[key]);
    }
  });

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(`
    UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, brand_id, is_active
  `, values);

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  res.json({
    message: 'User updated successfully',
    user: result.rows[0]
  });
}));

// Get platform statistics (admin only)
router.get('/stats', authenticateToken, requireRole(['admin']), 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Get overall platform statistics
  const statsResult = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM brands WHERE status = 'active') as active_brands,
      (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
      (SELECT COUNT(*) FROM try_on_sessions WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_try_ons,
      (SELECT COUNT(*) FROM try_on_sessions WHERE converted = true AND created_at >= NOW() - INTERVAL '30 days') as monthly_conversions,
      (SELECT ROUND(AVG(CASE WHEN converted THEN 1.0 ELSE 0.0 END) * 100, 2) FROM try_on_sessions WHERE created_at >= NOW() - INTERVAL '30 days') as conversion_rate
  `);

  const stats = statsResult.rows[0];

  // Get growth metrics (compare with previous period)
  const growthResult = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_current,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') as new_users_previous,
      (SELECT COUNT(*) FROM try_on_sessions WHERE created_at >= NOW() - INTERVAL '30 days') as try_ons_current,
      (SELECT COUNT(*) FROM try_on_sessions WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') as try_ons_previous
  `);

  const growth = growthResult.rows[0];

  // Calculate growth percentages
  const userGrowth = growth.new_users_previous > 0 
    ? ((growth.new_users_current - growth.new_users_previous) / growth.new_users_previous * 100).toFixed(1)
    : '0';

  const tryOnGrowth = growth.try_ons_previous > 0
    ? ((growth.try_ons_current - growth.try_ons_previous) / growth.try_ons_previous * 100).toFixed(1)
    : '0';

  res.json({
    overview: {
      activeBrands: parseInt(stats.active_brands),
      activeUsers: parseInt(stats.active_users),
      monthlyTryOns: parseInt(stats.monthly_try_ons),
      monthlyConversions: parseInt(stats.monthly_conversions),
      conversionRate: parseFloat(stats.conversion_rate || 0)
    },
    growth: {
      userGrowth: `${userGrowth}%`,
      tryOnGrowth: `${tryOnGrowth}%`,
      newUsersThisMonth: parseInt(growth.new_users_current),
      tryOnsThisMonth: parseInt(growth.try_ons_current)
    }
  });
}));

export default router;