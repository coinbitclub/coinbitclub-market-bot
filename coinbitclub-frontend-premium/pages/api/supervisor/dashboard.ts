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
    console.log('🔐 Iniciando autenticação para Supervisor Dashboard API');
    
    // Verificar token JWT
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log('✅ Token válido para usuário:', decoded.id, 'role:', decoded.role);

    // Verificar se é supervisor
    if (decoded.role !== 'supervisor') {
      console.log('❌ Usuário não é supervisor:', decoded.role);
      return res.status(403).json({ message: 'Acesso negado - role inválido' });
    }

    req.user = decoded;

    console.log('📊 Buscando dados do dashboard do supervisor...');

    // Dados mock do supervisor - substitua por consultas reais ao banco
    const supervisorDashboardData = {
      supervisor: {
        id: decoded.id,
        name: 'Supervisor Geral',
        department: 'Operações e Compliance',
        level: 'Executive',
        supervised_teams: 5,
        total_operators: 25,
        active_operations: 156,
        compliance_score: 97.8,
        performance_rating: 9.2
      },
      team_overview: [
        {
          team_id: 'team_1',
          team_name: 'Equipe Alpha',
          gestor: 'Ana Silva',
          operators_count: 6,
          active_operations: 35,
          success_rate: 94.2,
          monthly_profit: 45000.00,
          status: 'active'
        },
        {
          team_id: 'team_2',
          team_name: 'Equipe Beta',
          gestor: 'Carlos Lima',
          operators_count: 5,
          active_operations: 28,
          success_rate: 91.8,
          monthly_profit: 38500.00,
          status: 'active'
        },
        {
          team_id: 'team_3',
          team_name: 'Equipe Gamma',
          gestor: 'Maria Santos',
          operators_count: 7,
          active_operations: 42,
          success_rate: 96.1,
          monthly_profit: 52000.00,
          status: 'active'
        },
        {
          team_id: 'team_4',
          team_name: 'Equipe Delta',
          gestor: 'João Costa',
          operators_count: 4,
          active_operations: 31,
          success_rate: 89.3,
          monthly_profit: 35000.00,
          status: 'active'
        },
        {
          team_id: 'team_5',
          team_name: 'Equipe Epsilon',
          gestor: 'Paula Oliveira',
          operators_count: 3,
          active_operations: 20,
          success_rate: 92.7,
          monthly_profit: 28000.00,
          status: 'active'
        }
      ],
      compliance_alerts: [
        {
          id: 'alert_1',
          type: 'Limite de Risco Excedido',
          severity: 'medium',
          description: 'Operação com exposição acima do limite permitido',
          team_affected: 'Equipe Beta',
          timestamp: '2024-01-10T14:30:00Z',
          status: 'pending'
        },
        {
          id: 'alert_2',
          type: 'Documentação Pendente',
          severity: 'low',
          description: 'Relatório mensal de compliance em atraso',
          team_affected: 'Equipe Delta',
          timestamp: '2024-01-10T13:15:00Z',
          status: 'pending'
        },
        {
          id: 'alert_3',
          type: 'Auditoria Programada',
          severity: 'high',
          description: 'Auditoria externa agendada para próxima semana',
          team_affected: 'Todas as Equipes',
          timestamp: '2024-01-10T12:00:00Z',
          status: 'scheduled'
        }
      ],
      performance_metrics: {
        overall_success_rate: 93.2,
        total_profit: 198500.00,
        risk_compliance: 97.8,
        operational_efficiency: 94.6
      }
    };

    console.log('✅ Dados do dashboard do supervisor carregados com sucesso');

    return res.status(200).json({
      success: true,
      data: supervisorDashboardData,
      message: 'Dados do dashboard carregados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no Supervisor Dashboard API:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
