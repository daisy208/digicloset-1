import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { pool, redis } from '../config/database';

// Enhanced JWT with refresh tokens
export class AuthService {
  private jwtSecret: string;
  private refreshSecret: string;
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
    
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Generate access and refresh tokens
  generateTokens(userId: string, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, email, role, type: 'access' },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, email, role, type: 'refresh' },
      this.refreshSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Verify and refresh tokens
  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token is blacklisted
      const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new Error('Token is blacklisted');
      }

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId, decoded.email, decoded.role);
      
      // Blacklist old refresh token
      await redis.setex(`blacklist:${refreshToken}`, 7 * 24 * 60 * 60, 'true');
      
      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Two-Factor Authentication setup
  async setupTwoFactor(userId: string) {
    const secret = speakeasy.generateSecret({
      name: 'VirtualFit Enterprise',
      account: userId,
      length: 32
    });

    // Store secret in database
    await pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  // Verify 2FA token
  async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]?.two_factor_secret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: result.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 2
    });
  }

  // Password reset functionality
  async initiatePasswordReset(email: string) {
    const user = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      // Don't reveal if email exists
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetExpiry, email]
    );

    // Send reset email
    await this.sendPasswordResetEmail(email, user.rows[0].name, resetToken);

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (user.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    return { success: true };
  }

  // OAuth integration
  async handleOAuthCallback(provider: string, profile: any) {
    const email = profile.emails[0].value;
    
    // Check if user exists
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      // Create new user
      const result = await pool.query(
        'INSERT INTO users (email, name, oauth_provider, oauth_id, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
        [email, profile.displayName, provider, profile.id]
      );
      user = result;
    } else {
      // Update OAuth info
      await pool.query(
        'UPDATE users SET oauth_provider = $1, oauth_id = $2, last_login = NOW() WHERE email = $3',
        [provider, profile.id, email]
      );
    }

    return this.generateTokens(user.rows[0].id, email, user.rows[0].role);
  }

  // Email verification
  async sendVerificationEmail(email: string, userId: string) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await pool.query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [verificationToken, userId]
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.emailTransporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify your VirtualFit account',
      html: `
        <h1>Welcome to VirtualFit!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  async verifyEmail(token: string) {
    const result = await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id',
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid verification token');
    }

    return { success: true };
  }

  private async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.emailTransporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Reset your VirtualFit password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  }
}

// Rate limiting for different endpoints
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Store in Redis for distributed rate limiting
    store: {
      incr: async (key: string) => {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        return { totalHits: current, resetTime: new Date(Date.now() + windowMs) };
      },
      decrement: async (key: string) => {
        await redis.decr(key);
      },
      resetKey: async (key: string) => {
        await redis.del(key);
      }
    }
  });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Input validation schemas
export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('terms').equals('true').withMessage('You must accept the terms and conditions')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

export const authService = new AuthService();