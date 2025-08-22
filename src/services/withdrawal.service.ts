// ========================================
// MARKETBOT - WITHDRAWAL SERVICE - IMPLEMENTAÇÃO COMPLETA
// Sistema completo de saques e retiradas
// ========================================

import { Pool, PoolClient } from 'pg';
import { DatabaseService } from './database.service';

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  currency: 'BRL' | 'USD';
  bank_account: BankAccount;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  requested_at: Date;
  processed_at?: Date;
  completed_at?: Date;
  rejection_reason?: string;
  admin_notes?: string;
  transaction_fee: number;
  final_amount: number;
  pix_key?: string;
  bank_receipt_url?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface BankAccount {
  account_type: 'PIX' | 'BANK_TRANSFER' | 'INTERNATIONAL';
  pix_key?: string;
  bank_code?: string;
  agency?: string;
  account_number?: string;
  account_holder_name?: string;
  document_number?: string;
  iban?: string; // Para contas internacionais
  swift_code?: string; // Para contas internacionais
}

export interface CreateWithdrawalDTO {
  user_id: number;
  amount: number;
  currency: 'BRL' | 'USD';
  bank_account: BankAccount;
  ip_address?: string;
  user_agent?: string;
}

export interface WithdrawalValidationResult {
  valid: boolean;
  error?: string;
  minimum_amount?: number;
  maximum_amount?: number;
  available_balance?: number;
  next_withdrawal_date?: Date;
}

export interface WithdrawalStats {
  total_requested: number;
  total_approved: number;
  total_completed: number;
  total_rejected: number;
  total_amount_brl: number;
  total_amount_usd: number;
  average_processing_time_hours: number;
}

export class WithdrawalService {
  private static instance: WithdrawalService;
  private db: Pool;
  
