// ========================================
// MARKETBOT - COMMISSION SERVICE - IMPLEMENTAÇÃO COMPLETA
// Sistema de comissionamento automático e distribuição
// ========================================

import { Pool, PoolClient } from 'pg';
import { DatabaseService } from './database.service';

export interface CommissionCalculation {
  user_id: number;
  position_id: number;
  trading_profit_usd: number;
  company_commission_rate: number;
  company_commission_usd: number;
  affiliate_commission_rate: number;
  affiliate_commission_usd: number;
  affiliate_id?: number;
  conversion_rate_usd_brl: number;
  company_commission_brl: number;
  affiliate_commission_brl: number;
  calculation_date: Date;
}

export interface CommissionPayment {
  id: number;
  recipient_id: number;
  recipient_type: 'COMPANY' | 'AFFILIATE';
  amount_usd: number;
  amount_brl: number;
  source_position_id: number;
  conversion_rate: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paid_at?: Date;
  created_at: Date;
}

export interface AffiliateTier {
  tier: 'NORMAL' | 'VIP';
  commission_rate: number;
  min_monthly_volume: number;
  benefits: string[];
}

export interface CommissionStats {
  total_positions_processed: number;
  total_profit_generated_usd: number;
  total_company_commission_usd: number;
  total_affiliate_commission_usd: number;
  total_company_commission_brl: number;
  total_affiliate_commission_brl: number;
  average_commission_per_position: number;
  top_affiliates: any[];
}

export class CommissionService {
  private static instance: CommissionService;
  private db: Pool;

  // Configurações de comissão
  private readonly COMPANY_COMMISSION_RATES = {
    MONTHLY: 0.10,    // 10% sobre lucro para planos mensais
    PREPAID: 0.20     // 20% sobre lucro para planos pré-pagos
  };

  private readonly AFFILIATE_TIERS: Record<string, AffiliateTier> = {
    NORMAL: {
      tier: 'NORMAL',
      commission_rate: 0.015, // 1.5% da comissão da empresa
      min_monthly_volume: 0,
      benefits: ['Comissão básica', 'Dashboard básico']
    },
    VIP: {
      tier: 'VIP',
      commission_rate: 0.05,  // 5% da comissão da empresa
      min_monthly_volume: 10000, // $10k USD volume mensal
      benefits: ['Comissão VIP', 'Dashboard avançado', 'Suporte prioritário']
    }
  };

  constructor() {
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
  }

  static getInstance(): CommissionService {
    if (!CommissionService.instance) {
      CommissionService.instance = new CommissionService();
    }
    return CommissionService.instance;
  }

  // ========================================
  // CÁLCULO AUTOMÁTICO DE COMISSÕES
  // ========================================

  async processPositionCommission(positionId: number): Promise<CommissionCalculation | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar dados da posição fechada
      const positionResult = await client.query(`
        SELECT 
          tp.id,
          tp.user_id,
          tp.symbol,
          tp.side,
          tp.quantity,
          tp.entry_price,
          tp.exit_price,
          tp.profit_loss,
          tp.realized_pnl,
          tp.status,
          tp.closed_at,
          u.user_type,
          u.subscription_plan,
          a.id as affiliate_id,
          a.tier as affiliate_tier
        FROM trading_positions tp
        JOIN users u ON tp.user_id = u.id
        LEFT JOIN referrals r ON u.id = r.referred_user_id
        LEFT JOIN affiliates a ON r.affiliate_id = a.id
        WHERE tp.id = $1 AND tp.status = 'CLOSED' AND tp.profit_loss > 0
      `, [positionId]);

      if (positionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null; // Posição não encontrada ou sem lucro
      }

      const position = positionResult.rows[0];
      const tradingProfitUSD = Math.abs(position.profit_loss);

      // Verificar se já foi processada
      const existingCommission = await client.query(
        'SELECT id FROM commission_payments WHERE source_position_id = $1',
        [positionId]
      );

      if (existingCommission.rows.length > 0) {
        await client.query('ROLLBACK');
        console.log(`⚠️ Comissão já processada para posição ${positionId}`);
        return null;
      }

