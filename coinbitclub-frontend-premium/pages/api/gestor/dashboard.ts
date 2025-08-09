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
    console.log('🔐 Iniciando autenticação para Gestor Dashboard API');
    
    // Verificar token JWT
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log('✅ Token válido para usuário:', decoded.id, 'role:', decoded.role);

    // Verificar se é gestor
    if (decoded.role !== 'gestor' && decoded.role !== 'manager') {
      console.log('❌ Usuário não é gestor:', decoded.role);
      return res.status(403).json({ message: 'Acesso negado - role inválido' });
    }

    req.user = decoded;

    console.log('📊 Buscando dados do dashboard do gestor...');

    // Dados mock do gestor - substitua por consultas reais ao banco
    const gestorDashboardData = {
      gestor: {
        id: decoded.id,
        name: 'Gestor Principal',
        department: 'Operações',
        level: 'Senior',
        team_size: 15,
        total_operations: 250,
        active_operations: 45,
        success_rate: 94.5,
        total_managed_value: 500000.00,
        monthly_target: 75000.00,
        monthly_achieved: 68500.00,
        performance_score: 91.3
      },
      team_performance: [
        {
          id: '1',
          member_name: 'Ana Costa',
          role: 'Operador Senior',
          operations_count: 45,
          success_rate: 96.2,
          efficiency_score: 94.8,
          status: 'active'
        },
        {
          id: '2',
          member_name: 'Carlos Lima',
          role: 'Operador Junior',
          operations_count: 32,
          success_rate: 89.1,
          efficiency_score: 87.5,
          status: 'active'
        }
      ],
      recent_operations: [
        {
          id: '1',
          type: 'signal_execution',
          asset: 'BTCUSDT',
          amount: 25000.00,
          result: 'profit',
          profit_loss: 1250.00,
          operator: 'Ana Costa',
          date: '2024-01-10T14:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'risk_management',
          asset: 'ETHUSDT',
          amount: 15000.00,
          result: 'stopped',
          profit_loss: -500.00,
          operator: 'Carlos Lima',
          date: '2024-01-10T13:15:00Z',
          status: 'completed'
        }
      ],
      stats: {
        total_profit: 125000.00,
        total_loss: 8500.00,
        net_profit: 116500.00,
        win_rate: 87.6,
        risk_score: 2.3,
        compliance_score: 98.2,
        team_efficiency: 92.1,
        monthly_growth: 12.5
      }
    };

    console.log('✅ Dados do dashboard do gestor carregados com sucesso');

    return res.status(200).json({
      success: true,
      data: gestorDashboardData,
      message: 'Dados do dashboard carregados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no Gestor Dashboard API:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
