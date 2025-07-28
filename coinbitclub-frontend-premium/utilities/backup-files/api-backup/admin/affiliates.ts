import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar se é admin
    requireAdmin(req);

    if (req.method === 'GET') {
      await handleGetAffiliates(req, res);
    } else if (req.method === 'PUT') {
      await handleUpdateAffiliate(req, res);
    } else if (req.method === 'POST') {
      await handleProcessPayouts(req, res);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de afiliados admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetAffiliates(req: NextApiRequest, res: NextApiResponse) {
  const { page = 1, limit = 50, status = '' } = req.query;
  
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  let whereClause = '';
  const params: any[] = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    whereClause = `WHERE a.status = $${paramCount}`;
    params.push(status);
  }

  const result = await query(`
    SELECT 
      a.id,
      a.user_id,
      u.name as user_name,
      u.email as user_email,
      a.affiliate_code,
      a.commission_rate,
      a.status,
      a.total_referrals,
      a.total_earnings,
      a.pending_payout,
      a.paid_out,
      a.created_at,
      COUNT(DISTINCT r.id) as current_referrals,
      COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0) as pending_commissions,
      COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END), 0) as paid_commissions
    FROM affiliates a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN affiliates r ON a.affiliate_code = r.referral_code
    LEFT JOIN commissions c ON a.id = c.affiliate_id
    ${whereClause}
    GROUP BY a.id, a.user_id, u.name, u.email, a.affiliate_code, a.commission_rate, 
             a.status, a.total_referrals, a.total_earnings, a.pending_payout, a.paid_out, a.created_at
    ORDER BY a.total_earnings DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `, [...params, parseInt(limit as string), offset]);

  // Buscar total de afiliados
  const totalResult = await query(`
    SELECT COUNT(*) as total
    FROM affiliates a
    ${whereClause}
  `, params);

  const affiliates = result.rows.map(affiliate => ({
    id: affiliate.id,
    userId: affiliate.user_id,
    userName: affiliate.user_name,
    userEmail: affiliate.user_email,
    affiliateCode: affiliate.affiliate_code,
    commissionRate: parseFloat(affiliate.commission_rate),
    status: affiliate.status,
    totalReferrals: parseInt(affiliate.total_referrals),
    totalEarnings: parseFloat(affiliate.total_earnings),
    pendingPayout: parseFloat(affiliate.pending_payout),
    paidOut: parseFloat(affiliate.paid_out),
    currentReferrals: parseInt(affiliate.current_referrals),
    pendingCommissions: parseFloat(affiliate.pending_commissions),
    paidCommissions: parseFloat(affiliate.paid_commissions),
    createdAt: affiliate.created_at
  }));

  res.status(200).json({
    affiliates,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: parseInt(totalResult.rows[0].total),
      totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / parseInt(limit as string))
    }
  });
}

async function handleUpdateAffiliate(req: NextApiRequest, res: NextApiResponse) {
  const { affiliateId, updates } = req.body;

  if (!affiliateId || !updates) {
    return res.status(400).json({ message: 'Affiliate ID e updates são obrigatórios' });
  }

  // Campos permitidos para atualização
  const allowedFields = ['commission_rate', 'status'];
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramCount = 0;

  Object.keys(updates).forEach(field => {
    if (allowedFields.includes(field)) {
      paramCount++;
      updateFields.push(`${field} = $${paramCount}`);
      updateValues.push(updates[field]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'Nenhum campo válido para atualizar' });
  }

  paramCount++;
  updateValues.push(affiliateId);

  const result = await query(`
    UPDATE affiliates 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING id, affiliate_code, commission_rate, status
  `, updateValues);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Afiliado não encontrado' });
  }

  // Log de auditoria
  await query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
     VALUES ($1, 'AFFILIATE_UPDATED_BY_ADMIN', 'affiliates', $2, $3, $4)`,
    [null, affiliateId, JSON.stringify({}), JSON.stringify(updates)]
  );

  res.status(200).json({
    message: 'Afiliado atualizado com sucesso',
    affiliate: result.rows[0]
  });
}

async function handleProcessPayouts(req: NextApiRequest, res: NextApiResponse) {
  const { affiliateIds, processAll = false } = req.body;

  if (!processAll && (!affiliateIds || !Array.isArray(affiliateIds))) {
    return res.status(400).json({ message: 'IDs dos afiliados são obrigatórios ou use processAll' });
  }

  try {
    // Começar transação
    await query('BEGIN');

    let whereClause = '';
    let params: any[] = [];

    if (!processAll) {
      whereClause = `WHERE a.id = ANY($1) AND a.pending_payout > 0`;
      params = [affiliateIds];
    } else {
      whereClause = `WHERE a.pending_payout > 0 AND a.status = 'active'`;
    }

    // Buscar afiliados com pagamentos pendentes
    const affiliatesResult = await query(`
      SELECT id, user_id, pending_payout, affiliate_code
      FROM affiliates a
      ${whereClause}
    `, params);

    if (affiliatesResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ message: 'Nenhum afiliado com pagamentos pendentes encontrado' });
    }

    let totalProcessed = 0;
    const processedAffiliates = [];

    for (const affiliate of affiliatesResult.rows) {
      const payoutAmount = parseFloat(affiliate.pending_payout);
      
      // Atualizar saldos do afiliado
      await query(`
        UPDATE affiliates 
        SET pending_payout = 0, 
            paid_out = paid_out + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [payoutAmount, affiliate.id]);

      // Atualizar status das comissões para 'paid'
      await query(`
        UPDATE commissions 
        SET status = 'paid', updated_at = NOW()
        WHERE affiliate_id = $1 AND status = 'pending'
      `, [affiliate.id]);

      // Log de auditoria
      await query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
         VALUES ($1, 'AFFILIATE_PAYOUT_PROCESSED', 'affiliates', $2, $3)`,
        [affiliate.user_id, affiliate.id, JSON.stringify({ 
          payout_amount: payoutAmount,
          processed_by: 'admin',
          processed_at: new Date().toISOString()
        })]
      );

      totalProcessed += payoutAmount;
      processedAffiliates.push({
        id: affiliate.id,
        affiliateCode: affiliate.affiliate_code,
        payoutAmount
      });
    }

    // Confirmar transação
    await query('COMMIT');

    res.status(200).json({
      message: 'Pagamentos processados com sucesso',
      totalProcessed,
      affiliatesCount: processedAffiliates.length,
      processedAffiliates
    });

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
