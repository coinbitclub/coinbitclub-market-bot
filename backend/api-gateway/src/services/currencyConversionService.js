import axios from 'axios';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * Serviço de conversão de moedas para operações USD/BRL
 * Operações em USD, comissões convertidas para BRL
 */
export class CurrencyConversionService {
  
  /**
   * Obter taxa de câmbio USD/BRL atual
   */
  static async getCurrentUSDToBRLRate() {
    try {
      // Tentar múltiplas APIs para garantir disponibilidade
      const apis = [
        {
          name: 'fixer.io',
          url: `https://api.fixer.io/latest?access_key=${process.env.FIXER_API_KEY}&symbols=BRL&base=USD`,
          extractRate: (data) => data.rates.BRL
        },
        {
          name: 'exchangerate-api',
          url: `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/pair/USD/BRL`,
          extractRate: (data) => data.conversion_rate
        },
        {
          name: 'currencyapi',
          url: `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCY_API_KEY}&currencies=BRL&base_currency=USD`,
          extractRate: (data) => data.data.BRL.value
        },
        {
          name: 'banco_central_brasil',
          url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json',
          extractRate: (data) => parseFloat(data[0].valor)
        }
      ];

      let rate = null;
      let usedApi = null;

      for (const api of apis) {
        try {
          const response = await axios.get(api.url, { timeout: 5000 });
          rate = api.extractRate(response.data);
          usedApi = api.name;
          break;
        } catch (error) {
          logger.warn(`Erro na API ${api.name}:`, error.message);
          continue;
        }
      }

      if (!rate) {
        // Usar taxa de fallback (última conhecida ou padrão)
        const lastRate = await this.getLastKnownRate();
        rate = lastRate || 5.50; // Taxa padrão de emergência
        usedApi = 'fallback';
        logger.warn('Usando taxa de câmbio de fallback:', rate);
      }

      // Salvar taxa no banco para histórico
      await this.saveExchangeRate(rate, usedApi);

      logger.info('Taxa USD/BRL obtida:', {
        rate,
        api: usedApi,
        timestamp: new Date()
      });

      return {
        rate: parseFloat(rate.toFixed(4)),
        source: usedApi,
        timestamp: new Date(),
        formatted: `1 USD = ${rate.toFixed(4)} BRL`
      };

    } catch (error) {
      logger.error('Erro ao obter taxa de câmbio:', error);
      
      // Retornar taxa de emergência
      const emergencyRate = await this.getLastKnownRate() || 5.50;
      return {
        rate: emergencyRate,
        source: 'emergency',
        timestamp: new Date(),
        formatted: `1 USD = ${emergencyRate.toFixed(4)} BRL (emergência)`
      };
    }
  }

  /**
   * Converter valor USD para BRL
   */
  static async convertUSDToBRL(usdAmount, useCurrentRate = true) {
    const exchangeData = await this.getCurrentUSDToBRLRate();
    const brlAmount = usdAmount * exchangeData.rate;

    return {
      usd_amount: parseFloat(usdAmount.toFixed(2)),
      brl_amount: parseFloat(brlAmount.toFixed(2)),
      exchange_rate: exchangeData.rate,
      conversion_source: exchangeData.source,
      converted_at: new Date(),
      calculation: `${usdAmount} USD × ${exchangeData.rate} = ${brlAmount.toFixed(2)} BRL`
    };
  }

