import { db } from '../../../common/db.js';
import { PaymentService } from './paymentService.js';
import logger from '../../../common/logger.js';

export class WithdrawalService {
  /**
   * Solicitar saque de saldo pré-pago
   */
  static async requestWithdrawal(userId, amount, currency = 'BRL', withdrawalDetails = {}) {
    try {
      return await db.transaction(async (trx) => {
        // Verificar saldo disponível
        const userBalance = await trx('user_prepaid_balance')
          .where({ user_id: userId, currency })
          .first();

        if (!userBalance || parseFloat(userBalance.balance) < amount) {
          throw new Error('Saldo insuficiente para saque');
        }

        // Buscar configurações da moeda
        const currencySettings = await trx('currency_settings')
          .where({ currency })
          .first();

        if (!currencySettings) {
          throw new Error('Configurações da moeda não encontradas');
        }

        // Verificar valor mínimo de saque
        if (amount < currencySettings.minimum_withdrawal) {
          throw new Error(`Valor mínimo para saque é ${currency} ${currencySettings.minimum_withdrawal}`);
        }

        // Calcular taxas
        const feePercentage = parseFloat(currencySettings.withdrawal_fee_percentage);
        const feeFixed = parseFloat(currencySettings.withdrawal_fee_fixed);
        const feeAmount = (amount * feePercentage) + feeFixed;
        const netAmount = amount - feeAmount;

        // Verificar limites diários
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dailyWithdrawals = await trx('withdrawal_requests')
          .where({ user_id: userId })
          .whereBetween('created_at', [today, tomorrow])
          .whereIn('status', ['pending', 'processing', 'completed'])
          .count('* as count')
          .first();

        const maxDailyWithdrawals = await this.getWithdrawalSetting('max_daily_withdrawals', 5);
        
        if (parseInt(dailyWithdrawals.count) >= maxDailyWithdrawals) {
          throw new Error('Limite diário de saques excedido');
        }

        // Criar solicitação de saque
        const [withdrawalRequest] = await trx('withdrawal_requests').insert({
          user_id: userId,
          amount,
          currency,
          withdrawal_type: 'user_prepaid',
          bank_details: withdrawalDetails.bank_details || null,
          pix_key: withdrawalDetails.pix_key || null,
          crypto_address: withdrawalDetails.crypto_address || null,
          fee_amount: feeAmount,
          net_amount: netAmount,
          status: 'pending'
        }).returning('*');

        // Debitar saldo (bloquear o valor)
        await PaymentService.debitPrepaidBalance(
          userId, 
          amount, 
          currency, 
          `Saque solicitado - ID: ${withdrawalRequest.id}`,
          withdrawalRequest.id
        );

        // Log da operação
        await trx('operation_logs').insert({
          user_id: userId,
          operation_type: 'withdrawal_request',
          balance_before: parseFloat(userBalance.balance),
          balance_after: parseFloat(userBalance.balance) - amount,
          amount_used: amount,
          currency,
          allowed: true,
          metadata: {
            withdrawal_id: withdrawalRequest.id,
            fee_amount: feeAmount,
            net_amount: netAmount
          }
        });

        // Verificar se pode ser aprovado automaticamente
        const autoApprovalLimit = await this.getWithdrawalSetting('auto_approval_limit', 1000);
        
        if (amount <= autoApprovalLimit) {
          await this.processWithdrawalAutomatically(withdrawalRequest.id, trx);
        }

        logger.info({ 
          userId, 
          withdrawalId: withdrawalRequest.id,
          amount,
          currency 
        }, 'Solicitação de saque criada');

        return withdrawalRequest;
      });

    } catch (error) {
      logger.error({ error, userId, amount, currency }, 'Erro ao solicitar saque');
      throw error;
    }
  }

