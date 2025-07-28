import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock database para desenvolvimento - simula registros de usuários
const registeredUsers: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { name, email, phone, country, password, referralCode } = req.body;

    console.log('Dados recebidos:', { name, email, phone, country, password: '***', referralCode });

    // Validações básicas
    if (!name || name.trim().length < 2) {
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
    const existingUser = registeredUsers.find(user => user.email === normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone || null,
      country: country || 'Brasil',
      password: hashedPassword,
      role: 'user',
      status: 'trial_active',
      plan: 'trial',
      balance: 0,
      affiliateCode: referralCode || 'Coinbitclub',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Adicionar ao mock database
    registeredUsers.push(newUser);

    console.log('Usuário criado:', { ...newUser, password: '***' });

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'coinbitclub-super-secret-jwt-key-2025',
      { expiresIn: '30d' }
    );

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
