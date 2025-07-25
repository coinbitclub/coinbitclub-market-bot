import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../../src/lib/database';
import jwt from 'jsonwebtoken';

interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  userType: 'user' | 'affiliate' | 'admin';
  referralCode?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
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
    const { fullName, email, phone, password, userType, referralCode }: RegisterRequest = req.body;

    console.log('🔍 REGISTER ATTEMPT:', { 
      fullName, 
      email, 
      phone, 
      userType, 
      referralCode,
      passwordLength: password?.length 
    });

    // Validações
    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ message: 'Nome deve ter pelo menos 2 caracteres' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    if (!userType || !['user', 'affiliate', 'admin'].includes(userType)) {
      return res.status(400).json({ message: 'Tipo de usuário inválido' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se email já existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já está em uso' });
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

    // Transação para criar usuário
    const result = await transaction(async (client) => {
      // Criar usuário
      const userResult = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, user_type, email_verification_token, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
         RETURNING id, name, email, phone, user_type, is_active, is_email_verified, created_at`,
        [fullName, normalizedEmail, phone, passwordHash, userType, emailVerificationToken]
      );

      const user: User = userResult.rows[0];
      console.log('✅ User created:', { id: user.id, email: user.email, type: user.user_type });

      // Criar balances do usuário
      await client.query(
        `INSERT INTO user_balances (user_id, prepaid_balance, total_profit, total_loss, pending_commission, paid_commission)
         VALUES ($1, 0, 0, 0, 0, 0)`,
        [user.id]
      );

      // Criar configurações de trading do usuário (opcional - comentado por enquanto)
      /*
      await client.query(
        `INSERT INTO user_trading_settings (user_id, max_leverage, max_stop_loss, max_percent_per_trade, is_active)
         VALUES ($1, 10, 5.0, 2.0, true)`,
        [user.id]
      );
      */

      // Se for afiliado, criar registro na tabela de afiliados
      if (userType === 'affiliate') {
        // Gerar código de afiliado único
        const affiliateCode = `CBC${Date.now().toString().slice(-6)}`;

        await client.query(
          `INSERT INTO affiliates (user_id, code, affiliate_code, commission_rate, is_active)
           VALUES ($1, $2, $3, 0.10, true)`,
          [user.id, affiliateCode, affiliateCode]
        );

        console.log('✅ Affiliate created with code:', affiliateCode);
      }

      // Criar subscription com plano válido existente
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // Usar plano Basic existente (ID conhecido do banco)
      const basicPlanId = '042e6ad2-2517-4197-b5ec-1d6d2fca5745';

      await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, plan_type, status, trial_ends_at)
         VALUES ($1, $2, 'trial', 'active', $3)`,
        [user.id, basicPlanId, trialEndsAt]
      );

      console.log('✅ Trial subscription created');

      return user;
    });

    // Gerar JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      { 
        userId: result.id, 
        email: result.email, 
        type: result.user_type,
        name: result.name 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful for:', result.email);

    // Resposta de sucesso
    res.status(201).json({
      message: 'Conta criada com sucesso',
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        type: result.user_type,
        isActive: result.is_active,
        isEmailVerified: result.is_email_verified,
        createdAt: result.created_at
      },
      token
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    res.status(500).json({ 
      message: 'Erro interno do servidor ao criar conta',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
