import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../../src/lib/database';

interface LoginRequest {
  email: string;
  password: string;
}

interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: string;
  is_active: boolean;
  is_email_verified: boolean;
  password_hash: string;
  created_at: string;
  // Dados de subscription
  subscription_status?: string;
  subscription_plan?: string;
  trial_ends_at?: string;
  // Dados de afiliado se aplicável
  affiliate_code?: string;
  commission_rate?: number;
  // Dados de balanço
  prepaid_balance?: number;
  total_profit?: number;
  total_loss?: number;
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
    
    console.log('🔍 LOGIN ATTEMPT:', { email, passwordLength: password?.length });

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário com todos os dados relacionados
    const userResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.user_type,
        u.is_active,
        u.is_email_verified,
        u.password_hash,
        u.created_at,
        -- Subscription data
        s.status as subscription_status,
        s.plan_type as subscription_plan,
        s.trial_ends_at,
        -- Affiliate data (if applicable)
        a.affiliate_code,
        a.commission_rate,
        -- Balance data
        b.prepaid_balance,
        b.total_profit,
        b.total_loss
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      LEFT JOIN affiliates a ON u.id = a.user_id AND a.is_active = true
      LEFT JOIN user_balances b ON u.id = b.user_id
      WHERE u.email = $1
      LIMIT 1
    `, [normalizedEmail]);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found:', normalizedEmail);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user: UserWithDetails = userResult.rows[0];
    console.log('✅ User found:', { 
      email: user.email, 
      type: user.user_type, 
      isActive: user.is_active 
    });

    // Verificar se usuário está ativo
    if (!user.is_active) {
      console.log('❌ User inactive:', user.email);
      return res.status(401).json({ message: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 Password check:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', user.email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Gerar JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        type: user.user_type,
        name: user.name 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Preparar dados do usuário para resposta
    const userData: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.user_type,
      user_type: user.user_type, // Adicionar compatibilidade
      userType: user.user_type,   // Mais compatibilidade
      isActive: user.is_active,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at,
      subscription: {
        status: user.subscription_status || 'inactive',
        plan: user.subscription_plan || 'none',
        trialEndsAt: user.trial_ends_at
      },
      balance: {
        prepaid: user.prepaid_balance || 0,
        totalProfit: user.total_profit || 0,
        totalLoss: user.total_loss || 0
      }
    };

    // Adicionar dados de afiliado se aplicável
    if (user.user_type === 'affiliate' && user.affiliate_code) {
      userData.affiliate = {
        code: user.affiliate_code,
        commissionRate: user.commission_rate || 10
      };
    }

    console.log('✅ Login successful for:', user.email, 'Type:', user.user_type);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: userData,
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
