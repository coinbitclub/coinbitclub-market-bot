import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '../../../src/lib/jwt';
import { query } from '../../../src/lib/database';
import { 
  PLANS, 
  getPlansByRegion, 
  getPlanById, 
  validateMinimumBalance,
  calculateCommission,
  formatPrice,
  getPlanPrice
} from '../../../src/lib/plans';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = authenticateRequest(req);

    if (req.method === 'GET') {
      await handleGetPlans(req, res, user.userId);
    } else if (req.method === 'POST') {
      await handlePlanAction(req, res, user.userId);
    } else {
      return res.status(405).json({ message: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de planos:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor' 
    });
  }
}

async function handleGetPlans(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // Buscar dados do usuário
  const userResult = await query(`
    SELECT 
      u.id, u.country, u.plan_type,
      ub.prepaid_balance, ub.trading_balance,
      s.status as subscription_status, s.ends_at as subscription_ends_at,
      s.plan_type as current_plan_type
    FROM users u
    LEFT JOIN user_balances ub ON u.id = ub.user_id
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.id = $1
  `, [userId]);

  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const userData = userResult.rows[0];
  
  // Determinar região baseada no país
  const region = userData.country === 'BR' || userData.country === 'Brazil' ? 'brazil' : 'international';
  const availablePlans = getPlansByRegion(region);

  // Buscar histórico de saques de saldo pré-pago
  const withdrawalsResult = await query(`
    SELECT 
      amount, status, requested_at, processed_at, 
      rejection_reason, admin_notes
    FROM prepaid_withdrawals
    WHERE user_id = $1
    ORDER BY requested_at DESC
    LIMIT 10
  `, [userId]);

  // Verificar se pode solicitar saque (20 dias desde último pedido)
  const lastWithdrawalResult = await query(`
    SELECT requested_at
    FROM prepaid_withdrawals
    WHERE user_id = $1 AND status IN ('pending', 'approved')
    ORDER BY requested_at DESC
    LIMIT 1
  `, [userId]);

  const canRequestWithdrawal = lastWithdrawalResult.rows.length === 0 ||
    (new Date().getTime() - new Date(lastWithdrawalResult.rows[0].requested_at).getTime()) 
    >= (20 * 24 * 60 * 60 * 1000);

  const plansData = {
    currentPlan: {
      type: userData.current_plan_type || userData.plan_type,
      status: userData.subscription_status,
      endsAt: userData.subscription_ends_at,
      prepaidBalance: parseFloat(userData.prepaid_balance || 0),
      tradingBalance: parseFloat(userData.trading_balance || 0)
    },
    availablePlans: availablePlans.map(plan => ({
      ...plan,
      formattedPrice: formatPrice(plan.monthlyPrice, plan.currency),
      canAfford: validateMinimumBalance(parseFloat(userData.trading_balance || 0), plan.id),
      commissionExample: calculateCommission(100, plan.id) // Exemplo com R$100 de lucro
    })),
    prepaidAccount: {
      currentBalance: parseFloat(userData.prepaid_balance || 0),
      canRequestWithdrawal,
      minWithdrawalAmount: 50, // Valor mínimo para saque
      withdrawalHistory: withdrawalsResult.rows.map(w => ({
        amount: parseFloat(w.amount),
        status: w.status,
        requestedAt: w.requested_at,
        processedAt: w.processed_at,
        rejectionReason: w.rejection_reason,
        adminNotes: w.admin_notes
      }))
    }
  };

  res.status(200).json(plansData);
}

