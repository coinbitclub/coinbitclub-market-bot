import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    console.log('🔍 Tentativa de login:', email);

    // Buscar usuário no banco
    const userResult = await query(
      'SELECT id, name, email, password_hash, role, status, phone, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = userResult.rows[0];
    console.log('👤 Usuário encontrado:', user.name, 'Role:', user.role);

    // Verificar se a conta está ativa
    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Conta inativa. Entre em contato com o suporte.' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Buscar dados adicionais baseado no tipo de usuário
    let additionalData = {};
    
    if (user.role === 'affiliate') {
      // Buscar dados do afiliado
      try {
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
      } catch (error) {
        console.log('⚠️ Erro ao buscar dados do afiliado:', error);
      }
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'coinbitclub-secret-key',
      { expiresIn: '24h' }
    );

    // Dados do usuário para retorno
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      user_type: user.role,
      role: user.role,
      status: user.status,
      phone: user.phone,
      ...additionalData
    };

    console.log('✅ Login realizado com sucesso:', user.name);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
}
