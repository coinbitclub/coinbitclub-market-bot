import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body;
    
    console.log('🔍 LOGIN ATTEMPT (REAL DB):', { email, passwordLength: password?.length });

    if (!email || password?.length < 1) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco real
    const userResult = await query(
      'SELECT id, email, password_hash, name, role, status, phone, is_active FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', { email: user.email, role: user.role });

    // Verificar senha (pode ser bcrypt ou placeholder para desenvolvimento)
    let isValidPassword = false;
    
    if (user.password_hash === 'placeholder' && password === 'password') {
      // Para desenvolvimento - permitir senha padrão
      isValidPassword = true;
      console.log('🔐 Using development password');
    } else {
      // Verificação normal com bcrypt
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    }
    
    console.log('🔐 Password check:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Buscar dados adicionais baseado no tipo de usuário
    let additionalData = {};
    
    if (user.role === 'affiliate') {
      // Buscar dados do afiliado
      const affiliateResult = await query(
        'SELECT affiliate_code, commission_rate FROM affiliates WHERE user_id = $1',
        [user.id]
      );
      if (affiliateResult.rows.length > 0) {
        additionalData = {
          affiliateCode: affiliateResult.rows[0].affiliate_code,
          commissionRate: affiliateResult.rows[0].commission_rate
        };
      }
    }

    // Buscar perfil do usuário (simplificado - pular por enquanto devido a incompatibilidade UUID/Integer)
    console.log('ℹ️ Pulando busca de perfil devido a incompatibilidade de tipos UUID/Integer');

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', { 
      userId: user.id, 
      role: user.role 
    });

    // Atualizar último login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.role,
      role: user.role,
      status: user.status,
      phone: user.phone,
      ...additionalData
    };

    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
}
