
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock database para desenvolvimento
const users = [
  {
    id: '1',
    email: 'admin@coinbitclub.com',
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'Administrador',
    role: 'admin',
    status: 'active'
  },
  {
    id: '2', 
    email: 'user@test.com',
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'Usuário Teste',
    role: 'user',
    status: 'trial_active'
  },
  {
    id: '3',
    email: 'affiliate@test.com', 
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'Afiliado Teste',
    role: 'affiliate',
    status: 'active',
    affiliateCode: 'AFF123'
  },
  {
    id: '4',
    email: 'faleconosco@coinbitclub.vip',
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'Fale Conosco',
    role: 'user',
    status: 'active'
  },
  {
    id: '5',
    email: 'usuario@coinbitclub.com',
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'João Silva',
    role: 'user',
    status: 'premium_active',
    plan: 'premium',
    balance: 1500.00
  },
  {
    id: '6',
    email: 'maria@teste.com',
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'Maria Santos',
    role: 'user',
    status: 'trial_active',
    plan: 'trial',
    balance: 500.00
  },
  {
    id: '7',
    email: 'demo@coinbitclub.com',
    password: '$2b$10$caike4NmhzzG1Ae.K29YhOCXiRUac/jHZ15RC4brbO31E1B/v2p.6', // password
    name: 'Usuário Demo',
    role: 'user',
    status: 'active',
    plan: 'basic',
    balance: 250.00
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body;
    
    console.log('🔍 LOGIN ATTEMPT:', { email, passwordLength: password?.length });

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Encontrar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    console.log('✅ User found:', { email: user.email, role: user.role });

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 Password check:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

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

    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