  /**
   * Calcular comissão em BRL para operação em USD
   */
  static async calculateCommissionBRL(usdProfitAmount, commissionRate, userId = null) {
    try {
      // Converter lucro USD para BRL
      const conversion = await this.convertUSDToBRL(usdProfitAmount);
      const brlProfitAmount = conversion.brl_amount;

      // Calcular comissão em BRL
      const commissionBRL = brlProfitAmount * commissionRate;

      // Buscar dados do usuário se fornecido
      let userInfo = null;
      if (userId) {
        userInfo = await db('users')
          .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
          .where('users.id', userId)
          .select('users.*', 'affiliate_tiers.name as tier_name', 'affiliate_tiers.commission_rate')
          .first();
      }

      const result = {
        operation: {
          usd_profit: parseFloat(usdProfitAmount.toFixed(2)),
          brl_profit: brlProfitAmount,
          exchange_rate: conversion.exchange_rate,
          conversion_source: conversion.conversion_source
        },
        commission: {
          rate: commissionRate,
          rate_percentage: `${(commissionRate * 100).toFixed(2)}%`,
          amount_brl: parseFloat(commissionBRL.toFixed(2)),
          amount_usd: parseFloat((commissionBRL / conversion.exchange_rate).toFixed(2))
        },
        calculation: {
          step1: `${usdProfitAmount} USD × ${conversion.exchange_rate} = ${brlProfitAmount.toFixed(2)} BRL`,
          step2: `${brlProfitAmount.toFixed(2)} BRL × ${(commissionRate * 100).toFixed(2)}% = ${commissionBRL.toFixed(2)} BRL`,
          summary: `Comissão: ${commissionBRL.toFixed(2)} BRL (${(commissionBRL / conversion.exchange_rate).toFixed(2)} USD equivalente)`
        },
        user_info: userInfo,
        calculated_at: new Date()
      };

      return result;

    } catch (error) {
      logger.error('Erro ao calcular comissão em BRL:', error);
      throw error;
    }
  }

  /**
   * Processar operação com conversão automática
   */
  static async processOperationWithConversion(operationData) {
    try {
      const {
        user_id,
        operation_type, // 'trade', 'copy_trade', 'signal'
        usd_amount_used,
        usd_profit_loss,
        metadata = {}
      } = operationData;

      // Converter valores para BRL
      const amountConversion = await this.convertUSDToBRL(usd_amount_used);
      const profitConversion = usd_profit_loss > 0 ? 
        await this.convertUSDToBRL(usd_profit_loss) : null;

      // Se houve lucro, calcular comissões
      let commissionData = null;
      if (usd_profit_loss > 0) {
        // Buscar tier do usuário
        const user = await db('users')
          .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
          .where('users.id', user_id)
          .select('users.*', 'affiliate_tiers.commission_rate')
          .first();

        const commissionRate = user?.commission_rate || 0.015; // 1.5% padrão
        commissionData = await this.calculateCommissionBRL(usd_profit_loss, commissionRate, user_id);

        // Processar comissão de afiliado se aplicável
        if (user.referred_by && commissionData.commission.amount_brl > 0) {
          await this.processAffiliateCommission(user.referred_by, commissionData);
        }
      }

      // Registrar operação no banco
      const operationLog = await db('operation_logs').insert({
        user_id: user_id,
        operation_type: operation_type,
        operation_direction: usd_profit_loss >= 0 ? 'credit' : 'debit',
        amount: Math.abs(profitConversion?.brl_amount || amountConversion.brl_amount),
        balance_before: 0, // Será atualizado pelo serviço de operações
        balance_after: 0,  // Será atualizado pelo serviço de operações
        currency: 'BRL',
        allowed: true,
        description: `Operação ${operation_type} - USD ${usd_amount_used} (${usd_profit_loss >= 0 ? 'lucro' : 'prejuízo'} USD ${Math.abs(usd_profit_loss)})`,
        metadata: JSON.stringify({
          ...metadata,
          usd_operation: {
            amount_used: usd_amount_used,
            profit_loss: usd_profit_loss
          },
          brl_conversion: {
            amount_used_brl: amountConversion.brl_amount,
            profit_loss_brl: profitConversion?.brl_amount || 0,
            exchange_rate: amountConversion.exchange_rate,
            conversion_source: amountConversion.conversion_source
          },
          commission_data: commissionData
        })
      }).returning('id');

      return {
        operation_id: operationLog[0].id,
        usd_operation: {
          amount_used: usd_amount_used,
          profit_loss: usd_profit_loss,
          result: usd_profit_loss >= 0 ? 'profit' : 'loss'
        },
        brl_conversion: {
          amount_used: amountConversion.brl_amount,
          profit_loss: profitConversion?.brl_amount || 0,
          exchange_rate: amountConversion.exchange_rate
        },
        commission: commissionData,
        processed_at: new Date()
      };

    } catch (error) {
      logger.error('Erro ao processar operação com conversão:', error);
      throw error;
    }
  }