async function handlePlanAction(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { action, data } = req.body;

  if (!action) {
    return res.status(400).json({ message: 'Ação é obrigatória' });
  }

  try {
    switch (action) {
      case 'add_prepaid_balance':
        await addPrepaidBalance(userId, data);
        break;
      
      case 'request_withdrawal':
        await requestWithdrawal(userId, data);
        break;
      
      case 'upgrade_plan':
        await upgradePlan(userId, data);
        break;
      
      default:
        throw new Error('Ação inválida');
    }

    res.status(200).json({ 
      message: 'Ação executada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao executar ação do plano:', error);
    res.status(400).json({ 
      message: error.message || 'Erro ao executar ação' 
    });
  }
}

async function addPrepaidBalance(userId: string, data: any) {
  const { amount, paymentMethod } = data;

  if (!amount || amount <= 0) {
    throw new Error('Valor inválido para adição de saldo');
  }

  if (amount < 10) {
    throw new Error('Valor mínimo para adição de saldo é $10 USD');
  }

  await query('BEGIN');

  try {
    // Criar registro de pagamento
    const paymentResult = await query(`
      INSERT INTO payments 
      (user_id, amount, currency, payment_method, type, status, stripe_payment_intent_id)
      VALUES ($1, $2, 'USD', $3, 'prepaid_balance', 'pending', $4)
      RETURNING id
    `, [userId, amount, paymentMethod, `prepaid_${Date.now()}`]);

    const paymentId = paymentResult.rows[0].id;

    // Em um cenário real, aqui seria integrado com Stripe/PayPal
    // Por enquanto, vamos simular a aprovação automática para desenvolvimento
    
    // Atualizar status do pagamento
    await query(`
      UPDATE payments 
      SET status = 'completed', processed_at = NOW()
      WHERE id = $1
    `, [paymentId]);

    // Adicionar saldo pré-pago
    await query(`
      INSERT INTO user_balances (user_id, prepaid_balance, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        prepaid_balance = user_balances.prepaid_balance + $2,
        updated_at = NOW()
    `, [userId, amount]);

    await query('COMMIT');

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, 'PREPAID_BALANCE_ADDED', 'user_balances', $2, $3)`,
      [userId, userId, JSON.stringify({ amount, paymentId })]
    );

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

async function requestWithdrawal(userId: string, data: any) {
  const { amount } = data;

  if (!amount || amount <= 0) {
    throw new Error('Valor inválido para saque');
  }

  if (amount < 50) {
    throw new Error('Valor mínimo para saque é $50 USD');
  }

  // Verificar se o usuário tem CPF cadastrado
  const userResult = await query(`
    SELECT cpf, bank_name, bank_branch, bank_account, 
           ub.prepaid_balance
    FROM users u
    LEFT JOIN user_balances ub ON u.id = ub.user_id
    WHERE u.id = $1
  `, [userId]);

  const userData = userResult.rows[0];

  if (!userData.cpf) {
    throw new Error('CPF é obrigatório para solicitar saque. Atualize suas configurações.');
  }

  if (!userData.bank_name || !userData.bank_branch || !userData.bank_account) {
    throw new Error('Dados bancários são obrigatórios para solicitar saque. Atualize suas configurações.');
  }

  const currentBalance = parseFloat(userData.prepaid_balance || 0);
  if (currentBalance < amount) {
    throw new Error('Saldo insuficiente para saque');
  }

  // Verificar último pedido de saque
  const lastWithdrawalResult = await query(`
    SELECT requested_at
    FROM prepaid_withdrawals
    WHERE user_id = $1 AND status IN ('pending', 'approved')
    ORDER BY requested_at DESC
    LIMIT 1
  `, [userId]);

  if (lastWithdrawalResult.rows.length > 0) {
    const daysSinceLastRequest = (new Date().getTime() - new Date(lastWithdrawalResult.rows[0].requested_at).getTime()) 
      / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastRequest < 20) {
      throw new Error(`Você só pode solicitar saque a cada 20 dias. Próximo saque disponível em ${Math.ceil(20 - daysSinceLastRequest)} dias.`);
    }
  }

  await query('BEGIN');

  try {
    // Criar solicitação de saque
    await query(`
      INSERT INTO prepaid_withdrawals 
      (user_id, amount, status, requested_at, bank_details)
      VALUES ($1, $2, 'pending', NOW(), $3)
    `, [
      userId, 
      amount,
      JSON.stringify({
        bankName: userData.bank_name,
        bankBranch: userData.bank_branch,
        bankAccount: userData.bank_account
      })
    ]);

    // Deduzir do saldo (freezar o valor)
    await query(`
      UPDATE user_balances 
      SET prepaid_balance = prepaid_balance - $1, updated_at = NOW()
      WHERE user_id = $2
    `, [amount, userId]);

    await query('COMMIT');

    // Log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, 'WITHDRAWAL_REQUESTED', 'prepaid_withdrawals', $2, $3)`,
      [userId, userId, JSON.stringify({ amount })]
    );

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

async function upgradePlan(userId: string, data: any) {
  const { planId } = data;

  if (!planId) {
    throw new Error('ID do plano é obrigatório');
  }

  const plan = PLANS.find(p => p.id === planId);
  if (!plan) {
    throw new Error('Plano não encontrado');
  }

  // Buscar dados do usuário
  const userResult = await query(`
    SELECT country FROM users WHERE id = $1
  `, [userId]);

  if (userResult.rows.length === 0) {
    throw new Error('Usuário não encontrado');
  }

  const pricing = getPlanPrice(planId, userResult.rows[0].country);

  if (plan.type === 'monthly' && pricing.amount > 0) {
    // Para planos mensais, criar checkout do Stripe
    // Esta funcionalidade já existe na API de checkout
    throw new Error('Use a API de checkout para planos mensais pagos');
  }

  // Para plano pré-pago, apenas atualizar o tipo do plano
  await query(`
    UPDATE users 
    SET plan_type = $1, updated_at = NOW()
    WHERE id = $2
  `, [planId, userId]);

  // Log de auditoria
  await query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
     VALUES ($1, 'PLAN_CHANGED', 'users', $2, $3)`,
    [userId, userId, JSON.stringify({ newPlan: planId })]
  );
}
