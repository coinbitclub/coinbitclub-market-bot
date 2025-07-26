/**
 * 🚀 CONTROLADOR DE VERIFICAÇÃO WhatsApp - CoinBitClub Market Bot
 * Sistema completo de validação por WhatsApp e reset de senha
 * Versão: 3.0.0 - Integração Zapi Completa
 */

const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const zapiService = require('../services/zapiService');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Rate limiting específico para WhatsApp (configuração para testes)
const whatsappLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (reduzido para testes)
  max: 10, // máximo 10 tentativas por IP (aumentado para testes)
  message: {
    error: 'Muitas tentativas de verificação. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos (reduzido para testes)
  max: 10, // máximo 10 resets por IP (aumentado para testes)
  message: {
    error: 'Muitas tentativas de reset. Tente novamente em 5 minutos.',
    code: 'RESET_RATE_LIMIT'
  }
});

// ===== FUNÇÕES AUXILIARES =====

/**
 * Enviar WhatsApp via Zapi (integração real)
 */
async function sendWhatsAppMessage(whatsappNumber, message, messageType = 'verification') {
  try {
    console.log('📱 ENVIANDO WhatsApp via ZAPI (REAL):');
    console.log(`📞 Número: ${whatsappNumber}`);
    console.log(`💬 Mensagem: ${message}`);
    console.log(`🔖 Tipo: ${messageType}`);
    
    // Usar serviço Zapi real
    const result = await zapiService.sendWhatsAppMessage(whatsappNumber, message, messageType);
    
    if (result.success) {
      console.log('✅ Mensagem enviada via Zapi:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        status: 'sent',
        provider: 'zapi',
        whatsappNumber,
        sentAt: new Date().toISOString()
      };
    } else {
      console.log('❌ Erro no envio Zapi:', result.error);
      return {
        success: false,
        error: result.error,
        provider: 'zapi',
        whatsappNumber,
        sentAt: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('❌ Erro crítico no envio Zapi:', error.message);
    return {
      success: false,
      error: error.message,
      provider: 'zapi',
      whatsappNumber,
      sentAt: new Date().toISOString()
    };
  }
}

/**
 * Middleware de autenticação
 */
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token de autenticação necessário',
        code: 'NO_TOKEN' 
      });
    }

    // Verificar token (implementar JWT ou outro método)
    // Por agora, vamos aceitar tokens de admin e usuário para teste
    if (token === 'admin-emergency-token' || token.startsWith('user-')) {
      req.user = { 
        id: token === 'admin-emergency-token' ? 'admin-user-id' : token,
        role: token === 'admin-emergency-token' ? 'admin' : 'user'
      };
      next();
    } else {
      res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN' 
      });
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ 
      error: 'Erro de autenticação',
      code: 'AUTH_ERROR' 
    });
  }
};

/**
 * Middleware apenas para admins
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// ===== CONTROLADORES =====

/**
 * Iniciar verificação de WhatsApp
 * POST /api/whatsapp/start-verification
 */
