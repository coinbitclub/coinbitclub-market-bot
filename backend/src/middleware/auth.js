/**
 * Middleware de Autenticação
 * Valida tokens JWT para acesso às APIs
 */
import jwt from 'jsonwebtoken';
import db from '../../common/db.js';
import logger from '../../common/logger.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso requerido'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco
    const user = await db('users')
      .where('id', decoded.userId)
      .where('is_active', true)
      .first();
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado ou inativo'
      });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      region: user.region
    };
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }
    
    logger.error('Erro na autenticação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado'
      });
    }
    
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        error: 'Acesso negado - permissões insuficientes',
        required_roles: requiredRoles,
        user_roles: userRoles
      });
    }
    
    next();
  };
};
