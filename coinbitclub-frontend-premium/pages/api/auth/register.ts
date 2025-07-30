import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../../src/lib/database';
import { generateTokenPair } from '../../../src/lib/jwt';

interface RegisterRequest {
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  password: string;
  referralCode?: string;
  userType?: 'individual' | 'business';
  phoneVerified?: boolean;
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
    const { 
      name, 
      fullName, 
      email, 
      phone, 
      whatsapp, 
      country, 
      password, 
      referralCode, 
      userType = 'individual',
      phoneVerified = false 
    }: RegisterRequest = req.body;

    const userName = fullName || name;
    const userPhone = phone || whatsapp;

    // Validações
    if (!userName || userName.length < 2) {
      return res.status(400).json({ message: 'Nome deve ter pelo menos 2 caracteres' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se email já existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Verificar se telefone já existe (se fornecido)
    if (userPhone) {
      const existingPhone = await query(
        'SELECT id FROM users WHERE phone = $1',
        [userPhone.replace(/\D/g, '')]
      );

      if (existingPhone.rows.length > 0) {
        return res.status(400).json({ message: 'Telefone já está em uso' });
      }
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Gerar token de verificação de email
    const emailVerificationToken = uuidv4();

    // Verificar código de referência se fornecido
    let referrerId = null;
    if (referralCode) {
      const referrer = await query(
        'SELECT user_id FROM affiliates WHERE affiliate_code = $1 AND is_active = true',
        [referralCode]
      );
      if (referrer.rows.length > 0) {
        referrerId = referrer.rows[0].user_id;
      }
    }

    // Transação para criar usuário e assinatura
    const result = await transaction(async (client) => {
      // Criar usuário
      const userResult = await client.query(
        `INSERT INTO users (name, email, phone, country, password_hash, email_verification_token, phone_verified, user_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, name, email, phone, country, is_email_verified, phone_verified, user_type, created_at`,
        [userName, normalizedEmail, userPhone ? userPhone.replace(/\D/g, '') : null, country, passwordHash, emailVerificationToken, phoneVerified, userType]
      );

      const user = userResult.rows[0];

      // Criar trial gratuito de 7 dias
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      await client.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, starts_at, ends_at, is_trial)
         VALUES ($1, 'trial', 'active', NOW(), $2, true)`,
        [user.id, trialEndsAt]
      );

      // Criar configurações padrão do usuário
      await client.query(
        `INSERT INTO user_settings (user_id) VALUES ($1)`,
        [user.id]
      );

      // Criar registro de afiliado
      const affiliateCode = `CBC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await client.query(
        `INSERT INTO affiliates (user_id, referrer_id, affiliate_code)
         VALUES ($1, $2, $3)`,
        [user.id, referrerId, affiliateCode]
      );

      // Se tem referência, incrementar contador
      if (referrerId) {
        await client.query(
          'UPDATE affiliates SET total_referrals = total_referrals + 1 WHERE user_id = $1',
          [referrerId]
        );
      }

      return user;
    });

    // Gerar tokens JWT
    const tokens = generateTokenPair({
      id: result.id,
      email: result.email,
      isAdmin: false,
      subscriptionStatus: 'trial'
    });

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
       VALUES ($1, 'USER_REGISTERED', 'users', $2, $3, $4)`,
      [
        result.id,
        result.id,
        JSON.stringify({ email: result.email, name: result.name }),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      ]
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        country: result.country,
        isEmailVerified: result.is_email_verified,
        isTrialActive: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: result.created_at,
        settings: {
          notifications: true,
          theme: 'dark',
          language: 'pt'
        }
      },
      tokens
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor. Tente novamente.' 
    });
  }
}
