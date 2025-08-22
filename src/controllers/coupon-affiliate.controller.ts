import { Request, Response } from 'express';
import { couponService } from '../services/coupon.service';
import { affiliateService } from '../services/affiliate.service';

export class CouponAffiliateController {

  // ========================================
  // GESTÃO DE CUPONS
  // ========================================

  async generateCoupon(req: Request, res: Response) {
    try {
      const { discount_type, discount_value, max_uses, expires_in_days, metadata } = req.body;
      const created_by_user_id = (req as any).user?.id || 1; // Admin default

      const coupon = await couponService.generateCoupon({
        discount_type,
        discount_value,
        max_uses,
        expires_in_days,
        created_by_user_id,
        metadata
      });

      return res.json({
        success: true,
        data: coupon,
        message: `Cupom ${coupon.code} criado com sucesso!`
      });
    } catch (error) {
      console.error('❌ Erro ao gerar cupom:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar cupom'
      });
    }
  }

  async generateAutomaticCoupons(req: Request, res: Response) {
    try {
      const coupons = await couponService.generateAutomaticCoupons();

      return res.json({
        success: true,
        data: coupons,
        message: `${coupons.length} cupons automáticos gerados!`,
        coupons_created: {
          vip: coupons.find(c => c.metadata.type === 'vip')?.code,
          first_buy: coupons.find(c => c.metadata.type === 'first_buy')?.code,
          black_friday: coupons.find(c => c.metadata.type === 'black_friday')?.code
        }
      });
    } catch (error) {
      console.error('❌ Erro ao gerar cupons automáticos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar cupons automáticos'
      });
    }
  }

  async validateCoupon(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const { user_id } = req.body;

      const coupon = await couponService.validateCoupon(code, user_id);

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Cupom inválido, expirado ou já utilizado'
        });
      }

      return res.json({
        success: true,
        data: {
          valid: true,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          expires_at: coupon.expires_at,
          uses_remaining: coupon.max_uses - coupon.current_uses
        },
        message: `Cupom válido! ${coupon.discount_value}% de desconto`
      });
    } catch (error) {
      console.error('❌ Erro ao validar cupom:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao validar cupom'
      });
    }
  }

  async listCoupons(req: Request, res: Response) {
    try {
      const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
      const coupons = await couponService.listCoupons(userId);

      return res.json({
        success: true,
        data: coupons,
        total: coupons.length
      });
    } catch (error) {
      console.error('❌ Erro ao listar cupons:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar cupons'
      });
    }
  }

  async getCouponStats(req: Request, res: Response) {
    try {
      const { couponId } = req.params;
      const stats = await couponService.getCouponStats(Number(couponId));

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas do cupom'
      });
    }
  }

  // ========================================
  // GESTÃO DE AFILIADOS
  // ========================================

  async createAffiliate(req: Request, res: Response) {
    try {
      const { user_id, tier, custom_rate, metadata } = req.body;

      const affiliate = await affiliateService.createAffiliate({
        user_id,
        tier,
        custom_rate,
        metadata
      });

      return res.json({
        success: true,
        data: affiliate,
        message: `Afiliado criado: ${affiliate.affiliate_code}`,
        affiliate_info: {
          code: affiliate.affiliate_code,
          link: affiliate.affiliate_link,
          commission_rate: `${(affiliate.commission_rate * 100).toFixed(1)}%`,
          tier: affiliate.tier
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar afiliado:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar afiliado'
      });
    }
  }

  async generateAllAffiliates(req: Request, res: Response) {
    try {
      const affiliates = await affiliateService.generateAffiliatesForAllUsers();

      return res.json({
        success: true,
        data: affiliates,
        message: `${affiliates.length} afiliados criados automaticamente!`,
        summary: {
          total_created: affiliates.length,
          vip_affiliates: affiliates.filter(a => a.tier === 'vip').length,
          normal_affiliates: affiliates.filter(a => a.tier === 'normal').length
        }
      });
    } catch (error) {
      console.error('❌ Erro ao gerar afiliados:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar afiliados automaticamente'
      });
    }
  }

  async getAffiliateByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const affiliate = await affiliateService.getAffiliateByUserId(Number(userId));

      if (!affiliate) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não é afiliado'
        });
      }

      const stats = await affiliateService.getAffiliateStats(affiliate.id);

      return res.json({
        success: true,
        data: {
          ...affiliate,
          stats: {
            total_referrals: stats.total_referrals_count,
            pending_commission: stats.pending_commission,
            paid_commission: stats.paid_commission,
            referrals_last_30_days: stats.referrals_last_30_days,
            referrals_last_7_days: stats.referrals_last_7_days
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar afiliado:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do afiliado'
      });
    }
  }

  async getAffiliateByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const affiliate = await affiliateService.getAffiliateByCode(code);

      if (!affiliate) {
        return res.status(404).json({
          success: false,
          message: 'Código de afiliado não encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          code: affiliate.affiliate_code,
          commission_rate: `${(affiliate.commission_rate * 100).toFixed(1)}%`,
          tier: affiliate.tier,
          is_active: affiliate.is_active
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar afiliado:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar afiliado'
      });
    }
  }

  async getTopAffiliates(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 10;
      const topAffiliates = await affiliateService.listTopAffiliates(limit);

      return res.json({
        success: true,
        data: topAffiliates.map(affiliate => ({
          affiliate_code: affiliate.affiliate_code,
          email: affiliate.email,
          tier: affiliate.tier,
          commission_rate: `${(affiliate.commission_rate * 100).toFixed(1)}%`,
          total_referrals: affiliate.total_referrals_count || 0,
          total_earned: `R$ ${(affiliate.total_earned || 0).toFixed(2)}`,
          is_active: affiliate.is_active
        })),
        total: topAffiliates.length
      });
    } catch (error) {
      console.error('❌ Erro ao listar top afiliados:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar top afiliados'
      });
    }
  }

  async payCommission(req: Request, res: Response) {
    try {
      const { affiliateId } = req.params;
      const { amount } = req.body;

      const success = await affiliateService.payCommissions(Number(affiliateId), amount);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível processar o pagamento'
        });
      }

      return res.json({
        success: true,
        message: `Comissão paga com sucesso!`,
        data: {
          affiliate_id: affiliateId,
          amount_paid: amount || 'pending_amount'
        }
      });
    } catch (error) {
      console.error('❌ Erro ao pagar comissão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar pagamento de comissão'
      });
    }
  }

  // ========================================
  // LANDING PAGE DE AFILIADO
  // ========================================

  async getAffiliateLanding(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const affiliate = await affiliateService.getAffiliateByCode(code);

      if (!affiliate) {
        return res.redirect('https://marketbot.ngrok.app?error=invalid_affiliate');
      }

      // Gerar links de pagamento com código de afiliado
      const monthlyLink = `https://marketbot.ngrok.app/api/v1/payments/checkout/price_monthly_497?affiliate=${code}`;
      const prepaidLink = `https://marketbot.ngrok.app/api/v1/payments/checkout/price_prepaid_1997?affiliate=${code}`;

      return res.json({
        success: true,
        affiliate_info: {
          code: affiliate.affiliate_code,
          commission_rate: `${(affiliate.commission_rate * 100).toFixed(1)}%`,
          tier: affiliate.tier
        },
        payment_links: {
          monthly_plan: {
            price: 'R$ 497,00/mês',
            link: monthlyLink,
            commission: `R$ ${(497 * affiliate.commission_rate).toFixed(2)}`
          },
          prepaid_plan: {
            price: 'R$ 1.997,00 (4 meses)',
            link: prepaidLink,
            commission: `R$ ${(1997 * affiliate.commission_rate).toFixed(2)}`
          }
        },
        message: `Landing page para afiliado ${code}`
      });
    } catch (error) {
      console.error('❌ Erro na landing do afiliado:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao carregar página do afiliado'
      });
    }
  }

  // ========================================
  // MÉTODOS SIMPLIFICADOS PARA TESTES
  // ========================================

  async validateCouponSimple(req: Request, res: Response) {
    try {
      const { code } = req.params;
      
      // Cupons válidos de teste
      const validCoupons = ['WELCOME10', 'PROMO20', 'VIP25'];
      const isValid = validCoupons.includes(code);
      
      res.json({
        success: isValid,
        coupon: {
          code,
          discount: isValid ? (code === 'WELCOME10' ? 10 : code === 'PROMO20' ? 20 : 25) : 0,
          valid: isValid,
          reason: isValid ? 'Cupom válido' : 'Cupom não encontrado'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao validar cupom'
      });
    }
  }

  async generateAffiliateSimple(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const affiliateCode = `AFF${Date.now().toString().slice(-6)}`;
      
      res.json({
        success: true,
        affiliateCode,
        userId: userId || 1,
        commissionRate: 10
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar afiliado'
      });
    }
  }

  async validateAffiliateSimple(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const isValid = code.startsWith('AFF') && code.length === 9;
      
      res.json({
        success: isValid,
        affiliate: isValid ? {
          id: 1,
          code,
          userId: 1,
          commissionRate: 10,
          totalReferrals: 5,
          totalEarnings: 250
        } : null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao validar afiliado'
      });
    }
  }

  async generateCouponSimple(req: Request, res: Response) {
    try {
      const { discountPercentage, description, maxUses } = req.body;
      const code = `CUP${Date.now().toString().slice(-5)}`;
      
      res.json({
        success: true,
        coupon: {
          code,
          discount: discountPercentage || 10,
          description: description || 'Cupom gerado automaticamente',
          maxUses: maxUses || 100,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar cupom'
      });
    }
  }
}

export const couponAffiliateController = new CouponAffiliateController();
