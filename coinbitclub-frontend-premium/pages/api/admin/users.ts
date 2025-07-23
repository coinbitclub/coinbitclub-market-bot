import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar se é admin
    requireAdmin(req);

    if (req.method === 'GET') {
      await handleGetUsers(req, res);
    } else if (req.method === 'PUT') {
      await handleUpdateUser(req, res);
    } else if (req.method === 'DELETE') {
      await handleDeleteUser(req, res);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de usuários admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  const { page = 1, limit = 50, search = '', status = '', planType = '' } = req.query;
  
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    whereClause += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  if (status) {
    paramCount++;
    if (status === 'active') {
      whereClause += ` AND u.is_active = $${paramCount}`;
      params.push(true);
    } else if (status === 'inactive') {
      whereClause += ` AND u.is_active = $${paramCount}`;
      params.push(false);
    }
  }

  if (planType) {
    paramCount++;
    whereClause += ` AND s.plan_type = $${paramCount}`;
    params.push(planType);
  }

  const result = await query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.country,
      u.is_active,
      u.is_admin,
      u.is_email_verified,
      u.created_at,
      s.plan_type,
      s.status as subscription_status,
      s.ends_at as subscription_ends_at,
      s.is_trial,
      COALESCE(SUM(p.amount), 0) as total_revenue,
      al.created_at as last_login
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'completed'
    LEFT JOIN (
      SELECT DISTINCT ON (user_id) user_id, created_at
      FROM audit_logs 
      WHERE action = 'USER_LOGIN'
      ORDER BY user_id, created_at DESC
    ) al ON u.id = al.user_id
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u.phone, u.country, u.is_active, u.is_admin, 
             u.is_email_verified, u.created_at, s.plan_type, s.status, s.ends_at, s.is_trial, al.created_at
    ORDER BY u.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `, [...params, parseInt(limit as string), offset]);

  // Buscar total de usuários para paginação
  const totalResult = await query(`
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    ${whereClause}
  `, params);

  const users = result.rows.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    country: user.country,
    isActive: user.is_active,
    isAdmin: user.is_admin,
    isEmailVerified: user.is_email_verified,
    planType: user.plan_type || 'none',
    subscriptionStatus: user.subscription_status || 'none',
    subscriptionEndsAt: user.subscription_ends_at,
    isTrial: user.is_trial || false,
    totalRevenue: parseFloat(user.total_revenue) || 0,
    createdAt: user.created_at,
    lastLogin: user.last_login
  }));

  res.status(200).json({
    users,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: parseInt(totalResult.rows[0].total),
      totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / parseInt(limit as string))
    }
  });
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse) {
  const { userId, updates } = req.body;

  if (!userId || !updates) {
    return res.status(400).json({ message: 'User ID e updates são obrigatórios' });
  }

  // Campos permitidos para atualização
  const allowedFields = ['name', 'email', 'phone', 'country', 'is_active', 'is_admin'];
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
  updateValues.push(userId);

  const result = await query(`
    UPDATE users 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING id, name, email, is_active, is_admin
  `, updateValues);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Log de auditoria
  await query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
     VALUES ($1, 'USER_UPDATED_BY_ADMIN', 'users', $2, $3, $4)`,
    [userId, userId, JSON.stringify({}), JSON.stringify(updates)]
  );

  res.status(200).json({
    message: 'Usuário atualizado com sucesso',
    user: result.rows[0]
  });
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID é obrigatório' });
  }

  // Soft delete - apenas desativar o usuário
  const result = await query(`
    UPDATE users 
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
    RETURNING id, name, email
  `, [userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Log de auditoria
  await query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
     VALUES ($1, 'USER_DEACTIVATED_BY_ADMIN', 'users', $2, $3)`,
    [userId, userId, JSON.stringify({ deactivated: true })]
  );

  res.status(200).json({
    message: 'Usuário desativado com sucesso',
    user: result.rows[0]
  });
}