      // Determinar taxa de comissão da empresa
      const companyRate = position.subscription_plan === 'MONTHLY' ? 
        this.COMPANY_COMMISSION_RATES.MONTHLY : 
        this.COMPANY_COMMISSION_RATES.PREPAID;

      // Calcular comissão da empresa
      const companyCommissionUSD = tradingProfitUSD * companyRate;

      // Calcular comissão do afiliado (se houver)
      let affiliateCommissionUSD = 0;
      let affiliateRate = 0;

      if (position.affiliate_id) {
        const tier = this.AFFILIATE_TIERS[position.affiliate_tier] || this.AFFILIATE_TIERS.NORMAL;
        affiliateRate = tier.commission_rate;
        affiliateCommissionUSD = companyCommissionUSD * affiliateRate;
      }

      // Buscar taxa de conversão USD→BRL
      const conversionRate = await this.getUSDToBRLRate();

      // Converter para BRL
      const companyCommissionBRL = companyCommissionUSD * conversionRate;
      const affiliateCommissionBRL = affiliateCommissionUSD * conversionRate;

      // Criar cálculo de comissão
      const calculation: CommissionCalculation = {
        user_id: position.user_id,
        position_id: positionId,
        trading_profit_usd: tradingProfitUSD,
        company_commission_rate: companyRate,
        company_commission_usd: companyCommissionUSD,
        affiliate_commission_rate: affiliateRate,
        affiliate_commission_usd: affiliateCommissionUSD,
        affiliate_id: position.affiliate_id,
        conversion_rate_usd_brl: conversionRate,
        company_commission_brl: companyCommissionBRL,
        affiliate_commission_brl: affiliateCommissionBRL,
        calculation_date: new Date()
      };

      // Registrar pagamento de comissão da empresa
      await client.query(`
        INSERT INTO commission_payments (
          recipient_id, recipient_type, amount_usd, amount_brl, 
          source_position_id, conversion_rate, status
        ) VALUES (1, 'COMPANY', $1, $2, $3, $4, 'PAID')
      `, [companyCommissionUSD, companyCommissionBRL, positionId, conversionRate]);

      // Registrar pagamento de comissão do afiliado (se houver)
      if (position.affiliate_id && affiliateCommissionUSD > 0) {
        await client.query(`
          INSERT INTO commission_payments (
            recipient_id, recipient_type, amount_usd, amount_brl, 
            source_position_id, conversion_rate, status
          ) VALUES ($1, 'AFFILIATE', $2, $3, $4, $5, 'PENDING')
        `, [position.affiliate_id, affiliateCommissionUSD, affiliateCommissionBRL, positionId, conversionRate]);

        // Creditar comissão no saldo do afiliado
        await client.query(`
          UPDATE users SET 
            balance_brl_commission = COALESCE(balance_brl_commission, 0) + $1,
            balance_usd_commission = COALESCE(balance_usd_commission, 0) + $2
          WHERE id = (SELECT user_id FROM affiliates WHERE id = $3)
        `, [affiliateCommissionBRL, affiliateCommissionUSD, position.affiliate_id]);
      }

      // Registrar na tabela de histórico de pagamentos
      await client.query(`
        INSERT INTO payment_history (
          user_id, type, amount, currency, status, description, reference_id
        ) VALUES 
          (1, 'COMMISSION_RECEIVED', $1, 'USD', 'COMPLETED', 'Comissão empresa - posição ${positionId}', $2),
          (1, 'COMMISSION_RECEIVED', $3, 'BRL', 'COMPLETED', 'Comissão empresa - posição ${positionId}', $2)
      `, [companyCommissionUSD, positionId, companyCommissionBRL]);

