import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

    // Query para buscar estatísticas dos usuários
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN u.is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN u.email_verified = true THEN 1 END) as verified,
        COUNT(CASE WHEN COALESCE(up.plan_type, 'trial') = 'trial' THEN 1 END) as trial,
        COUNT(CASE WHEN COALESCE(up.plan_type, 'trial') = 'premium' THEN 1 END) as premium,
        jsonb_object_agg(
          COALESCE(u.country, 'unknown'), 
          COALESCE(country_counts.count, 0)
        ) as countries
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN (
        SELECT 
          COALESCE(country, 'unknown') as country,
          COUNT(*) as count
        FROM users 
        GROUP BY COALESCE(country, 'unknown')
      ) country_counts ON COALESCE(u.country, 'unknown') = country_counts.country
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.status(200).json({
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      verified: parseInt(stats.verified),
      trial: parseInt(stats.trial),
      premium: parseInt(stats.premium),
      countries: stats.countries || {}
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de usuários:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
