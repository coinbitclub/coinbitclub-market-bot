import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock database para desenvolvimento
const users: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { name, email, password, phone, role = 'affiliate' } = req.body;

    // Validações
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 8 caracteres' });
    }

    // Verificar se usuário já existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'affiliate',
      status: 'trial_active',
      affiliateCode: `AFF${Date.now()}`, // Gerar código único
      createdAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    users.push(user);

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '30d' }
    );

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Afiliado cadastrado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no cadastro de afiliado:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
