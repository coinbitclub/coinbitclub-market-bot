
// ========================================
// MARKETBOT - COUPON SERVICE FUNCIONAL
// Sistema de cupons administrativos real
// ========================================

import { Client } from 'pg';
import crypto from 'crypto';

export class CouponService {
  private client: Client;

  constructor() {
    this.client = new Client({ 
      connectionString: process.env.DATABASE_URL 
    });
  }

  private couponTypes = {
    BASIC: { value: 200, currency: 'BRL', usd_value: 35 },
    PREMIUM: { value: 500, currency: 'BRL', usd_value: 100 },
    VIP: { value: 1000, currency: 'BRL', usd_value: 200 }
  };

  async createCoupon(
    type: 'BASIC' | 'PREMIUM' | 'VIP' | 'CUSTOM',
    value?: number,
    currency?: string,
    quantity = 1,
    createdByUserId: string
  ): Promise<any[]> {
    try {
      await this.client.connect();
      
      const coupons = [];
      
      for (let i = 0; i < quantity; i++) {
        // Gerar código único
        const code = this.generateUniqueCode();
        
        let couponValue, couponCurrency;
        if (type === 'CUSTOM') {
          couponValue = value!;
          couponCurrency = currency!;
        } else {
          const typeConfig = this.couponTypes[type];
          couponValue = typeConfig.value;
          couponCurrency = typeConfig.currency;
        }

        // Inserir no banco
        const result = await this.client.query(`
          INSERT INTO coupons (
            code, discount_type, discount_value, max_uses, current_uses,
            expires_at, is_active, created_by_user_id, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING *
        `, [
          code, 'fixed', couponValue, 1, 0,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          true, createdByUserId,
          JSON.stringify({
            type: type,
            currency: couponCurrency,
            description: `Cupom ${type} - ${couponCurrency} ${couponValue}`
          })
        ]);

        coupons.push(result.rows[0]);
      }

      console.log(`✅ ${quantity} cupom(ns) ${type} criado(s)`);
      return coupons;
      
    } finally {
      await this.client.end();
    }
  }

  async validateCoupon(code: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<any> {
    try {
      await this.client.connect();
      
      // Buscar cupom
      const couponResult = await this.client.query(
        'SELECT * FROM coupons WHERE code = $1',
        [code.toUpperCase()]
      );

      if (couponResult.rows.length === 0) {
        throw new Error('Cupom não encontrado');
      }

      const coupon = couponResult.rows[0];

      // Validações
      if (!coupon.is_active) {
        throw new Error('Cupom inativo');
      }

      if (new Date() > new Date(coupon.expires_at)) {
        throw new Error('Cupom expirado');
      }

      if (coupon.current_uses >= coupon.max_uses) {
        throw new Error('Cupom esgotado');
      }

      // Verificar se usuário já usou este tipo de cupom
      if (userId) {
        const usageResult = await this.client.query(`
          SELECT cu.* FROM coupon_usage cu
          JOIN coupons c ON cu.coupon_id = c.id
          WHERE cu.user_id = $1 AND c.metadata->>'type' = $2
        `, [userId, JSON.parse(coupon.metadata).type]);

        if (usageResult.rows.length > 0) {
          throw new Error('Usuário já utilizou um cupom deste tipo');
        }
      }

      return {
        valid: true,
        coupon: coupon,
        value: coupon.discount_value,
        currency: JSON.parse(coupon.metadata).currency,
        type: JSON.parse(coupon.metadata).type
      };
      
    } finally {
      await this.client.end();
    }
  }

  async applyCoupon(code: string, userId: string, ipAddress: string, userAgent: string): Promise<any> {
    try {
      await this.client.connect();
      
      // Validar cupom
      const validation = await this.validateCoupon(code, userId, ipAddress, userAgent);
      if (!validation.valid) {
        throw new Error('Cupom inválido');
      }

      const coupon = validation.coupon;
      const metadata = JSON.parse(coupon.metadata);

      await this.client.query('BEGIN');

      try {
        // Registrar uso
        await this.client.query(`
          INSERT INTO coupon_usage (coupon_id, user_id, used_at)
          VALUES ($1, $2, NOW())
        `, [coupon.id, userId]);

        // Atualizar contador
        await this.client.query(`
          UPDATE coupons 
          SET current_uses = current_uses + 1, updated_at = NOW()
          WHERE id = $1
        `, [coupon.id]);

        // Aplicar crédito administrativo
        if (metadata.currency === 'BRL') {
          await this.client.query(`
            UPDATE users 
            SET prepaid_credits = prepaid_credits + $1, updated_at = NOW()
            WHERE id = $2
          `, [coupon.discount_value, userId]);
        } else {
          // Converter USD para BRL (taxa fictícia 5.25)
          const brlValue = coupon.discount_value * 5.25;
          await this.client.query(`
            UPDATE users 
            SET prepaid_credits = prepaid_credits + $1, updated_at = NOW()
            WHERE id = $2
          `, [brlValue, userId]);
        }

        await this.client.query('COMMIT');

        console.log(`✅ Cupom ${code} aplicado para usuário ${userId}`);
        
        return {
          success: true,
          coupon_code: code,
          value_applied: coupon.discount_value,
          currency: metadata.currency,
          type: metadata.type
        };

      } catch (error) {
        await this.client.query('ROLLBACK');
        throw error;
      }
      
    } finally {
      await this.client.end();
    }
  }

  async listActiveCoupons(): Promise<any[]> {
    try {
      await this.client.connect();
      
      const result = await this.client.query(`
        SELECT c.*, 
               COUNT(cu.id) as usage_count,
               u.email as created_by_email
        FROM coupons c
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
        LEFT JOIN users u ON c.created_by_user_id = u.id
        WHERE c.is_active = true AND c.expires_at > NOW()
        GROUP BY c.id, u.email
        ORDER BY c.created_at DESC
      `);

      return result.rows;
      
    } finally {
      await this.client.end();
    }
  }

  private generateUniqueCode(): string {
    // Gerar código único de 8 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