  /**
   * Processar saque automaticamente (VERSÃO COMPLETA)
   */
  static async processWithdrawalAutomatically(withdrawalId, trx = null) {
    try {
      return await db.transaction(async (useTransaction) => {
        // Buscar o saque
        const withdrawal = await useTransaction('withdrawal_requests')
          .where({ id: withdrawalId })
          .first();

        if (!withdrawal) {
          throw new Error('Saque não encontrado');
        }

        if (withdrawal.status !== 'pending') {
          logger.info(`Saque ${withdrawalId} já processado com status: ${withdrawal.status}`);
          return { processed: false, reason: 'ja_processado' };
        }

        // Verificar se é horário comercial
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        const isBusinessHour = hour >= 8 && hour <= 18;
        const isBusinessDay = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        if (!isBusinessHour || !isBusinessDay) {
          logger.info(`Saque ${withdrawalId} - fora do horário comercial`);
          return { processed: false, reason: 'fora_horario_comercial' };
        }

        // Verificar configurações de auto-aprovação
        const autoSettings = await useTransaction('payment_settings')
          .where('key', 'auto_withdrawal_settings')
          .first();

        const settings = autoSettings ? JSON.parse(autoSettings.value) : {
          enabled: true,
          max_amount_brl: 1000,
          max_amount_usd: 200
        };

        if (!settings.enabled) {
          return { processed: false, reason: 'auto_processamento_desabilitado' };
        }

        // Verificar limites
        const maxAmount = withdrawal.currency === 'BRL' ? settings.max_amount_brl : settings.max_amount_usd;
        if (withdrawal.amount > maxAmount) {
          return { processed: false, reason: 'acima_limite_automatico' };
        }

        // PROCESSAR AUTOMATICAMENTE
        logger.info(`🚀 Processando saque automaticamente: ${withdrawalId}`);

        // Atualizar status
        await useTransaction('withdrawal_requests')
          .where({ id: withdrawalId })
          .update({
            status: 'processing',
            processed_at: new Date(),
            processing_notes: 'Processamento automático iniciado'
          });

        // Executar pagamento
        const paymentResult = await this.executeWithdrawalPayment(withdrawal);

        if (paymentResult.success) {
          // Concluir saque
          await useTransaction('withdrawal_requests')
            .where({ id: withdrawalId })
            .update({
              status: 'completed',
              completed_at: new Date(),
              processing_notes: 'Processado automaticamente com sucesso',
              external_transaction_id: paymentResult.transactionId
            });

          // Registrar transação
          await useTransaction('prepaid_transactions').insert({
            user_id: withdrawal.user_id,
            type: 'debit',
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            balance_before: withdrawal.balance_before,
            balance_after: withdrawal.balance_after,
            description: `Saque automático - ${withdrawal.withdrawal_type}`,
            reference_id: withdrawalId,
            metadata: JSON.stringify({
              processing_method: 'automatic',
              external_transaction_id: paymentResult.transactionId
            })
          });

          // Log de auditoria
          await useTransaction('audit_logs').insert({
            user_id: withdrawal.user_id,
            action: 'withdrawal_completed_automatically',
            resource_type: 'withdrawal_request',
            resource_id: withdrawalId,
            details: {
              amount: withdrawal.amount,
              currency: withdrawal.currency,
              net_amount: withdrawal.net_amount,
              auto_processed: true,
              external_transaction_id: paymentResult.transactionId
            }
          });

          // Notificação automática
          await this.sendWithdrawalNotification(withdrawal, 'completed');

          logger.info(`✅ Saque ${withdrawalId} processado automaticamente`);
          
          return { 
            processed: true, 
            status: 'completed',
            transactionId: paymentResult.transactionId 
          };

        } else {
          // Falha no processamento
          await useTransaction('withdrawal_requests')
            .where({ id: withdrawalId })
            .update({
              status: 'failed',
              processing_notes: `Falha: ${paymentResult.error}`
            });

          // Reverter saldo
          await this.revertWithdrawalBalance(withdrawal, useTransaction);

          return { 
            processed: false, 
            reason: 'falha_pagamento',
            error: paymentResult.error 
          };
        }
      });

    } catch (error) {
      logger.error(`Erro no processamento automático do saque ${withdrawalId}:`, error);
      
      await db('withdrawal_requests')
        .where({ id: withdrawalId })
        .update({
          status: 'failed',
          processing_notes: `Erro: ${error.message}`
        });

      throw error;
    }
  }

