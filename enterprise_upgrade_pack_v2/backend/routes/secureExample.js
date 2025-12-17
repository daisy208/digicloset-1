import express from 'express';
import { verifyToken } from '../auth/jwt.js';
import { requireRole } from '../auth/rbac.js';

const router = express.Router();

router.get(
  '/admin',
  verifyToken,
  requireRole(['admin']),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);

export default router;
