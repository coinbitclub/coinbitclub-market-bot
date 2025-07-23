import jwt from 'jsonwebtoken';
import { db } from '../../../common/db.js';
import { env } from '../../../common/env.js';
import logger from '../../../common/logger.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Get user from database
    const user = await db('users')
      .where({ id: decoded.id, status: 'active' })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    // Add user to request object (excluding sensitive data)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      affiliate_id: user.affiliate_id,
      affiliate_code: user.affiliate_code
    };

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ last_login_at: db.fn.now() });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      logger.error({ error }, 'Authentication error');
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await db('users')
        .where({ id: decoded.userId, is_active: true })
        .first();

      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          affiliate_id: user.affiliate_id,
          affiliate_code: user.affiliate_code
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};