  /**
   * Executar pagamento do saque
   */
  static async executeWithdrawalPayment(withdrawal) {
    try {
      logger.info(`Executando pagamento do saque ${withdrawal.id}`);

      // Integração com gateway de pagamento real
      if (withdrawal.withdrawal_type === 'pix') {
        return await this.processPixWithdrawal(withdrawal);
      } else if (withdrawal.withdrawal_type === 'bank_transfer') {
        return await this.processBankTransfer(withdrawal);
      } else if (withdrawal.withdrawal_type === 'paypal') {
        return await this.processPayPalWithdrawal(withdrawal);
      }

      // Por enquanto simular sucesso (substituir por integração real)
      return {
        success: true,
        transactionId: `AUTO_${Date.now()}_${withdrawal.id}`,
        processedAt: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processar PIX
   */
  static async processPixWithdrawal(withdrawal) {
    try {
      // TODO: Integração com API PIX real
      return {
        success: true,
        transactionId: `PIX_${Date.now()}`,
        pixTxId: `PIX_${withdrawal.id}_${Date.now()}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Processar transferência bancária
   */
  static async processBankTransfer(withdrawal) {
    try {
      // TODO: Integração com API bancária
      return {
        success: true,
        transactionId: `BANK_${Date.now()}`,
        bankReference: `BNK_${withdrawal.id}_${Date.now()}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Processar PayPal
   */
  static async processPayPalWithdrawal(withdrawal) {
    try {
      // TODO: Integração com PayPal API
      return {
        success: true,
        transactionId: `PAYPAL_${Date.now()}`,
        paypalId: `PP_${withdrawal.id}_${Date.now()}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reverter saldo
   */
  static async revertWithdrawalBalance(withdrawal, trx) {
    await trx('user_prepaid_balance')
      .where({ 
        user_id: withdrawal.user_id, 
        currency: withdrawal.currency 
      })
      .increment('balance', withdrawal.amount);

    await trx('prepaid_transactions').insert({
      user_id: withdrawal.user_id,
      type: 'credit',
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      description: `Reversão de saque falhado - ${withdrawal.id}`,
      reference_id: withdrawal.id,
      metadata: JSON.stringify({
        type: 'withdrawal_reversal',
        original_withdrawal_id: withdrawal.id
      })
    });
  }

  /**
   * Enviar notificação
   */
  static async sendWithdrawalNotification(withdrawal, status) {
    try {
      const user = await db('users')
        .join('user_profiles', 'users.id', 'user_profiles.user_id')
        .where('users.id', withdrawal.user_id)
        .select('users.*', 'user_profiles.whatsapp')
        .first();

      if (!user?.whatsapp) return;

      const { WhatsAppService } = await import('./whatsappService.js');
      
      if (status === 'completed') {
        await WhatsAppService.sendWithdrawalApprovedNotification(user.whatsapp, {
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          withdrawal_type: withdrawal.withdrawal_type,
          net_amount: withdrawal.net_amount,
          fee_amount: withdrawal.fee_amount
        });
      }

    } catch (error) {
      logger.error('Erro ao enviar notificação:', error);
    }
  }

  /**
   * Verificar se está em horário comercial
   */
  static isBusinessHours() {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { currency, withdrawal_type, pix_key, crypto_address, bank_details } = withdrawal;

    if (currency === 'BRL') {
      if (pix_key) {
        // Processar PIX
        await this.processPIXWithdrawal(withdrawal);
      } else if (bank_details) {
        // Processar TED/DOC
        await this.processBankTransfer(withdrawal);
      }
    } else if (currency === 'USD') {
      if (crypto_address) {
        // Processar transferência crypto
        await this.processCryptoWithdrawal(withdrawal);
      } else {
        // Processar transferência internacional
        await this.processInternationalTransfer(withdrawal);
      }
    }

    return true;
  }

  /**
   * Processar PIX
   */
  static async processPIXWithdrawal(withdrawal) {
    // Integração com API PIX (ex: Banco Central, PagBank, etc.)
    logger.info({ 
      withdrawalId: withdrawal.id,
      pixKey: withdrawal.pix_key,
      amount: withdrawal.net_amount 
    }, 'Processando saque via PIX');

    // Aqui você integraria com a API real do PIX
    // Exemplo de resposta simulada:
    const transactionHash = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db('withdrawal_requests')
      .where({ id: withdrawal.id })
      .update({
        transaction_hash: transactionHash,
        processing_notes: `PIX processado com sucesso. ID: ${transactionHash}`
      });

    return transactionHash;
  }

  /**
   * Processar transferência bancária
   */
  static async processBankTransfer(withdrawal) {
    logger.info({ 
      withdrawalId: withdrawal.id,
      bankDetails: withdrawal.bank_details,
      amount: withdrawal.net_amount 
    }, 'Processando transferência bancária');

    // Integração com API bancária
    const transactionHash = `TED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db('withdrawal_requests')
      .where({ id: withdrawal.id })
      .update({
        transaction_hash: transactionHash,
        processing_notes: `Transferência bancária processada. ID: ${transactionHash}`
      });

    return transactionHash;
  }

  /**
   * Processar saque crypto
   */
  static async processCryptoWithdrawal(withdrawal) {
    logger.info({ 
      withdrawalId: withdrawal.id,
      cryptoAddress: withdrawal.crypto_address,
      amount: withdrawal.net_amount 
    }, 'Processando saque crypto');

    // Integração com blockchain/exchange
    const transactionHash = `CRYPTO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db('withdrawal_requests')
      .where({ id: withdrawal.id })
      .update({
        transaction_hash: transactionHash,
        processing_notes: `Transferência crypto processada. Hash: ${transactionHash}`
      });

    return transactionHash;
  }

  /**
   * Processar transferência internacional
   */
  static async processInternationalTransfer(withdrawal) {
    logger.info({ 
      withdrawalId: withdrawal.id,
      amount: withdrawal.net_amount 
    }, 'Processando transferência internacional');

    // Integração com Wise, Remitly, etc.
    const transactionHash = `INTL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db('withdrawal_requests')
      .where({ id: withdrawal.id })
      .update({
        transaction_hash: transactionHash,
        processing_notes: `Transferência internacional processada. ID: ${transactionHash}`
      });

    return transactionHash;
  }

  /**
   * Solicitar saque de lucros do admin
   */
  static async requestAdminWithdrawal(adminId, amount, currency = 'BRL', withdrawalDetails = {}) {
    try {
      // Verificar se é admin
      const admin = await db('users').where({ id: adminId, role: 'admin' }).first();
      if (!admin) {
        throw new Error('Usuário não é administrador');
      }

      // Calcular lucros disponíveis
      const availableProfits = await this.calculateAvailableProfits(currency);
      
      if (availableProfits < amount) {
        throw new Error('Lucros insuficientes para saque');
      }

      // Criar solicitação de saque
      const [withdrawalRequest] = await db('withdrawal_requests').insert({
        user_id: adminId,
        amount,
        currency,
        withdrawal_type: 'admin_profit',
        bank_details: withdrawalDetails.bank_details || null,
        pix_key: withdrawalDetails.pix_key || null,
        crypto_address: withdrawalDetails.crypto_address || null,
        fee_amount: 0, // Admin não paga taxa
        net_amount: amount,
        status: 'pending'
      }).returning('*');

      // Processar automaticamente se dentro do limite
      const autoApprovalLimit = await this.getWithdrawalSetting('auto_approval_limit', 1000);
      
      if (amount <= autoApprovalLimit) {
        await this.processWithdrawalAutomatically(withdrawalRequest.id);
      }

      logger.info({ 
        adminId, 
        withdrawalId: withdrawalRequest.id,
        amount,
        currency 
      }, 'Saque de lucros do admin solicitado');

      return withdrawalRequest;

    } catch (error) {
      logger.error({ error, adminId, amount, currency }, 'Erro ao solicitar saque de admin');
      throw error;
    }
  }

  /**
   * Calcular lucros disponíveis para saque do admin
   */
  static async calculateAvailableProfits(currency = 'BRL') {
    const [
      totalRevenue,
      totalCommissions,
      totalWithdrawals,
      totalAdminWithdrawals
    ] = await Promise.all([
      // Receita total de pagamentos
      db('payments')
        .where({ status: 'succeeded', currency })
        .whereIn('type', ['subscription', 'prepaid'])
        .sum('amount as total')
        .first(),

      // Comissões pagas
      db('affiliate_commissions')
        .where({ status: 'paid', currency: currency.toLowerCase() })
        .sum('commission_amount as total')
        .first(),

      // Saques de usuários
      db('withdrawal_requests')
        .where({ status: 'completed', currency, withdrawal_type: 'user_prepaid' })
        .sum('net_amount as total')
        .first(),

      // Saques já realizados pelo admin
      db('withdrawal_requests')
        .where({ status: 'completed', currency, withdrawal_type: 'admin_profit' })
        .sum('net_amount as total')
        .first()
    ]);

    const revenue = parseFloat(totalRevenue.total || 0);
    const commissions = parseFloat(totalCommissions.total || 0);
    const userWithdrawals = parseFloat(totalWithdrawals.total || 0);
    const adminWithdrawals = parseFloat(totalAdminWithdrawals.total || 0);

    const availableProfits = revenue - commissions - userWithdrawals - adminWithdrawals;

    return Math.max(0, availableProfits);
  }

  /**
   * Listar saques do usuário
   */
  static async getUserWithdrawals(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const withdrawals = await db('withdrawal_requests')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db('withdrawal_requests')
      .where({ user_id: userId })
      .count('* as total');

    return {
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Cancelar saque (se ainda pendente)
   */
  static async cancelWithdrawal(withdrawalId, userId) {
    try {
      return await db.transaction(async (trx) => {
        const withdrawal = await trx('withdrawal_requests')
          .where({ id: withdrawalId, user_id: userId })
          .first();

        if (!withdrawal) {
          throw new Error('Saque não encontrado');
        }

        if (withdrawal.status !== 'pending') {
          throw new Error('Saque não pode ser cancelado neste status');
        }

        // Atualizar status
        await trx('withdrawal_requests')
          .where({ id: withdrawalId })
          .update({
            status: 'cancelled',
            processing_notes: 'Cancelado pelo usuário'
          });

        // Reverter saldo
        await PaymentService.creditPrepaidBalance(
          userId,
          withdrawal.amount,
          withdrawal.currency,
          null,
          `Reversão de saque cancelado - ID: ${withdrawalId}`
        );

        logger.info({ 
          withdrawalId, 
          userId 
        }, 'Saque cancelado pelo usuário');

        return true;
      });

    } catch (error) {
      logger.error({ error, withdrawalId, userId }, 'Erro ao cancelar saque');
      throw error;
    }
  }

  /**
   * Verificar horário comercial
   */
  static isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo, 6 = sábado

    // Segunda a sexta, 9h às 18h
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

  /**
   * Buscar configuração de saque
   */
  static async getWithdrawalSetting(key, defaultValue) {
    try {
      const setting = await db('payment_settings')
        .where({ key: 'withdrawal_settings' })
        .first();

      if (setting && setting.value[key] !== undefined) {
        return setting.value[key];
      }

      return defaultValue;

    } catch (error) {
      logger.warn({ error, key }, 'Erro ao buscar configuração de saque');
      return defaultValue;
    }
  }
}
