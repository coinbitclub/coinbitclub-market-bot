import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar se é admin
    requireAdmin(req);

    if (req.method === 'GET') {
      await handleGetNotifications(req, res);
    } else if (req.method === 'POST') {
      await handleSendNotification(req, res);
    } else if (req.method === 'PUT') {
      await handleUpdateNotification(req, res);
    } else if (req.method === 'DELETE') {
      await handleDeleteNotification(req, res);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de notificações admin:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetNotifications(req: NextApiRequest, res: NextApiResponse) {
  const { page = 1, limit = 50, type = '', status = '' } = req.query;
  
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (type) {
    paramCount++;
    whereClause += ` AND type = $${paramCount}`;
    params.push(type);
  }

  if (status) {
    paramCount++;
    whereClause += ` AND status = $${paramCount}`;
    params.push(status);
  }

  const result = await query(`
    SELECT 
      n.id,
      n.user_id,
      u.name as user_name,
      u.email as user_email,
      n.type,
      n.title,
      n.message,
      n.status,
      n.scheduled_at,
      n.sent_at,
      n.created_at,
      n.metadata
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    ${whereClause}
    ORDER BY n.created_at DESC
    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
  `, [...params, parseInt(limit as string), offset]);

  // Buscar total de notificações
  const totalResult = await query(`
    SELECT COUNT(*) as total
    FROM notifications n
    ${whereClause}
  `, params);

  const notifications = result.rows.map(notification => ({
    id: notification.id,
    userId: notification.user_id,
    userName: notification.user_name,
    userEmail: notification.user_email,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    status: notification.status,
    scheduledAt: notification.scheduled_at,
    sentAt: notification.sent_at,
    createdAt: notification.created_at,
    metadata: notification.metadata
  }));

  res.status(200).json({
    notifications,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: parseInt(totalResult.rows[0].total),
      totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / parseInt(limit as string))
    }
  });
}

async function handleSendNotification(req: NextApiRequest, res: NextApiResponse) {
  const { 
    userIds, 
    type, 
    title, 
    message, 
    sendToAll = false,
    scheduledAt = null,
    metadata = {} 
  } = req.body;

  if (!type || !title || !message) {
    return res.status(400).json({ 
      message: 'Tipo, título e mensagem são obrigatórios' 
    });
  }

  if (!sendToAll && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
    return res.status(400).json({ 
      message: 'IDs dos usuários são obrigatórios ou use sendToAll' 
    });
  }

  try {
    await query('BEGIN');

    let targetUserIds = userIds;

    // Se sendToAll for true, buscar todos os usuários ativos
    if (sendToAll) {
      const usersResult = await query(`
        SELECT id FROM users WHERE is_active = true
      `);
      targetUserIds = usersResult.rows.map(row => row.id);
    }

    const notifications = [];
    const status = scheduledAt ? 'scheduled' : 'pending';

    // Criar notificações para cada usuário
    for (const userId of targetUserIds) {
      const result = await query(`
        INSERT INTO notifications (user_id, type, title, message, status, scheduled_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [userId, type, title, message, status, scheduledAt, JSON.stringify(metadata)]);

      notifications.push({
        id: result.rows[0].id,
        userId
      });
    }

    await query('COMMIT');

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, 'BULK_NOTIFICATION_SENT', 'notifications', $2, $3)`,
      [null, null, JSON.stringify({ 
        type,
        title,
        target_users: targetUserIds.length,
        send_to_all: sendToAll,
        scheduled_at: scheduledAt
      })]
    );

    res.status(200).json({
      message: 'Notificações criadas com sucesso',
      notificationsCount: notifications.length,
      notifications
    });

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

async function handleUpdateNotification(req: NextApiRequest, res: NextApiResponse) {
  const { notificationId, updates } = req.body;

  if (!notificationId || !updates) {
    return res.status(400).json({ 
      message: 'Notification ID e updates são obrigatórios' 
    });
  }

  // Campos permitidos para atualização
  const allowedFields = ['title', 'message', 'status', 'scheduled_at'];
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
    return res.status(400).json({ 
      message: 'Nenhum campo válido para atualizar' 
    });
  }

  paramCount++;
  updateValues.push(notificationId);

  const result = await query(`
    UPDATE notifications 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING id, title, status
  `, updateValues);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Notificação não encontrada' });
  }

  res.status(200).json({
    message: 'Notificação atualizada com sucesso',
    notification: result.rows[0]
  });
}

async function handleDeleteNotification(req: NextApiRequest, res: NextApiResponse) {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ 
      message: 'Notification ID é obrigatório' 
    });
  }

  const result = await query(`
    DELETE FROM notifications 
    WHERE id = $1 AND status IN ('pending', 'scheduled')
    RETURNING id, title
  `, [notificationId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ 
      message: 'Notificação não encontrada ou não pode ser excluída' 
    });
  }

  res.status(200).json({
    message: 'Notificação excluída com sucesso',
    notification: result.rows[0]
  });
}
