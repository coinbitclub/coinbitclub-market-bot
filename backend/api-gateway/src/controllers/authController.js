import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../../../common/db.js';
import { sendResetEmail } from '../services/emailService.js';
import { validate, validateBody, authSchema } from '../../../common/validation.js';
import { handleAsyncError } from '../../../common/utils.js';
import { env } from '../../../common/env.js';
import logger from '../../../common/logger.js';

const JWT_SECRET = env.JWT_SECRET;

// Generate JWT tokens
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { id: userId, type: 'access' }, 
    JWT_SECRET, 
    { expiresIn: env.JWT_EXPIRES_IN || '24h' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

// Verify user account status
async function verifyUserStatus(user) {
  if (user.status === 'suspended') {
    throw new Error('Account is suspended. Please contact support.');
  }
  
  if (user.status === 'inactive') {
    throw new Error('Account is inactive. Please verify your email.');
  }
  
  return true;
}

export const register = handleAsyncError(async (req, res) => {
  const data = validate(authSchema.register, req.body);
  const { email, password, name, referralCode } = data;
  
  // Check if user already exists
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    return res.status(409).json({ 
      error: 'User already exists with this email address' 
    });
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Handle referral code
  let affiliateId = null;
  if (referralCode) {
    const affiliate = await db('users')
      .where({ role: 'affiliate' })
      .where('id', referralCode)
      .orWhere('email', referralCode)
      .first();
    
    if (affiliate) {
      affiliateId = affiliate.id;
    }
  }
  
  // Create user
  const [user] = await db('users').insert({
    email,
    password_hash: passwordHash,
    name,
    affiliate_id: affiliateId,
    trial_ends_at: db.raw("datetime('now', '+7 days')"),
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  }).returning(['id', 'email', 'name', 'role', 'status', 'trial_ends_at']);
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  // Log registration
  logger.info({ userId: user.id, email: user.email }, 'User registered successfully');
  
  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      trialEndsAt: user.trial_ends_at
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

export const login = handleAsyncError(async (req, res) => {
  const data = validate(authSchema.login, req.body);
  const { email, password } = data;
  
  // Find user
  const user = await db('users').where({ email }).first();
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Check user status
  try {
    await verifyUserStatus(user);
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
  
  // Update last login
  await db('users')
    .where({ id: user.id })
    .update({ 
      last_login_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  // Log login
  logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      trialEndsAt: user.trial_ends_at
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

export const refreshToken = handleAsyncError(async (req, res) => {
  const data = validate(authSchema.refreshToken, req.body);
  const { refreshToken } = data;
  
  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    
    // Check if user still exists and is active
    const user = await db('users').where({ id: payload.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    await verifyUserStatus(user);
    
    // Generate new tokens
    const tokens = generateTokens(user.id);
    
    res.json({
      message: 'Token refreshed successfully',
      tokens
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    throw error;
  }
});

export const resetPassword = handleAsyncError(async (req, res) => {
  const data = validate(authSchema.resetPassword, req.body);
  const { email } = data;
  
  // Check if user exists
  const user = await db('users').where({ email }).first();
  if (!user) {
    // Don't reveal if email exists for security
    return res.json({ 
      message: 'If an account with this email exists, a reset link has been sent' 
    });
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  // Store reset token (you might want to create a separate table for this)
  await db('users')
    .where({ id: user.id })
    .update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpiry,
      updated_at: db.fn.now()
    });
  
  // Send reset email
  await sendResetEmail(email, resetToken);
  
  logger.info({ userId: user.id, email }, 'Password reset requested');
  
  res.json({ 
    message: 'If an account with this email exists, a reset link has been sent' 
  });
});

export const changePassword = handleAsyncError(async (req, res) => {
  const data = validate(authSchema.changePassword, req.body);
  const { oldPassword, newPassword } = data;
  const userId = req.user.id; // From auth middleware
  
  // Get current user
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Verify old password
  const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isValidPassword) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  
  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  
  // Update password
  await db('users')
    .where({ id: userId })
    .update({
      password_hash: newPasswordHash,
      updated_at: db.fn.now()
    });
  
  logger.info({ userId }, 'Password changed successfully');
  
  res.json({ message: 'Password changed successfully' });
});

export const logout = handleAsyncError(async (req, res) => {
  // In a full implementation, you might want to blacklist the token
  // For now, we'll just return success and let the client handle token removal
  
  logger.info({ userId: req.user?.id }, 'User logged out');
  
  res.json({ message: 'Logged out successfully' });
});

export const profile = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  
  const user = await db('users')
    .select([
      'id', 'email', 'name', 'phone', 'role', 'status', 
      'timezone', 'language', 'email_notifications', 
      'sms_notifications', 'risk_tolerance', 'max_concurrent_trades',
      'trial_ends_at', 'last_login_at', 'created_at'
    ])
    .where({ id: userId })
    .first();
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
});

// Middleware to authenticate JWT tokens
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Access token expired' });
      }
      return res.status(403).json({ error: 'Invalid access token' });
    }
    
    if (user.type !== 'access') {
      return res.status(403).json({ error: 'Invalid token type' });
    }
    
    req.user = user;
    next();
  });
};

// Public stats for landing page
export const getPublicStats = handleAsyncError(async (req, res) => {
  const publicStats = {
    operationTime: '24/7',
    uptime: 99.9,
    exchanges: 15,
    activeUsers: 12500
  };

  res.json({ 
    success: true, 
    data: publicStats 
  });
});

// Routes
const router = express.Router();

// Public routes
router.post('/register', validateBody(authSchema.register), register);
router.post('/login', validateBody(authSchema.login), login);
router.post('/refresh', validateBody(authSchema.refreshToken), refreshToken);
router.post('/reset-password', validateBody(authSchema.resetPassword), resetPassword);
router.get('/public-stats', getPublicStats);

// Protected routes 
router.use(authenticateToken);
router.post('/change-password', validateBody(authSchema.changePassword), changePassword);
router.post('/logout', logout);
router.get('/profile', profile);

export default router;
