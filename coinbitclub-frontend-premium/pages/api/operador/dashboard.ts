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
    console.log('🔐 Iniciando autenticação para Operador Dashboard API');
    
    // Verificar token JWT
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log('✅ Token válido para usuário:', decoded.id, 'role:', decoded.role);

    // Verificar se é operador
    if (decoded.role !== 'operador' && decoded.role !== 'operator') {
      console.log('❌ Usuário não é operador:', decoded.role);
      return res.status(403).json({ message: 'Acesso negado - role inválido' });
    }

    req.user = decoded;

    console.log('📊 Buscando dados do dashboard do operador...');

    // Dados mock do operador - substitua por consultas reais ao banco
    const operadorDashboardData = {
      operador: {
        id: decoded.id,
        name: 'Operador Especialista',
        level: 'Senior',
        shift: 'Morning',
        specialization: 'Crypto Trading',
        total_operations: 156,
        successful_operations: 142,
        success_rate: 91.0,
        total_profit: 45000.00,
        monthly_target: 8000.00,
        monthly_achieved: 7200.00,
        efficiency_score: 94.2,
        last_operation: '2024-01-10T15:45:00Z'
      },
      active_signals: [
        {
          id: '1',
          asset: 'BTCUSDT',
          signal_type: 'BUY',
          entry_price: 42500.00,
          current_price: 43200.00,
          target_price: 44000.00,
          stop_loss: 41800.00,
          profit_loss: 700.00,
          status: 'active',
          created_at: '2024-01-10T14:30:00Z'
        },
        {
          id: '2',
          asset: 'ETHUSDT',
          signal_type: 'SELL',
          entry_price: 2620.00,
          current_price: 2598.00,
          target_price: 2550.00,
          stop_loss: 2680.00,
          profit_loss: 22.00,
          status: 'active',
          created_at: '2024-01-10T13:15:00Z'
        }
      ],
      recent_operations: [
        {
          id: '1',
          asset: 'BTCUSDT',
          type: 'BUY',
          entry_price: 41800.00,
          exit_price: 42500.00,
          amount: 0.5,
          profit_loss: 350.00,
          duration: '2h 15m',
          date: '2024-01-10T12:00:00Z',
          status: 'completed'
        },
        {
          id: '2',
          asset: 'ADAUSDT',
          type: 'SELL',
          entry_price: 0.485,
          exit_price: 0.478,
          amount: 10000,
          profit_loss: 70.00,
          duration: '1h 45m',
          date: '2024-01-10T10:30:00Z',
          status: 'completed'
        }
      ],
      performance_stats: {
        daily_profit: 1250.00,
        weekly_profit: 4200.00,
        monthly_profit: 7200.00,
        win_rate: 91.0,
        avg_profit_per_trade: 285.00,
        max_drawdown: 2.1,
        sharpe_ratio: 2.85,
        current_streak: 8,
        best_streak: 15
      },
      market_alerts: [
        {
          id: '1',
          message: 'Bitcoin quebrou resistência de $43000',
          priority: 'high',
          asset: 'BTCUSDT',
          timestamp: '2024-01-10T15:30:00Z'
        },
        {
          id: '2',
          message: 'Volume anômalo detectado em ETHUSDT',
          priority: 'medium',
          asset: 'ETHUSDT',
          timestamp: '2024-01-10T15:20:00Z'
        }
      ]
    };

    console.log('✅ Dados do dashboard do operador carregados com sucesso');

    return res.status(200).json({
      success: true,
      data: operadorDashboardData,
      message: 'Dados do dashboard carregados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no Operador Dashboard API:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
