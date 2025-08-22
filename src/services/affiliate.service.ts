import { DatabaseService } from './database.service';
import crypto from 'crypto';

export interface AffiliateData {
  id: number;
  user_id: number;
  affiliate_code: string;
  affiliate_link: string;
  commission_rate: number;
  total_referrals: number;
  total_commission_earned: number;
  commission_pending: number;
  commission_paid: number;
  is_active: boolean;
  tier: 'normal' | 'vip';
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface ReferralData {
  id: number;
  affiliate_id: number;
  referred_user_id: number;
  order_id?: string;
  commission_amount: number;
  commission_rate: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: Date;
  created_at: Date;
}

export interface CreateAffiliateRequest {
  user_id: number;
  tier?: 'normal' | 'vip';
  custom_rate?: number;
  metadata?: any;
}

export class AffiliateService {
  private db = DatabaseService.getInstance();

  // ========================================
  // CRIAÇÃO AUTOMÁTICA DE AFILIADOS
  // ========================================

  async createAffiliate(data: CreateAffiliateRequest): Promise<AffiliateData> {
    try {
      // Verificar se usuário já é afiliado
      const existing = await this.getAffiliateByUserId(data.user_id);
      if (existing) {
        throw new Error('Usuário já é afiliado');
      }

      // Gerar código único de afiliado
      const affiliateCode = await this.generateUniqueAffiliateCode();
      
      // Gerar link de afiliado
      const affiliateLink = this.generateAffiliateLink(affiliateCode);
      
      // Determinar taxa de comissão
      const commissionRate = data.custom_rate || this.getDefaultCommissionRate(data.tier || 'normal');

      const query = `
        INSERT INTO affiliates (
          user_id, affiliate_code, affiliate_link, commission_rate,
          total_referrals, total_commission_earned, commission_pending,
          commission_paid, is_active, tier, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        data.user_id,
        affiliateCode,
        affiliateLink,
        commissionRate,
        0, // total_referrals
        0, // total_commission_earned
        0, // commission_pending
        0, // commission_paid
        true, // is_active
        data.tier || 'normal',
        JSON.stringify(data.metadata || {})
      ];

      const result = await this.db.query(query, values);
      const affiliate = this.formatAffiliateData(result.rows[0]);

      console.log(`✅ Afiliado criado: ${affiliateCode} para usuário ${data.user_id}`);
      return affiliate;
    } catch (error) {
      console.error('❌ Erro ao criar afiliado:', error);
      throw error;
    }
  }

  // ========================================
  // GERAÇÃO AUTOMÁTICA EM MASSA
  // ========================================

  async generateAffiliatesForAllUsers(): Promise<AffiliateData[]> {
    try {
      // Buscar usuários que não são afiliados ainda
      const query = `
        SELECT u.id, u.email, u.user_type 
        FROM users u
        LEFT JOIN affiliates a ON u.id = a.user_id
        WHERE a.id IS NULL
        AND u.is_active = true
      `;

      const result = await this.db.query(query);
      const users = result.rows;

      const affiliates: AffiliateData[] = [];

      for (const user of users) {
        try {
          const tier = user.user_type === 'vip' ? 'vip' : 'normal';
          const affiliate = await this.createAffiliate({
            user_id: user.id,
            tier: tier,
            metadata: {
              auto_generated: true,
              user_email: user.email
            }
          });
          
          affiliates.push(affiliate);
        } catch (error) {
          console.error(`❌ Erro ao criar afiliado para usuário ${user.id}:`, error);
        }
      }

      console.log(`✅ ${affiliates.length} afiliados criados automaticamente`);
      return affiliates;
    } catch (error) {
      console.error('❌ Erro ao gerar afiliados em massa:', error);
      throw error;
    }
  }

  // ========================================
  // PROCESSAMENTO DE REFERRALS
  // ========================================

  async processReferral(affiliateCode: string, referredUserId: number, orderId: string, orderValue: number): Promise<ReferralData> {
    try {
      // Buscar afiliado pelo código
      const affiliate = await this.getAffiliateByCode(affiliateCode);
      if (!affiliate) {
        throw new Error('Código de afiliado inválido');
      }

      if (!affiliate.is_active) {
        throw new Error('Afiliado inativo');
      }

      // Calcular comissão
      const commissionAmount = orderValue * affiliate.commission_rate;

      const client = await this.db.getClient();
      
      try {
        await client.query('BEGIN');

        // Criar registro de referral
        const referralQuery = `
          INSERT INTO referrals (
            affiliate_id, referred_user_id, order_id, commission_amount,
            commission_rate, status
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const referralResult = await client.query(referralQuery, [
          affiliate.id,
          referredUserId,
          orderId,
          commissionAmount,
          affiliate.commission_rate,
          'pending'
        ]);

        // Atualizar estatísticas do afiliado
        await client.query(
          `UPDATE affiliates SET 
           total_referrals = total_referrals + 1,
           commission_pending = commission_pending + $1
           WHERE id = $2`,
          [commissionAmount, affiliate.id]
        );

        await client.query('COMMIT');

        const referral = this.formatReferralData(referralResult.rows[0]);
        
        console.log(`✅ Referral processado: ${commissionAmount} para afiliado ${affiliateCode}`);
        return referral;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Erro ao processar referral:', error);
      throw error;
    }
  }

  // ========================================
  // PAGAMENTO DE COMISSÕES
  // ========================================

  async payCommissions(affiliateId: number, amount?: number): Promise<boolean> {
    try {
      const affiliate = await this.getAffiliateById(affiliateId);
      if (!affiliate) {
        throw new Error('Afiliado não encontrado');
      }

      const amountToPay = amount || affiliate.commission_pending;
      
      if (amountToPay <= 0) {
        throw new Error('Não há comissões pendentes para pagar');
      }

      const client = await this.db.getClient();
      
      try {
        await client.query('BEGIN');

        // Atualizar comissões do afiliado
        await client.query(
          `UPDATE affiliates SET 
           commission_pending = commission_pending - $1,
           commission_paid = commission_paid + $1,
           total_commission_earned = total_commission_earned + $1
           WHERE id = $2`,
          [amountToPay, affiliateId]
        );

        // Marcar referrals como pagos
        await client.query(
          `UPDATE referrals SET 
           status = 'paid',
           paid_at = NOW()
           WHERE affiliate_id = $1 
           AND status = 'pending'
           AND commission_amount <= $2`,
          [affiliateId, amountToPay]
        );

        // Registrar histórico de pagamento
        await client.query(
          `INSERT INTO commission_payments (
            affiliate_id, amount, payment_date, status
          ) VALUES ($1, $2, NOW(), 'completed')`,
          [affiliateId, amountToPay]
        );

        await client.query('COMMIT');
        
        console.log(`✅ Comissão paga: R$ ${amountToPay} para afiliado ${affiliateId}`);
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Erro ao pagar comissão:', error);
      throw error;
    }
  }

  // ========================================
  // CONSULTAS E RELATÓRIOS
  // ========================================

  async getAffiliateByUserId(userId: number): Promise<AffiliateData | null> {
    try {
      const query = 'SELECT * FROM affiliates WHERE user_id = $1';
      const result = await this.db.query(query, [userId]);
      
      return result.rows.length > 0 ? this.formatAffiliateData(result.rows[0]) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar afiliado por usuário:', error);
      throw error;
    }
  }

  async getAffiliateByCode(code: string): Promise<AffiliateData | null> {
    try {
      const query = 'SELECT * FROM affiliates WHERE affiliate_code = $1';
      const result = await this.db.query(query, [code]);
      
      return result.rows.length > 0 ? this.formatAffiliateData(result.rows[0]) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar afiliado por código:', error);
      throw error;
    }
  }

  async getAffiliateById(id: number): Promise<AffiliateData | null> {
    try {
      const query = 'SELECT * FROM affiliates WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      return result.rows.length > 0 ? this.formatAffiliateData(result.rows[0]) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar afiliado por ID:', error);
      throw error;
    }
  }

  async getAffiliateStats(affiliateId: number) {
    try {
      const query = `
        SELECT 
          a.*,
          COUNT(r.id) as total_referrals_count,
          SUM(CASE WHEN r.status = 'pending' THEN r.commission_amount ELSE 0 END) as pending_commission,
          SUM(CASE WHEN r.status = 'paid' THEN r.commission_amount ELSE 0 END) as paid_commission,
          COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as referrals_last_30_days,
          COUNT(CASE WHEN r.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as referrals_last_7_days
        FROM affiliates a
        LEFT JOIN referrals r ON a.id = r.affiliate_id
        WHERE a.id = $1
        GROUP BY a.id
      `;

      const result = await this.db.query(query, [affiliateId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas do afiliado:', error);
      throw error;
    }
  }

  async listTopAffiliates(limit: number = 10) {
    try {
      const query = `
        SELECT 
          a.*,
          u.email,
          COUNT(r.id) as total_referrals_count,
          SUM(r.commission_amount) as total_earned
        FROM affiliates a
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN referrals r ON a.id = r.affiliate_id
        WHERE a.is_active = true
        GROUP BY a.id, u.email
        ORDER BY total_earned DESC NULLS LAST
        LIMIT $1
      `;

      const result = await this.db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao listar top afiliados:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITÁRIOS PRIVADOS
  // ========================================

  private async generateUniqueAffiliateCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
      code = `MB${randomPart}`;
      
      const existing = await this.getAffiliateByCode(code);
      if (!existing) {
        isUnique = true;
      }
    }
    
    return code!;
  }

  private generateAffiliateLink(affiliateCode: string): string {
    const baseUrl = 'https://marketbot.ngrok.app';
    return `${baseUrl}/ref/${affiliateCode}`;
  }

  private getDefaultCommissionRate(tier: 'normal' | 'vip'): number {
    return tier === 'vip' ? 0.05 : 0.015; // 5% VIP, 1.5% Normal
  }

  private formatAffiliateData(row: any): AffiliateData {
    return {
      id: row.id,
      user_id: row.user_id,
      affiliate_code: row.affiliate_code,
      affiliate_link: row.affiliate_link,
      commission_rate: parseFloat(row.commission_rate),
      total_referrals: row.total_referrals,
      total_commission_earned: parseFloat(row.total_commission_earned),
      commission_pending: parseFloat(row.commission_pending),
      commission_paid: parseFloat(row.commission_paid),
      is_active: row.is_active,
      tier: row.tier,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  private formatReferralData(row: any): ReferralData {
    return {
      id: row.id,
      affiliate_id: row.affiliate_id,
      referred_user_id: row.referred_user_id,
      order_id: row.order_id,
      commission_amount: parseFloat(row.commission_amount),
      commission_rate: parseFloat(row.commission_rate),
      status: row.status,
      paid_at: row.paid_at ? new Date(row.paid_at) : undefined,
      created_at: new Date(row.created_at)
    };
  }
}

export const affiliateService = new AffiliateService();
