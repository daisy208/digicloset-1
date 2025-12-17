import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('brandId').optional().isUUID()
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password, name, brandId } = req.body;

  // Check if user already exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw createError('User already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, brand_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, name, role, brand_id, created_at`,
    [email, passwordHash, name, brandId || null]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  // Log registration event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data, ip_address) 
     VALUES ($1, $2, 'user_registered', $3, $4)`,
    [user.id, brandId, JSON.stringify({ name, email }), req.ip]
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      brandId: user.brand_id,
      createdAt: user.created_at
    }
  });
}));

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password } = req.body;

  // Find user
  const result = await pool.query(
    'SELECT id, email, password_hash, name, role, brand_id, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw createError('Account is deactivated', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Update last login
  await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  // Log login event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data, ip_address) 
     VALUES ($1, $2, 'user_login', $3, $4)`,
    [user.id, user.brand_id, JSON.stringify({ email }), req.ip]
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      brandId: user.brand_id
    }
  });
}));

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.brand_id, u.avatar_url, u.preferences, 
            u.created_at, u.last_login, b.name as brand_name
     FROM users u
     LEFT JOIN brands b ON u.brand_id = b.id
     WHERE u.id = $1`,
    [req.user?.id]
  );

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = result.rows[0];
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      brandId: user.brand_id,
      brandName: user.brand_name,
      avatarUrl: user.avatar_url,
      preferences: user.preferences,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }
  });
}));

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('preferences').optional().isObject()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { name, preferences } = req.body;
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }

  if (preferences) {
    updates.push(`preferences = $${paramCount++}`);
    values.push(JSON.stringify(preferences));
  }

  if (updates.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.user?.id);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, preferences, updated_at`,
    values
  );

  res.json({
    message: 'Profile updated successfully',
    user: result.rows[0]
  });
}));

// Logout (invalidate token - in a real app, you'd maintain a blacklist)
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Log logout event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, ip_address) 
     VALUES ($1, $2, 'user_logout', $3)`,
    [req.user?.id, req.user?.brandId, req.ip]
  );

  res.json({ message: 'Logged out successfully' });
}));

export default router;