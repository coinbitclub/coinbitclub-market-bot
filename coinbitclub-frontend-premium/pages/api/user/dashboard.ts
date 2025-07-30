import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import pool from '../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    role: string;
  };
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔐 Iniciando autenticação para User Dashboard API');
    
    // Verificar token JWT
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log('✅ Token válido para usuário:', decoded.id, 'role:', decoded.role);

    // Aceitar role 'user' ou 'usuario'
    if (decoded.role !== 'user' && decoded.role !== 'usuario') {
      console.log('❌ Usuário não é user:', decoded.role);
      return res.status(403).json({ message: 'Acesso negado - role inválido' });
    }

    req.user = decoded;

    console.log('📊 Buscando dados do dashboard do usuário...');

    // Dados mock do usuário - substitua por consultas reais ao banco
    const userDashboardData = {
      user: {
        id: decoded.id,
        name: 'Usuário Premium',
        email: 'user@coinbitclub.com',
        plan_type: 'Premium',
        country: 'Brasil',
        member_since: '2024-01-01',
        status: 'active'
      },
      balance: {
        prepaid_balance: 5000.00,
        total_profit: 2500.00,
        total_loss: 250.00,
        net_profit: 2250.00,
        pending_commission: 150.00,
        paid_commission: 800.00,
        available_balance: 7050.00
      },
      trading: {
        total_operations: 45,
        successful_operations: 38,
        success_rate: 84.4,
        avg_profit_per_trade: 65.79,
        best_trade: 350.00,
        worst_trade: -45.00,
        active_signals: 3
      },
      recent_trades: [
        {
          id: '1',
          symbol: 'BTCUSDT',
          side: 'LONG',
          entry_price: 45000.00,
          exit_price: 46500.00,
          profit_loss: 150.00,
          percentage: 3.33,
          date: '2024-01-10T14:30:00Z',
          status: 'closed'
        },
        {
          id: '2',
          symbol: 'ETHUSDT',
          side: 'SHORT',
          entry_price: 2800.00,
          exit_price: 2750.00,
          profit_loss: 75.00,
          percentage: 1.79,
          date: '2024-01-10T13:15:00Z',
          status: 'closed'
        }
      ],
      subscription: {
        plan: 'Premium',
        status: 'active',
        renewal_date: '2024-02-01',
        features: [
          'Sinais Premium',
          'Análise de Mercado',
          'Suporte 24/7',
          'Copy Trading'
        ]
      }
    };

    console.log('✅ Dados do dashboard do usuário carregados com sucesso');

    return res.status(200).json({
      success: true,
      data: userDashboardData,
      message: 'Dados do dashboard carregados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no User Dashboard API:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