  /**
   * Processar comissão de afiliado
   */
  static async processAffiliateCommission(affiliateId, commissionData) {
    try {
      // Buscar dados do afiliado
      const affiliate = await db('users')
        .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
        .where('users.id', affiliateId)
        .select('users.*', 'affiliate_tiers.name as tier_name', 'affiliate_tiers.commission_rate as tier_rate')
        .first();

      if (!affiliate) {
        logger.warn('Afiliado não encontrado:', affiliateId);
        return;
      }

      // Usar taxa do tier do afiliado
      const affiliateRate = affiliate.tier_rate || 0.015;
      const affiliateCommission = commissionData.commission.amount_brl * affiliateRate;

      // Registrar comissão
      await db('affiliate_commissions').insert({
        affiliate_id: affiliateId,
        user_id: commissionData.user_info?.id,
        commission_amount: affiliateCommission,
        currency: 'brl',
        commission_rate: affiliateRate,
        tier_name: affiliate.tier_name || 'normal',
        status: 'pending',
        operation_data: JSON.stringify({
          original_profit_usd: commissionData.operation.usd_profit,
          original_profit_brl: commissionData.operation.brl_profit,
          marketbot_commission_brl: commissionData.commission.amount_brl,
          affiliate_rate: affiliateRate,
          calculation: `${commissionData.commission.amount_brl} BRL × ${(affiliateRate * 100).toFixed(2)}% = ${affiliateCommission.toFixed(2)} BRL`
        })
      });

      logger.info('Comissão de afiliado processada:', {
        affiliateId,
        tier: affiliate.tier_name,
        rate: affiliateRate,
        commission: affiliateCommission
      });

      return {
        affiliate_id: affiliateId,
        tier: affiliate.tier_name,
        commission_brl: parseFloat(affiliateCommission.toFixed(2)),
        rate: affiliateRate
      };

    } catch (error) {
      logger.error('Erro ao processar comissão de afiliado:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de taxas de câmbio
   */
  static async getExchangeRateHistory(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rates = await db('exchange_rates')
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc')
      .limit(100);

    return rates.map(rate => ({
      ...rate,
      rate: parseFloat(rate.rate)
    }));
  }

  /**
   * Salvar taxa de câmbio no banco
   */
  static async saveExchangeRate(rate, source) {
    try {
      await db('exchange_rates').insert({
        from_currency: 'USD',
        to_currency: 'BRL',
        rate: rate,
        source: source,
        created_at: new Date()
      });
    } catch (error) {
      // Ignorar erros de inserção (pode ser duplicata)
      logger.debug('Erro ao salvar taxa de câmbio:', error.message);
    }
  }

  /**
   * Obter última taxa conhecida
   */
  static async getLastKnownRate() {
    try {
      const lastRate = await db('exchange_rates')
        .where({
          from_currency: 'USD',
          to_currency: 'BRL'
        })
        .orderBy('created_at', 'desc')
        .first();

      return lastRate ? parseFloat(lastRate.rate) : null;
    } catch (error) {
      logger.debug('Erro ao buscar última taxa:', error.message);
      return null;
    }
  }

  /**
   * Simular operação com conversão
   */
  static async simulateOperationConversion(usdAmount, expectedProfitUSD, userTier = 'normal') {
    try {
      const amountConversion = await this.convertUSDToBRL(usdAmount);
      const profitConversion = await this.convertUSDToBRL(expectedProfitUSD);
      
      // Taxas por tier
      const tierRates = {
        normal: 0.015, // 1.5%
        vip: 0.05      // 5%
      };

      const commissionRate = tierRates[userTier] || tierRates.normal;
      const commissionBRL = profitConversion.brl_amount * commissionRate;

      return {
        simulation: {
          usd_investment: usdAmount,
          usd_expected_profit: expectedProfitUSD,
          brl_investment: amountConversion.brl_amount,
          brl_expected_profit: profitConversion.brl_amount,
          exchange_rate: amountConversion.exchange_rate
        },
        commission: {
          tier: userTier,
          rate: `${(commissionRate * 100).toFixed(2)}%`,
          amount_brl: parseFloat(commissionBRL.toFixed(2)),
          amount_usd: parseFloat((commissionBRL / amountConversion.exchange_rate).toFixed(2))
        },
        net_profit: {
          brl: parseFloat((profitConversion.brl_amount - commissionBRL).toFixed(2)),
          usd: parseFloat((expectedProfitUSD - (commissionBRL / amountConversion.exchange_rate)).toFixed(2))
        },
        simulation_date: new Date()
      };

    } catch (error) {
      logger.error('Erro na simulação:', error);
      throw error;
    }
  }
}

export default CurrencyConversionService;
