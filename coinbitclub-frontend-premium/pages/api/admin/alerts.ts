// API para gestão de alertas
import { NextApiRequest, NextApiResponse } from 'next';

const alerts = [
  {
    id: '1',
    title: 'Sinal de Compra BTCUSDT',
    type: 'signal',
    priority: 'high',
    status: 'active',
    recipient: 'all_users',
    channels: ['email', 'push', 'telegram'],
    message: 'Sinal de COMPRA confirmado para BTCUSDT. Confiança: 94%',
    created_at: '2024-07-25T08:30:00Z',
    scheduled_for: null,
    sent_at: '2024-07-25T08:30:15Z',
    delivery_status: 'delivered',
    read_count: 1247,
    click_count: 892,
    approval_status: 'approved',
    approved_by: 'admin',
    approved_at: '2024-07-25T08:30:10Z'
  },
  {
    id: '2',
    title: 'Manutenção Programada',
    type: 'maintenance',
    priority: 'medium',
    status: 'scheduled',
    recipient: 'all_users',
    channels: ['email', 'push'],
    message: 'Sistema entrará em manutenção programada das 02:00 às 04:00 UTC',
    created_at: '2024-07-25T10:00:00Z',
    scheduled_for: '2024-07-26T02:00:00Z',
    sent_at: null,
    delivery_status: 'pending',
    read_count: 0,
    click_count: 0,
    approval_status: 'pending',
    approved_by: null,
    approved_at: null
  },
  {
    id: '3',
    title: 'Alta Volatilidade Detectada',
    type: 'warning',
    priority: 'urgent',
    status: 'active',
    recipient: 'premium_users',
    channels: ['sms', 'telegram', 'push'],
    message: 'ATENÇÃO: Alta volatilidade detectada no mercado. Recomenda-se cautela.',
    created_at: '2024-07-25T09:15:00Z',
    scheduled_for: null,
    sent_at: '2024-07-25T09:15:30Z',
    delivery_status: 'delivered',
    read_count: 234,
    click_count: 156,
    approval_status: 'approved',
    approved_by: 'admin',
    approved_at: '2024-07-25T09:15:20Z'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { status, type, priority } = query;
        let filteredAlerts = [...alerts];

        if (status && status !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
        }
        if (type && type !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
        }
        if (priority && priority !== 'all') {
          filteredAlerts = filteredAlerts.filter(alert => alert.priority === priority);
        }

        const stats = {
          total: alerts.length,
          active: alerts.filter(a => a.status === 'active').length,
          scheduled: alerts.filter(a => a.status === 'scheduled').length,
          sent: alerts.filter(a => a.status === 'sent').length,
          pending_approval: alerts.filter(a => a.approval_status === 'pending').length,
          total_reads: alerts.reduce((sum, a) => sum + a.read_count, 0),
          total_clicks: alerts.reduce((sum, a) => sum + a.click_count, 0)
        };

        res.status(200).json({
          success: true,
          alerts: filteredAlerts,
          stats,
          timestamp: new Date().toISOString()
        });
        break;

      case 'POST':
        const newAlert = {
          id: String(alerts.length + 1),
          ...req.body,
          created_at: new Date().toISOString(),
          read_count: 0,
          click_count: 0,
          approval_status: 'pending'
        };
        alerts.push(newAlert);
        res.status(201).json({ success: true, alert: newAlert });
        break;

      case 'PUT':
        const { id } = query;
        const alertIndex = alerts.findIndex(a => a.id === id);
        if (alertIndex === -1) {
          return res.status(404).json({ success: false, message: 'Alerta não encontrado' });
        }
        alerts[alertIndex] = { ...alerts[alertIndex], ...req.body };
        res.status(200).json({ success: true, alert: alerts[alertIndex] });
        break;

      case 'DELETE':
        const { id: deleteId } = query;
        const deleteIndex = alerts.findIndex(a => a.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({ success: false, message: 'Alerta não encontrado' });
        }
        alerts.splice(deleteIndex, 1);
        res.status(200).json({ success: true, message: 'Alerta removido com sucesso' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de alertas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
