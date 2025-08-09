import { NextApiRequest, NextApiResponse } from 'next';

interface AddBalanceRequest {
  userId: string;
  amount: number;
  type: 'manual_credit' | 'manual_debit';
  description: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, amount, type, description }: AddBalanceRequest = req.body;

    // Validações básicas
    if (!userId || !amount || !type || !description) {
      return res.status(400).json({ 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'O valor deve ser maior que zero' 
      });
    }

    // Simulação - Em produção, conectar com banco de dados
    const adjustment = {
      id: `adj_${Date.now()}`,
      user_id: userId,
      amount: type === 'manual_debit' ? -amount : amount,
      type: type,
      description: description,
      status: 'approved',
      is_withdrawable: false, // Créditos manuais não podem ser sacados
      created_at: new Date().toISOString(),
      processed_by: 'admin', // Em produção, pegar do token de autenticação
      processed_at: new Date().toISOString()
    };

    // TODO: Implementar as seguintes operações no banco de dados:
    // 1. Inserir registro na tabela de ajustes/transações
    // 2. Atualizar saldo do usuário
    // 3. Registrar log de auditoria
    // 4. Enviar notificação para o usuário (opcional)

    console.log('Ajuste de saldo criado:', adjustment);

    return res.status(200).json({
      success: true,
      message: 'Saldo ajustado com sucesso',
      adjustment: adjustment
    });

  } catch (error) {
    console.error('Erro ao processar ajuste de saldo:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}