      if (position.affiliate_id) {
        const affiliateUserId = await client.query(
          'SELECT user_id FROM affiliates WHERE id = $1', 
          [position.affiliate_id]
        );
        
        if (affiliateUserId.rows.length > 0) {
          await client.query(`
            INSERT INTO payment_history (
              user_id, type, amount, currency, status, description, reference_id
            ) VALUES 
              ($1, 'AFFILIATE_COMMISSION', $2, 'USD', 'COMPLETED', 'Comissão afiliado - posição ${positionId}', $3),
              ($1, 'AFFILIATE_COMMISSION', $4, 'BRL', 'COMPLETED', 'Comissão afiliado - posição ${positionId}', $3)
          `, [affiliateUserId.rows[0].user_id, affiliateCommissionUSD, positionId, affiliateCommissionBRL]);
        }
      }

      await client.query('COMMIT');

      console.log(`✅ Comissão processada para posição ${positionId}:`);
      console.log(`   💰 Lucro: $${tradingProfitUSD.toFixed(2)} USD`);
      console.log(`   🏢 Empresa: $${companyCommissionUSD.toFixed(2)} USD / R$${companyCommissionBRL.toFixed(2)}`);
      if (affiliateCommissionUSD > 0) {
        console.log(`   🤝 Afiliado: $${affiliateCommissionUSD.toFixed(2)} USD / R$${affiliateCommissionBRL.toFixed(2)}`);
      }

      return calculation;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao processar comissão:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // GESTÃO DE AFILIADOS
  // ========================================

  async updateAffiliateTier(affiliateId: number): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      // Calcular volume mensal do afiliado
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyVolume = await client.query(`
        SELECT COALESCE(SUM(amount_usd), 0) as total_volume
        FROM commission_payments 
        WHERE recipient_id = $1 
        AND recipient_type = 'AFFILIATE'
        AND created_at >= $2
      `, [affiliateId, monthStart]);

      const volume = parseFloat(monthlyVolume.rows[0].total_volume);
      
      // Determinar tier baseado no volume
      const newTier = volume >= this.AFFILIATE_TIERS.VIP.min_monthly_volume ? 'VIP' : 'NORMAL';
      
      // Atualizar tier do afiliado
      const result = await client.query(`
        UPDATE affiliates 
        SET tier = $1, updated_at = NOW()
        WHERE id = $2 AND tier != $1
        RETURNING tier
      `, [newTier, affiliateId]);

