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
    console.log('🔐 Iniciando autenticação para Affiliate Dashboard API');
    
    // Verificar token JWT
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    console.log('✅ Token válido para usuário:', decoded.id, 'role:', decoded.role);

    // Verificar se é affiliate
    if (decoded.role !== 'affiliate' && decoded.role !== 'afiliado') {
      console.log('❌ Usuário não é afiliado:', decoded.role);
      return res.status(403).json({ message: 'Acesso negado - role inválido' });
    }

    req.user = decoded;

    console.log('📊 Buscando dados do dashboard do afiliado...');

    // Dados mock do afiliado - substitua por consultas reais ao banco
    const affiliateDashboardData = {
      affiliate: {
        id: decoded.id,
        name: 'Afiliado Premium',
        code: 'AFF001',
        level: 3,
        total_referrals: 25,
        active_referrals: 18,
        commission_rate: 0.15,
        bonus_rate: 0.05,
        total_earned: 12500.00,
        pending_commission: 1250.00,
        available_balance: 8750.00,
        next_payout_date: '2024-01-15'
      },
      referrals: [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          registration_date: '2024-01-01',
          status: 'active' as const,
          plan_type: 'Premium',
          total_invested: 5000.00,
          commission_generated: 750.00,
          level: 1
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          registration_date: '2024-01-05',
          status: 'active' as const,
          plan_type: 'VIP',
          total_invested: 10000.00,
          commission_generated: 1500.00,
          level: 1
        }
      ],
      recent_commissions: [
        {
          id: '1',
          type: 'direct' as const,
          amount: 500.00,
          source_user: 'João Silva',
          description: 'Comissão direta - Plano Premium',
          date: '2024-01-10',
          status: 'paid' as const,
          payment_date: '2024-01-12'
        },
        {
          id: '2',
          type: 'indirect' as const,
          amount: 250.00,
          source_user: 'Maria Santos',
          description: 'Comissão indireta - Nível 2',
          date: '2024-01-09',
          status: 'pending' as const
        }
      ],
      stats: {
        total_clicks: 1250,
        conversion_rate: 12.5,
        top_performing_link: '/ref/premium-plan',
        monthly_earnings: 3250.00,
        yearly_earnings: 12500.00,
        rank_position: 15,
        next_level_requirement: 5000.00
      }
    };

    console.log('✅ Dados do dashboard do afiliado carregados com sucesso');

    return res.status(200).json({
      success: true,
      data: affiliateDashboardData,
      message: 'Dados do dashboard carregados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no Affiliate Dashboard API:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