const startWhatsAppVerification = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    console.log('🚀 Iniciando verificação WhatsApp:', {
      userId,
      whatsappNumber,
      ipAddress
    });

    if (!whatsappNumber) {
      return res.status(400).json({
        error: 'Número do WhatsApp é obrigatório',
        code: 'WHATSAPP_REQUIRED'
      });
    }

    // Chamar função do banco
    const result = await pool.query(
      'SELECT start_whatsapp_verification($1, $2, $3, $4) as result',
      [userId, whatsappNumber, ipAddress, userAgent]
    );

    const dbResult = result.rows[0].result;

    if (!dbResult.success) {
      return res.status(400).json(dbResult);
    }

    // Enviar mensagem WhatsApp
    const message = `🔐 CoinBitClub - Código de verificação: ${dbResult.code}\n\nVálido por 10 minutos.\nNão compartilhe este código!`;
    
    const whatsappResponse = await sendWhatsAppMessage(
      dbResult.whatsapp_number,
      message,
      'verification'
    );

    // Atualizar log com resultado do envio
    if (dbResult.log_id) {
      await pool.query(
        `UPDATE whatsapp_verification_logs 
         SET message_sent = $1, message_id = $2 
         WHERE id = $3`,
        [whatsappResponse.success, whatsappResponse.messageId, dbResult.log_id]
      );
    }

    // Remover código da resposta em produção
    delete dbResult.code;

    res.json({
      ...dbResult,
      whatsappSent: whatsappResponse.success
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar verificação WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Verificar código do WhatsApp
 * POST /api/whatsapp/verify-code
 */
const verifyWhatsAppCode = async (req, res) => {
  try {
    const { verificationCode } = req.body;
    const userId = req.user.id;

    console.log('🔍 Verificando código WhatsApp:', {
      userId,
      codeLength: verificationCode?.length
    });

    if (!verificationCode) {
      return res.status(400).json({
        error: 'Código de verificação é obrigatório',
        code: 'CODE_REQUIRED'
      });
    }

    if (verificationCode.length !== 6) {
      return res.status(400).json({
        error: 'Código deve ter 6 dígitos',
        code: 'INVALID_CODE_FORMAT'
      });
    }

    // Chamar função do banco
    const result = await pool.query(
      'SELECT verify_whatsapp_code($1, $2) as result',
      [userId, verificationCode]
    );

    const dbResult = result.rows[0].result;

    if (!dbResult.success) {
      return res.status(400).json(dbResult);
    }

    console.log('✅ WhatsApp verificado com sucesso:', userId);

    res.json(dbResult);

  } catch (error) {
    console.error('❌ Erro ao verificar código WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Iniciar reset de senha via WhatsApp
 * POST /api/auth/forgot-password-whatsapp
 */
const startPasswordResetWhatsApp = async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    console.log('🔑 Iniciando reset de senha via WhatsApp:', {
      email: email?.substring(0, 5) + '***',
      ipAddress
    });

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL'
      });
    }

    // Chamar função do banco
    const result = await pool.query(
      'SELECT start_password_reset_whatsapp($1, $2, $3) as result',
      [email, ipAddress, userAgent]
    );

    const dbResult = result.rows[0].result;

    // Se não encontrou usuário ou WhatsApp não verificado, retornar sucesso genérico
    if (dbResult.code === 'EMAIL_CHECK' || dbResult.code === 'WHATSAPP_NOT_VERIFIED') {
      return res.json({
        success: true,
        message: 'Se uma conta com este email existir e tiver WhatsApp verificado, um código foi enviado.'
      });
    }

    if (!dbResult.success) {
      return res.status(400).json(dbResult);
    }

    // Enviar código via WhatsApp
    const message = `🔑 CoinBitClub - Código para redefinir senha: ${dbResult.code}\n\nVálido por 10 minutos.\nUse apenas se você solicitou!`;
    
    const whatsappResponse = await sendWhatsAppMessage(
      dbResult.whatsapp_masked.replace('****', dbResult.whatsapp_number?.slice(-4) || '****'),
      message,
      'password_reset'
    );

    // Remover código da resposta
    delete dbResult.code;

    res.json({
      ...dbResult,
      whatsappSent: whatsappResponse.success
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar reset via WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Confirmar reset de senha com código WhatsApp
 * POST /api/auth/reset-password-whatsapp
 */
const confirmPasswordResetWhatsApp = async (req, res) => {
  try {
    const { resetCode, newPassword, confirmPassword } = req.body;

    console.log('🔐 Confirmando reset de senha via WhatsApp:', {
      codeLength: resetCode?.length,
      passwordLength: newPassword?.length
    });

    // Validações
    if (!resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Código, nova senha e confirmação são obrigatórios',
        code: 'FIELDS_REQUIRED'
      });
    }

    if (resetCode.length !== 6) {
      return res.status(400).json({
        error: 'Código deve ter 6 dígitos',
        code: 'INVALID_CODE_FORMAT'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Senhas não coincidem',
        code: 'PASSWORD_MISMATCH'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 8 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Chamar função do banco
    const result = await pool.query(
      'SELECT confirm_password_reset_whatsapp($1, $2) as result',
      [resetCode, hashedPassword]
    );

    const dbResult = result.rows[0].result;

    if (!dbResult.success) {
      return res.status(400).json(dbResult);
    }

    console.log('✅ Reset de senha confirmado via WhatsApp:', dbResult.user_id);

    res.json(dbResult);

  } catch (error) {
    console.error('❌ Erro ao confirmar reset via WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Reset manual de senha pelo admin
 * POST /api/admin/reset-user-password
 */
const adminResetUserPassword = async (req, res) => {
  try {
    const { targetUserId, newPassword, reason } = req.body;
    const adminUserId = req.user?.id || 'admin-user'; // fallback para testes

    console.log('👨‍💼 Admin resetando senha de usuário:', {
      adminUserId,
      targetUserId,
      reason
    });

    // Validações
    if (!targetUserId || !newPassword) {
      return res.status(400).json({
        error: 'ID do usuário e nova senha são obrigatórios',
        code: 'FIELDS_REQUIRED'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 8 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Chamar função do banco
    const result = await pool.query(
      'SELECT admin_reset_user_password($1, $2, $3, $4) as result',
      [adminUserId, targetUserId, hashedPassword, reason || 'Reset manual pelo admin']
    );

    const dbResult = result.rows[0].result;

    if (!dbResult.success) {
      return res.status(400).json(dbResult);
    }

    console.log('✅ Senha resetada pelo admin:', {
      admin: adminUserId,
      target: targetUserId
    });

    res.json(dbResult);

  } catch (error) {
    console.error('❌ Erro no reset admin:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
};

/**
 * Listar logs de verificação WhatsApp (Admin)
 * GET /api/admin/whatsapp-logs
 */
const getWhatsAppLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const offset = (page - 1) * limit;

    console.log('📋 Listando logs WhatsApp:', { page, limit, status, userId });

    let whereClause = '';
    const params = [limit, offset];
    let paramIndex = 3;

    if (status) {
      whereClause += ` AND wvl.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND wvl.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    const query = `
      SELECT 
        wvl.*,
        u.email,
        u.name
      FROM whatsapp_verification_logs wvl
      LEFT JOIN users u ON wvl.user_id = u.id::text OR wvl.user_id = u.email
      WHERE 1=1 ${whereClause}
      ORDER BY wvl.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, params);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM whatsapp_verification_logs wvl
      WHERE 1=1 ${whereClause}
    `;

    const countParams = params.slice(2); // Remove limit e offset
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar logs WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
};

/**
 * Obter estatísticas de verificação WhatsApp
 * GET /api/admin/whatsapp-stats
 */
const getWhatsAppStats = async (req, res) => {
  try {
    console.log('📊 Obtendo estatísticas WhatsApp');

    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN whatsapp_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN whatsapp IS NOT NULL THEN 1 END) as users_with_whatsapp,
        ROUND(
          COUNT(CASE WHEN whatsapp_verified = true THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(CASE WHEN whatsapp IS NOT NULL THEN 1 END), 0) * 100, 2
        ) as verification_rate_pct
      FROM users
      WHERE status = 'active' OR status IS NULL;
    `;

    const userStats = await pool.query(query);

    // Estatísticas simples de logs de verificação
    const verificationStats = await pool.query(`
      SELECT 
        DATE(created_at) as verification_date,
        COUNT(*) as total_verifications,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as successful_verifications
      FROM whatsapp_verification_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY verification_date DESC
      LIMIT 30
    `);

    // Estatísticas simples de reset
    const resetStats = await pool.query(`
      SELECT 
        DATE(created_at) as reset_date,
        COUNT(*) as total_resets,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as successful_resets
      FROM password_reset_whatsapp
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY reset_date DESC
      LIMIT 30
    `);

    res.json({
      userStats: userStats.rows[0],
      verificationTrend: verificationStats.rows,
      resetTrend: resetStats.rows,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas WhatsApp:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
};

/**
 * Limpeza de códigos expirados (Cron job)
 * POST /api/admin/cleanup-expired-codes
 */
const cleanupExpiredCodes = async (req, res) => {
  try {
    console.log('🧹 Limpando códigos expirados');

    const result = await pool.query('SELECT cleanup_expired_verification_codes() as cleaned');
    const cleanedCount = result.rows[0].cleaned;

    console.log(`✅ ${cleanedCount} códigos expirados limpos`);

    res.json({
      success: true,
      message: `${cleanedCount} códigos expirados foram limpos`,
      cleanedCount,
      cleanedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// ===== EXPORTAR CONTROLADORES =====

module.exports = {
  // Middlewares
  whatsappLimiter,
  resetLimiter,
  authenticateUser,
  requireAdmin,
  
  // Controladores de verificação
  startWhatsAppVerification,
  verifyWhatsAppCode,
  
  // Controladores de reset de senha
  startPasswordResetWhatsApp,
  confirmPasswordResetWhatsApp,
  
  // Controladores admin
  adminResetUserPassword,
  getWhatsAppLogs,
  getWhatsAppStats,
  cleanupExpiredCodes,
  
  // Função auxiliar
  sendWhatsAppMessage
};
