import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database-real';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAffiliates(req, res);
      case 'POST':
        return await createAffiliate(req, res);
      case 'PUT':
        return await updateAffiliate(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Erro na API affiliates:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET - Listar afiliados com métricas
async function getAffiliates(req: NextApiRequest, res: NextApiResponse) {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    status = '',
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  try {
    console.log('🔍 Buscando afiliados com filtros:', { page, limit, search, status });

    // Construir query com filtros
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`a.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM affiliates a
      JOIN users u ON a.user_id = u.id 
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Query principal com paginação
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryParams.push(limit, offset);
    
    const affiliatesQuery = `
      SELECT 
        a.id,
        a.user_id,
        a.commission_rate,
        a.status,
        a.total_referrals,
        a.total_commissions,
        a.pending_commissions,
        a.paid_commissions,
        a.created_at,
        a.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.referral_code,
        u.current_plan
      FROM affiliates a
      JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const affiliatesResult = await query(affiliatesQuery, queryParams);

    // Buscar estatísticas detalhadas para cada afiliado
    const affiliatesWithStats = await Promise.all(
      affiliatesResult.rows.map(async (affiliate) => {
        // Referidos ativos
        const referralsResult = await query(`
          SELECT 
            COUNT(*) as total_referrals,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_referrals,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_referrals_month
          FROM users 
          WHERE referred_by = $1
        `, [affiliate.user_id]);

        // Comissões detalhadas
        const commissionsResult = await query(`
          SELECT 
            COUNT(*) as total_commissions,
            SUM(amount) as total_amount,
            SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pending_amount,
            SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as paid_amount,
            AVG(amount) as avg_commission
          FROM commissions 
          WHERE affiliate_id = $1
        `, [affiliate.id]);

        const referrals = referralsResult.rows[0];
        const commissions = commissionsResult.rows[0];

        return {
          ...affiliate,
          commissionRate: parseFloat(affiliate.commission_rate) || 0,
          totalCommissions: parseFloat(affiliate.total_commissions) || 0,
          pendingCommissions: parseFloat(affiliate.pending_commissions) || 0,
          paidCommissions: parseFloat(affiliate.paid_commissions) || 0,
          referrals: {
            total: parseInt(referrals.total_referrals) || 0,
            active: parseInt(referrals.active_referrals) || 0,
            newThisMonth: parseInt(referrals.new_referrals_month) || 0
          },
          commissionsStats: {
            totalTransactions: parseInt(commissions.total_commissions) || 0,
            totalAmount: parseFloat(commissions.total_amount) || 0,
            pendingAmount: parseFloat(commissions.pending_amount) || 0,
            paidAmount: parseFloat(commissions.paid_amount) || 0,
            avgCommission: parseFloat(commissions.avg_commission) || 0
          }
        };
      })
    );

    const response = {
      affiliates: affiliatesWithStats,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      },
      filters: { search, status, sortBy, sortOrder }
    };

    console.log(`✅ ${affiliatesWithStats.length} afiliados retornados de ${total} total`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro ao buscar afiliados:', error);
    throw error;
  }
}

// POST - Criar novo afiliado
async function createAffiliate(req: NextApiRequest, res: NextApiResponse) {
  const { userId, commissionRate = 10, status = 'active' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID é obrigatório' });
  }

  try {
    // Verificar se usuário existe
    const userCheck = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já é afiliado
    const affiliateCheck = await query('SELECT id FROM affiliates WHERE user_id = $1', [userId]);
    if (affiliateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Usuário já é afiliado' });
    }

    // Criar afiliado
    const affiliateResult = await query(`
      INSERT INTO affiliates (
        user_id, commission_rate, status, created_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING id, user_id, commission_rate, status, created_at
    `, [userId, commissionRate, status]);

    const newAffiliate = affiliateResult.rows[0];

    console.log('✅ Afiliado criado:', newAffiliate.id);
    return res.status(201).json({ affiliate: newAffiliate });

  } catch (error) {
    console.error('❌ Erro ao criar afiliado:', error);
    throw error;
  }
}

// PUT - Atualizar afiliado
async function updateAffiliate(req: NextApiRequest, res: NextApiResponse) {
  const { affiliateId, updates } = req.body;

  if (!affiliateId) {
    return res.status(400).json({ error: 'Affiliate ID é obrigatório' });
  }

  try {
    const allowedFields = ['commission_rate', 'status'];

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    updateValues.push(affiliateId);
    
    const updateQuery = `
      UPDATE affiliates 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, user_id, commission_rate, status, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    console.log('✅ Afiliado atualizado:', affiliateId);
    return res.status(200).json({ affiliate: result.rows[0] });

  } catch (error) {
    console.error('❌ Erro ao atualizar afiliado:', error);
    throw error;
  }
}