      if (result.rows.length > 0) {
        console.log(`✅ Afiliado ${affiliateId} promovido para tier ${newTier} (volume: $${volume})`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao atualizar tier do afiliado:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // ========================================
  // RELATÓRIOS E CONSULTAS
  // ========================================

  async getCommissionStats(startDate?: Date, endDate?: Date): Promise<CommissionStats> {
    try {
      const whereClause = startDate && endDate ? 
        'WHERE cp.created_at BETWEEN $1 AND $2' : '';
      const params = startDate && endDate ? [startDate, endDate] : [];

      const result = await this.db.query(`
        SELECT 
          COUNT(DISTINCT cp.source_position_id) as total_positions_processed,
          COALESCE(SUM(CASE WHEN cp.recipient_type = 'COMPANY' THEN cp.amount_usd ELSE 0 END), 0) as total_company_commission_usd,
          COALESCE(SUM(CASE WHEN cp.recipient_type = 'AFFILIATE' THEN cp.amount_usd ELSE 0 END), 0) as total_affiliate_commission_usd,
          COALESCE(SUM(CASE WHEN cp.recipient_type = 'COMPANY' THEN cp.amount_brl ELSE 0 END), 0) as total_company_commission_brl,
          COALESCE(SUM(CASE WHEN cp.recipient_type = 'AFFILIATE' THEN cp.amount_brl ELSE 0 END), 0) as total_affiliate_commission_brl,
          COALESCE(AVG(cp.amount_usd), 0) as average_commission_per_position
        FROM commission_payments cp
        ${whereClause}
      `, params);

      // Buscar top afiliados
      const topAffiliates = await this.db.query(`
        SELECT 
          a.id,
          u.full_name,
          u.email,
          a.tier,
          COALESCE(SUM(cp.amount_usd), 0) as total_earned_usd,
          COALESCE(SUM(cp.amount_brl), 0) as total_earned_brl,
          COUNT(cp.id) as total_commissions
        FROM affiliates a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN commission_payments cp ON a.id = cp.recipient_id AND cp.recipient_type = 'AFFILIATE'
        ${whereClause.replace('cp.', 'cp.')}
        GROUP BY a.id, u.full_name, u.email, a.tier
        ORDER BY total_earned_usd DESC
        LIMIT 10
      `, params);

      // Calcular lucro total estimado
      const totalCommissionUSD = parseFloat(result.rows[0].total_company_commission_usd) + 
                                  parseFloat(result.rows[0].total_affiliate_commission_usd);
      
      // Assumindo taxa média de 15% de comissão, estimar lucro total
      const estimatedTotalProfitUSD = totalCommissionUSD / 0.15;

      return {
        total_positions_processed: parseInt(result.rows[0].total_positions_processed),
        total_profit_generated_usd: estimatedTotalProfitUSD,
        total_company_commission_usd: parseFloat(result.rows[0].total_company_commission_usd),
        total_affiliate_commission_usd: parseFloat(result.rows[0].total_affiliate_commission_usd),
        total_company_commission_brl: parseFloat(result.rows[0].total_company_commission_brl),
        total_affiliate_commission_brl: parseFloat(result.rows[0].total_affiliate_commission_brl),
        average_commission_per_position: parseFloat(result.rows[0].average_commission_per_position),
        top_affiliates: topAffiliates.rows
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de comissão:', error);
      return {
        total_positions_processed: 0,
        total_profit_generated_usd: 0,
        total_company_commission_usd: 0,
        total_affiliate_commission_usd: 0,
        total_company_commission_brl: 0,
        total_affiliate_commission_brl: 0,
        average_commission_per_position: 0,
        top_affiliates: []
      };
    }
  }

  async getAffiliateCommissions(affiliateId: number, limit = 50, offset = 0): Promise<CommissionPayment[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM commission_payments 
        WHERE recipient_id = $1 AND recipient_type = 'AFFILIATE'
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [affiliateId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar comissões do afiliado:', error);
      return [];
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  private async getUSDToBRLRate(): Promise<number> {
    try {
      // Simular busca de taxa real - em produção, usar API de câmbio
      // Exemplo: API do Banco Central, CurrencyAPI, etc.
      
      // Taxa simulada (em produção, fazer chamada real)
      const simulatedRate = 5.2; // 1 USD = 5.2 BRL
      
      console.log(`💱 Taxa USD→BRL: ${simulatedRate}`);
      return simulatedRate;
    } catch (error) {
      console.error('❌ Erro ao buscar taxa de câmbio, usando taxa padrão');
      return 5.0; // Taxa padrão de fallback
    }
  }

  async processAllPendingPositions(): Promise<number> {
    try {
      // Buscar posições fechadas com lucro que ainda não foram processadas
      const pendingPositions = await this.db.query(`
        SELECT tp.id 
        FROM trading_positions tp
        LEFT JOIN commission_payments cp ON tp.id = cp.source_position_id
        WHERE tp.status = 'CLOSED' 
        AND tp.profit_loss > 0 
        AND cp.id IS NULL
        ORDER BY tp.closed_at ASC
      `);

      let processedCount = 0;

      for (const position of pendingPositions.rows) {
        try {
          const result = await this.processPositionCommission(position.id);
          if (result) {
            processedCount++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar posição ${position.id}:`, error);
        }
      }

      console.log(`✅ Processadas ${processedCount} posições pendentes`);
      return processedCount;
    } catch (error) {
      console.error('❌ Erro ao processar posições pendentes:', error);
      return 0;
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Atualizar tiers de todos os afiliados
      const affiliates = await this.db.query('SELECT id FROM affiliates WHERE is_active = true');
      
      for (const affiliate of affiliates.rows) {
        await this.updateAffiliateTier(affiliate.id);
      }

      console.log(`🧹 Cleanup concluído: ${affiliates.rows.length} afiliados verificados`);
    } catch (error) {
      console.error('❌ Erro na limpeza de comissões:', error);
    }
  }
}

export default CommissionService;
