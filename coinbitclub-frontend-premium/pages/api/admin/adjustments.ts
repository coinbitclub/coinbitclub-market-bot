// API para gestão de ajustes financeiros
import { NextApiRequest, NextApiResponse } from 'next';

const adjustments = [
  {
    id: '1',
    user_id: 'user_001',
    user_name: 'João Silva',
    type: 'credit',
    amount: 500.00,
    currency: 'USD',
    reason: 'Compensação por erro do sistema',
    description: 'Crédito referente a falha no processamento de operação',
    status: 'approved',
    created_by: 'admin_001',
    created_at: '2024-07-25T08:30:00Z',
    approved_by: 'supervisor_001',
    approved_at: '2024-07-25T09:15:00Z',
    processed_at: '2024-07-25T09:16:00Z',
    reference_id: 'ADJ-2024-001',
    category: 'compensation',
    requires_approval: true,
    approval_notes: 'Aprovado conforme política de compensação'
  },
  {
    id: '2',
    user_id: 'user_002',
    user_name: 'Maria Santos',
    type: 'debit',
    amount: 200.00,
    currency: 'USD',
    reason: 'Ajuste de comissão',
    description: 'Desconto de comissão calculada incorretamente',
    status: 'pending',
    created_by: 'admin_002',
    created_at: '2024-07-25T10:00:00Z',
    approved_by: null,
    approved_at: null,
    processed_at: null,
    reference_id: 'ADJ-2024-002',
    category: 'commission',
    requires_approval: true,
    approval_notes: null
  },
  {
    id: '3',
    user_id: 'user_003',
    user_name: 'Carlos Lima',
    type: 'bonus',
    amount: 100.00,
    currency: 'USD',
    reason: 'Bônus de fidelidade',
    description: 'Bônus por 6 meses de conta ativa',
    status: 'approved',
    created_by: 'system',
    created_at: '2024-07-25T07:00:00Z',
    approved_by: 'auto_approved',
    approved_at: '2024-07-25T07:00:30Z',
    processed_at: '2024-07-25T07:01:00Z',
    reference_id: 'ADJ-2024-003',
    category: 'loyalty',
    requires_approval: false,
    approval_notes: 'Aprovação automática para bônus de fidelidade'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { status, type, category, user_id } = query;
        let filteredAdjustments = [...adjustments];

        if (status && status !== 'all') {
          filteredAdjustments = filteredAdjustments.filter(adj => adj.status === status);
        }
        if (type && type !== 'all') {
          filteredAdjustments = filteredAdjustments.filter(adj => adj.type === type);
        }
        if (category && category !== 'all') {
          filteredAdjustments = filteredAdjustments.filter(adj => adj.category === category);
        }
        if (user_id) {
          filteredAdjustments = filteredAdjustments.filter(adj => adj.user_id === user_id);
        }

        const stats = {
          total: adjustments.length,
          pending: adjustments.filter(a => a.status === 'pending').length,
          approved: adjustments.filter(a => a.status === 'approved').length,
          rejected: adjustments.filter(a => a.status === 'rejected').length,
          total_credits: adjustments.filter(a => a.type === 'credit').reduce((sum, a) => sum + a.amount, 0),
          total_debits: adjustments.filter(a => a.type === 'debit').reduce((sum, a) => sum + a.amount, 0),
          total_bonuses: adjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0),
          net_amount: adjustments.reduce((sum, a) => {
            if (a.status === 'approved') {
              return a.type === 'debit' ? sum - a.amount : sum + a.amount;
            }
            return sum;
          }, 0)
        };

        res.status(200).json({
          success: true,
          adjustments: filteredAdjustments,
          stats,
          timestamp: new Date().toISOString()
        });
        break;

      case 'POST':
        const newAdjustment = {
          id: String(adjustments.length + 1),
          ...req.body,
          created_at: new Date().toISOString(),
          reference_id: `ADJ-2024-${String(adjustments.length + 1).padStart(3, '0')}`,
          status: req.body.requires_approval ? 'pending' : 'approved'
        };
        adjustments.push(newAdjustment);
        res.status(201).json({ success: true, adjustment: newAdjustment });
        break;

      case 'PUT':
        const { id } = query;
        const adjIndex = adjustments.findIndex(a => a.id === id);
        if (adjIndex === -1) {
          return res.status(404).json({ success: false, message: 'Ajuste não encontrado' });
        }
        
        const updatedData = { ...req.body };
        if (updatedData.status === 'approved' && !adjustments[adjIndex].approved_at) {
          updatedData.approved_at = new Date().toISOString();
          updatedData.processed_at = new Date().toISOString();
        }
        
        adjustments[adjIndex] = { ...adjustments[adjIndex], ...updatedData };
        res.status(200).json({ success: true, adjustment: adjustments[adjIndex] });
        break;

      case 'DELETE':
        const { id: deleteId } = query;
        const deleteIndex = adjustments.findIndex(a => a.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({ success: false, message: 'Ajuste não encontrado' });
        }
        adjustments.splice(deleteIndex, 1);
        res.status(200).json({ success: true, message: 'Ajuste removido com sucesso' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de ajustes:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
