import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { query } from '../../../src/lib/database';
import { generateTokenPair } from '../../../src/lib/jwt';

interface LoginRequest {
  email: string;
  password: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, password }: LoginRequest = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário no banco
    const userResult = await query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.country, u.password_hash, 
        u.is_email_verified, u.is_active, u.is_admin, u.created_at,
        s.plan_type, s.status as subscription_status, s.ends_at as subscription_ends_at, s.is_trial,
        us.notifications_email, us.theme, us.language
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN user_settings us ON u.id = us.user_id
       WHERE u.email = $1 AND u.is_active = true`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const user = userResult.rows[0];

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Log tentativa de login inválida
      await query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
         VALUES ($1, 'INVALID_LOGIN_ATTEMPT', 'users', $2, $3, $4)`,
        [
          user.id,
          user.id,
          JSON.stringify({ email: normalizedEmail }),
          req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
        ]
      );

      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    // Verificar se conta está ativa
    if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Calcular status do trial/assinatura
    let isTrialActive = false;
    let trialDaysRemaining = 0;
    let subscriptionStatus = 'expired';

    if (user.subscription_status === 'active') {
      subscriptionStatus = user.subscription_status;
      
      if (user.is_trial && user.subscription_ends_at) {
        const trialEnd = new Date(user.subscription_ends_at);
        const now = new Date();
        
        if (trialEnd > now) {
          isTrialActive = true;
          const diffTime = trialEnd.getTime() - now.getTime();
          trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          subscriptionStatus = 'expired';
        }
      }
    }

    // Gerar tokens JWT
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      subscriptionStatus
    });

    // Log de login bem-sucedido
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
       VALUES ($1, 'USER_LOGIN', 'users', $2, $3, $4)`,
      [
        user.id,
        user.id,
        JSON.stringify({ email: user.email, loginTime: new Date().toISOString() }),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      ]
    );

    // Resposta com dados do usuário
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        isEmailVerified: user.is_email_verified,
        isAdmin: user.is_admin,
        isTrialActive,
        trialDaysRemaining,
        subscriptionStatus,
        subscriptionType: user.plan_type || 'none',
        trialEndsAt: user.subscription_ends_at || null,
        createdAt: user.created_at,
        settings: {
          notifications: user.notifications_email ?? true,
          theme: user.theme || 'dark',
          language: user.language || 'pt'
        }
      },
      tokens
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor. Tente novamente.' 
    });
  }
}
