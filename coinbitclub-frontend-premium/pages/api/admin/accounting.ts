// API para contabilidade e relatórios financeiros
import { NextApiRequest, NextApiResponse } from 'next';

const transactions = [
  {
    id: '1',
    type: 'revenue',
    category: 'subscription',
    amount: 2500.00,
    currency: 'USD',
    description: 'Assinatura Premium - João Silva',
    date: '2024-07-25T08:30:00Z',
    user_id: 'user_001',
    status: 'completed',
    payment_method: 'credit_card',
    reference_id: 'SUB-2024-001'
  },
  {
    id: '2',
    type: 'expense',
    category: 'infrastructure',
    amount: 450.00,
    currency: 'USD',
    description: 'Servidor AWS - Julho 2024',
    date: '2024-07-25T09:00:00Z',
    user_id: null,
    status: 'completed',
    payment_method: 'bank_transfer',
    reference_id: 'EXP-2024-001'
  },
  {
    id: '3',
    type: 'commission',
    category: 'affiliate',
    amount: 125.00,
    currency: 'USD',
    description: 'Comissão afiliado - Maria Santos',
    date: '2024-07-25T10:15:00Z',
    user_id: 'affiliate_001',
    status: 'pending',
    payment_method: 'wallet',
    reference_id: 'COM-2024-001'
  }
];

const accountingSummary = {
  daily: {
    revenue: 3750.00,
    expenses: 890.00,
    profit: 2860.00,
    commission_paid: 245.00,
    active_subscriptions: 1247,
    new_subscriptions: 23,
    cancelled_subscriptions: 5
  },
  monthly: {
    revenue: 125430.00,
    expenses: 23780.00,
    profit: 101650.00,
    commission_paid: 8967.00,
    active_subscriptions: 1247,
    new_subscriptions: 342,
    cancelled_subscriptions: 78
  },
  yearly: {
    revenue: 1456780.00,
    expenses: 298450.00,
    profit: 1158330.00,
    commission_paid: 102345.00,
    active_subscriptions: 1247,
    new_subscriptions: 2834,
    cancelled_subscriptions: 456
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { period, type, category, start_date, end_date } = query;

        if (query.summary === 'true') {
          // Retorna resumo contábil
          const requestedPeriod = period || 'daily';
          res.status(200).json({
            success: true,
            summary: accountingSummary[requestedPeriod as keyof typeof accountingSummary],
            period: requestedPeriod,
            timestamp: new Date().toISOString()
          });
          return;
        }

        // Filtrar transações
        let filteredTransactions = [...transactions];

        if (type && type !== 'all') {
          filteredTransactions = filteredTransactions.filter(t => t.type === type);
        }
        if (category && category !== 'all') {
          filteredTransactions = filteredTransactions.filter(t => t.category === category);
        }
        if (start_date) {
          filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.date) >= new Date(start_date as string)
          );
        }
        if (end_date) {
          filteredTransactions = filteredTransactions.filter(t => 
            new Date(t.date) <= new Date(end_date as string)
          );
        }

        const stats = {
          total_transactions: filteredTransactions.length,
          total_revenue: filteredTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0),
          total_expenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
          total_commissions: filteredTransactions.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0),
          net_profit: filteredTransactions.reduce((sum, t) => {
            return t.type === 'revenue' ? sum + t.amount : sum - t.amount;
          }, 0),
          pending_transactions: filteredTransactions.filter(t => t.status === 'pending').length
        };

        res.status(200).json({
          success: true,
          transactions: filteredTransactions,
          stats,
          timestamp: new Date().toISOString()
        });
        break;

      case 'POST':
        const newTransaction = {
          id: String(transactions.length + 1),
          ...req.body,
          date: new Date().toISOString(),
          status: 'completed',
          reference_id: `TXN-2024-${String(transactions.length + 1).padStart(3, '0')}`
        };
        transactions.push(newTransaction);
        res.status(201).json({ success: true, transaction: newTransaction });
        break;

      case 'PUT':
        const { id } = query;
        const txnIndex = transactions.findIndex(t => t.id === id);
        if (txnIndex === -1) {
          return res.status(404).json({ success: false, message: 'Transação não encontrada' });
        }
        transactions[txnIndex] = { ...transactions[txnIndex], ...req.body };
        res.status(200).json({ success: true, transaction: transactions[txnIndex] });
        break;

      case 'DELETE':
        const { id: deleteId } = query;
        const deleteIndex = transactions.findIndex(t => t.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({ success: false, message: 'Transação não encontrada' });
        }
        transactions.splice(deleteIndex, 1);
        res.status(200).json({ success: true, message: 'Transação removida com sucesso' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de contabilidade:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