  // Configurações de saque
  private readonly MIN_WITHDRAWAL_BRL = 50;
  private readonly MIN_WITHDRAWAL_USD = 10;
  private readonly WITHDRAWAL_FEE_BRL = 10;
  private readonly WITHDRAWAL_FEE_USD = 2;
  private readonly WITHDRAWAL_DAYS = [5, 20]; // Dias 5 e 20 de cada mês
  private readonly MAX_DAILY_WITHDRAWALS = 3;
  private readonly MAX_MONTHLY_AMOUNT_BRL = 50000;
  private readonly MAX_MONTHLY_AMOUNT_USD = 10000;

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
  }

  static getInstance(): WithdrawalService {
    if (!WithdrawalService.instance) {
      WithdrawalService.instance = new WithdrawalService();
    }
    return WithdrawalService.instance;
  }

  // ========================================
  // VALIDAÇÃO DE SAQUES
  // ========================================

  async validateWithdrawal(userId: number, amount: number, currency: 'BRL' | 'USD'): Promise<WithdrawalValidationResult> {
    const client = await this.db.connect();
    
    try {
      // 1. Verificar valor mínimo
      const minAmount = currency === 'BRL' ? this.MIN_WITHDRAWAL_BRL : this.MIN_WITHDRAWAL_USD;
      if (amount < minAmount) {
        return {
          valid: false,
          error: `Valor mínimo de saque: ${currency} ${minAmount}`,
          minimum_amount: minAmount
        };
      }

      // 2. Verificar saldo disponível
      const balanceResult = await client.query(`
        SELECT 
          COALESCE(balance_brl_real, 0) + COALESCE(balance_brl_commission, 0) as total_brl,
          COALESCE(balance_usd_real, 0) + COALESCE(balance_usd_commission, 0) as total_usd
        FROM users WHERE id = $1
      `, [userId]);

      if (balanceResult.rows.length === 0) {
        return { valid: false, error: 'Usuário não encontrado' };
      }

      const balances = balanceResult.rows[0];
      const availableBalance = currency === 'BRL' ? balances.total_brl : balances.total_usd;
      const fee = currency === 'BRL' ? this.WITHDRAWAL_FEE_BRL : this.WITHDRAWAL_FEE_USD;
      const totalRequired = amount + fee;

      if (availableBalance < totalRequired) {
        return {
          valid: false,
          error: `Saldo insuficiente. Disponível: ${currency} ${availableBalance}, Necessário: ${currency} ${totalRequired} (incl. taxa ${currency} ${fee})`,
          available_balance: availableBalance
        };
      }

      // 3. Verificar data de saque (somente dias 5 e 20)
      const today = new Date();
      const currentDay = today.getDate();
      if (!this.WITHDRAWAL_DAYS.includes(currentDay)) {
        const nextWithdrawalDate = this.getNextWithdrawalDate();
        return {
          valid: false,
          error: `Saques permitidos apenas nos dias 5 e 20. Próxima data: ${nextWithdrawalDate.toLocaleDateString('pt-BR')}`,
          next_withdrawal_date: nextWithdrawalDate
        };
      }

      // 4. Verificar limite diário
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dailyCount = await client.query(`
        SELECT COUNT(*) as count 
        FROM withdrawal_requests 
        WHERE user_id = $1 
        AND requested_at >= $2 
        AND status NOT IN ('REJECTED', 'CANCELLED')
      `, [userId, todayStart]);

      if (parseInt(dailyCount.rows[0].count) >= this.MAX_DAILY_WITHDRAWALS) {
        return {
          valid: false,
          error: `Limite diário de ${this.MAX_DAILY_WITHDRAWALS} saques atingido`
        };
      }

      // 5. Verificar limite mensal
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyAmount = await client.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM withdrawal_requests 
        WHERE user_id = $1 
        AND currency = $2
        AND requested_at >= $3 
        AND status IN ('APPROVED', 'PROCESSING', 'COMPLETED')
      `, [userId, currency, monthStart]);

      const currentMonthlyTotal = parseFloat(monthlyAmount.rows[0].total);
      const maxMonthly = currency === 'BRL' ? this.MAX_MONTHLY_AMOUNT_BRL : this.MAX_MONTHLY_AMOUNT_USD;
      
      if (currentMonthlyTotal + amount > maxMonthly) {
        return {
          valid: false,
          error: `Limite mensal de ${currency} ${maxMonthly} seria excedido. Usado: ${currency} ${currentMonthlyTotal}`,
          maximum_amount: maxMonthly - currentMonthlyTotal
        };
      }

      return { valid: true, available_balance: availableBalance };

    } catch (error) {
      console.error('❌ Erro na validação de saque:', error);
      return { valid: false, error: 'Erro interno na validação' };
    } finally {
      client.release();
    }
  }

  // ========================================
  // CRIAÇÃO DE SOLICITAÇÕES DE SAQUE
  // ========================================

  async createWithdrawalRequest(withdrawalData: CreateWithdrawalDTO): Promise<WithdrawalRequest> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validar saque
      const validation = await this.validateWithdrawal(
        withdrawalData.user_id, 
        withdrawalData.amount, 
        withdrawalData.currency
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Calcular taxa e valor final
      const fee = withdrawalData.currency === 'BRL' ? this.WITHDRAWAL_FEE_BRL : this.WITHDRAWAL_FEE_USD;
      const finalAmount = withdrawalData.amount - fee;

      // Inserir solicitação de saque
      const insertQuery = `
        INSERT INTO withdrawal_requests (
          user_id, amount, currency, bank_account, transaction_fee, 
          final_amount, ip_address, user_agent, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        withdrawalData.user_id,
        withdrawalData.amount,
        withdrawalData.currency,
        JSON.stringify(withdrawalData.bank_account),
        fee,
        finalAmount,
        withdrawalData.ip_address,
        withdrawalData.user_agent
      ]);

      // Reservar saldo (criar transação de reserva)
      await client.query(`
        UPDATE users SET 
          ${withdrawalData.currency === 'BRL' ? 'balance_brl_real' : 'balance_usd_real'} = 
          ${withdrawalData.currency === 'BRL' ? 'balance_brl_real' : 'balance_usd_real'} - $1
        WHERE id = $2
      `, [withdrawalData.amount + fee, withdrawalData.user_id]);

      // Registrar transação
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, reference_id
        ) VALUES ($1, 'WITHDRAWAL_RESERVE', $2, $3, 'COMPLETED', 'Reserva para saque', $4)
      `, [
        withdrawalData.user_id,
        -(withdrawalData.amount + fee),
        withdrawalData.currency,
        result.rows[0].id
      ]);

      await client.query('COMMIT');

      console.log(`✅ Solicitação de saque criada: ID ${result.rows[0].id} - ${withdrawalData.currency} ${withdrawalData.amount}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao criar solicitação de saque:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // APROVAÇÃO E PROCESSAMENTO
  // ========================================

  async approveWithdrawal(withdrawalId: number, adminNotes?: string): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        UPDATE withdrawal_requests 
        SET status = 'APPROVED', processed_at = NOW(), admin_notes = $1
        WHERE id = $2 AND status = 'PENDING'
        RETURNING *
      `, [adminNotes, withdrawalId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const withdrawal = result.rows[0];

      // Registrar aprovação
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, reference_id
        ) VALUES ($1, 'WITHDRAWAL_APPROVED', $2, $3, 'COMPLETED', 'Saque aprovado', $4)
      `, [withdrawal.user_id, 0, withdrawal.currency, withdrawalId]);

      await client.query('COMMIT');

      console.log(`✅ Saque aprovado: ID ${withdrawalId}`);
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao aprovar saque:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async rejectWithdrawal(withdrawalId: number, rejectionReason: string): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        UPDATE withdrawal_requests 
        SET status = 'REJECTED', processed_at = NOW(), rejection_reason = $1
        WHERE id = $2 AND status = 'PENDING'
        RETURNING *
      `, [rejectionReason, withdrawalId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const withdrawal = result.rows[0];

      // Devolver saldo ao usuário
      await client.query(`
        UPDATE users SET 
          ${withdrawal.currency === 'BRL' ? 'balance_brl_real' : 'balance_usd_real'} = 
          ${withdrawal.currency === 'BRL' ? 'balance_brl_real' : 'balance_usd_real'} + $1
        WHERE id = $2
      `, [withdrawal.amount + withdrawal.transaction_fee, withdrawal.user_id]);

      // Registrar estorno
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, reference_id
        ) VALUES ($1, 'WITHDRAWAL_REJECTED', $2, $3, 'COMPLETED', 'Estorno de saque rejeitado', $4)
      `, [
        withdrawal.user_id,
        withdrawal.amount + withdrawal.transaction_fee,
        withdrawal.currency,
        withdrawalId
      ]);

      await client.query('COMMIT');

      console.log(`✅ Saque rejeitado e estornado: ID ${withdrawalId}`);
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao rejeitar saque:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async completeWithdrawal(withdrawalId: number, bankReceiptUrl?: string): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        UPDATE withdrawal_requests 
        SET status = 'COMPLETED', completed_at = NOW(), bank_receipt_url = $1
        WHERE id = $2 AND status IN ('APPROVED', 'PROCESSING')
        RETURNING *
      `, [bankReceiptUrl, withdrawalId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const withdrawal = result.rows[0];

      // Registrar conclusão
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, reference_id
        ) VALUES ($1, 'WITHDRAWAL_COMPLETED', $2, $3, 'COMPLETED', 'Saque processado com sucesso', $4)
      `, [withdrawal.user_id, -withdrawal.final_amount, withdrawal.currency, withdrawalId]);

      await client.query('COMMIT');

      console.log(`✅ Saque concluído: ID ${withdrawalId}`);
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao concluir saque:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // ========================================
  // CONSULTAS E RELATÓRIOS
  // ========================================

  async getWithdrawalById(id: number): Promise<WithdrawalRequest | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM withdrawal_requests WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar saque:', error);
      return null;
    }
  }

  async getUserWithdrawals(userId: number, limit = 50, offset = 0): Promise<WithdrawalRequest[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM withdrawal_requests 
        WHERE user_id = $1 
        ORDER BY requested_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar saques do usuário:', error);
      return [];
    }
  }

  async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
    try {
      const result = await this.db.query(`
        SELECT wr.*, u.email, u.full_name 
        FROM withdrawal_requests wr
        JOIN users u ON wr.user_id = u.id
        WHERE wr.status = 'PENDING'
        ORDER BY wr.requested_at ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar saques pendentes:', error);
      return [];
    }
  }

  async getWithdrawalStats(startDate?: Date, endDate?: Date): Promise<WithdrawalStats> {
    try {
      const whereClause = startDate && endDate ? 
        'WHERE requested_at BETWEEN $1 AND $2' : '';
      const params = startDate && endDate ? [startDate, endDate] : [];

      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_requested,
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as total_approved,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as total_completed,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as total_rejected,
          COALESCE(SUM(CASE WHEN currency = 'BRL' THEN amount ELSE 0 END), 0) as total_amount_brl,
          COALESCE(SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END), 0) as total_amount_usd,
          COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - requested_at))/3600), 0) as average_processing_time_hours
        FROM withdrawal_requests 
        ${whereClause}
      `, params);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de saque:', error);
      return {
        total_requested: 0,
        total_approved: 0,
        total_completed: 0,
        total_rejected: 0,
        total_amount_brl: 0,
        total_amount_usd: 0,
        average_processing_time_hours: 0
      };
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  private getNextWithdrawalDate(): Date {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Se ainda não passou do dia 5 deste mês
    if (currentDay < 5) {
      return new Date(currentYear, currentMonth, 5);
    }
    // Se ainda não passou do dia 20 deste mês
    else if (currentDay < 20) {
      return new Date(currentYear, currentMonth, 20);
    }
    // Próximo dia 5 do mês seguinte
    else {
      return new Date(currentYear, currentMonth + 1, 5);
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Cancelar saques pendentes muito antigos (>30 dias)
      const result = await this.db.query(`
        UPDATE withdrawal_requests 
        SET status = 'CANCELLED', rejection_reason = 'Cancelado automaticamente por inatividade'
        WHERE status = 'PENDING' 
        AND requested_at < NOW() - INTERVAL '30 days'
        RETURNING id, user_id, amount, currency, transaction_fee
      `);

      // Devolver saldo dos saques cancelados
      for (const withdrawal of result.rows) {
        await this.db.query(`
          UPDATE users SET 
            ${withdrawal.currency === 'BRL' ? 'balance_brl_real' : 'balance_usd_real'} = 
            ${withdrawal.currency === 'BRL' ? 'balance_brl_real' : 'balance_usd_real'} + $1
          WHERE id = $2
        `, [withdrawal.amount + withdrawal.transaction_fee, withdrawal.user_id]);
      }

      if (result.rows.length > 0) {
        console.log(`🧹 ${result.rows.length} saques antigos cancelados automaticamente`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de saques:', error);
    }
  }
}

export default WithdrawalService;
