import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  created_at: string;
  is_active: boolean;
  email_verified: boolean;
  plan_type?: string;
  country?: string;
  total_operations?: number;
  total_profit?: number;
  last_login?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Parâmetros de consulta
    const {
      page = '1',
      limit = '20',
      search = '',
      type = 'all',
      plan = 'all',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const sortOrderStr = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder;
    const sortByStr = Array.isArray(sortBy) ? sortBy[0] : sortBy;

    // Construir WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (type !== 'all') {
      whereConditions.push(`u.user_type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    if (plan !== 'all') {
      whereConditions.push(`COALESCE(up.plan_type, 'trial') = $${paramIndex}`);
      queryParams.push(plan);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query principal para buscar usuários
    const usersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_type as "userType",
        u.created_at,
        u.is_active,
        u.email_verified,
        u.last_login,
        u.country,
        COALESCE(up.plan_type, 'trial') as plan_type,
        COALESCE(stats.total_operations, 0) as total_operations,
        COALESCE(stats.total_profit, 0) as total_profit
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(*) as total_operations,
          COALESCE(SUM(CASE WHEN status = 'CLOSED' AND pnl > 0 THEN pnl ELSE 0 END), 0) as total_profit
        FROM operations 
        GROUP BY user_id
      ) stats ON u.id = stats.user_id
      ${whereClause}
      ORDER BY u.${sortByStr} ${sortOrderStr.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limitNum, offset);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit e offset

    // Executar queries
    const [usersResult, countResult] = await Promise.all([
      pool.query(usersQuery, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const users = usersResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
