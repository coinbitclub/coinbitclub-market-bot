import logger from '../../../common/logger.js';

/**
 * Serviço de Integração WhatsApp via Zapi
 * Para envio de notificações automáticas de saques e outras operações
 */
export class WhatsAppService {
  
  constructor() {
    this.apiKey = process.env.ZAPI_API_KEY;
    this.instanceId = process.env.ZAPI_INSTANCE_ID;
    this.baseURL = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
    this.enabled = process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true';
  }

  /**
   * Verificar se serviço está configurado
   */
  isConfigured() {
    return this.enabled && this.apiKey && this.instanceId;
  }

  /**
   * Enviar mensagem via WhatsApp
   */
  async sendMessage(phone, message, options = {}) {
    try {
      if (!this.isConfigured()) {
        logger.warn('WhatsApp não configurado, mensagem não enviada', { phone });
        return { success: false, reason: 'not_configured' };
      }

      // Formatar número de telefone
      const formattedPhone = this.formatPhoneNumber(phone);
      
      if (!formattedPhone) {
        throw new Error('Número de telefone inválido');
      }

      const payload = {
        phone: formattedPhone,
        message,
        ...options
      };

      const response = await fetch(`${this.baseURL}/v1/messages/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        logger.info('Mensagem WhatsApp enviada com sucesso', {
          phone: formattedPhone,
          messageId: result.messageId
        });

        return {
          success: true,
          message_id: result.messageId,
          phone: formattedPhone
        };
      } else {
        logger.error('Erro ao enviar mensagem WhatsApp', {
          phone: formattedPhone,
          error: result
        });

        return {
          success: false,
          error: result.error || 'Erro desconhecido',
          details: result
        };
      }

    } catch (error) {
      logger.error('Erro na integração WhatsApp:', error);
      return {
        success: false,
        error: error.message,
        reason: 'integration_error'
      };
    }
  }

  /**
   * Enviar notificação de saque aprovado
   */
  async sendWithdrawalApprovedNotification(userPhone, withdrawalData) {
    try {
      const { amount, currency, withdrawal_type, net_amount, fee_amount } = withdrawalData;

      const message = this.buildWithdrawalApprovedMessage({
        amount: parseFloat(amount),
        currency,
        withdrawal_type,
        net_amount: parseFloat(net_amount),
        fee_amount: parseFloat(fee_amount)
      });

      const result = await this.sendMessage(userPhone, message);

      return {
        ...result,
        notification_type: 'withdrawal_approved'
      };

    } catch (error) {
      logger.error('Erro ao enviar notificação de saque aprovado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificação de saque processado
   */
  async sendWithdrawalCompletedNotification(userPhone, withdrawalData) {
    try {
      const { amount, currency, withdrawal_type, net_amount, processed_at } = withdrawalData;

      const message = this.buildWithdrawalCompletedMessage({
        amount: parseFloat(amount),
        currency,
        withdrawal_type,
        net_amount: parseFloat(net_amount),
        processed_at
      });

      const result = await this.sendMessage(userPhone, message);

      return {
        ...result,
        notification_type: 'withdrawal_completed'
      };

    } catch (error) {
      logger.error('Erro ao enviar notificação de saque processado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificação de saque rejeitado
   */
  async sendWithdrawalRejectedNotification(userPhone, withdrawalData) {
    try {
      const { amount, currency, reason } = withdrawalData;

      const message = this.buildWithdrawalRejectedMessage({
        amount: parseFloat(amount),
        currency,
        reason
      });

      const result = await this.sendMessage(userPhone, message);

      return {
        ...result,
        notification_type: 'withdrawal_rejected'
      };

    } catch (error) {
      logger.error('Erro ao enviar notificação de saque rejeitado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificação de comissão de afiliado
   */
  async sendAffiliateCommissionNotification(userPhone, commissionData) {
    try {
      const { commission_amount, currency, tier_name, referred_user_name } = commissionData;

      const message = this.buildAffiliateCommissionMessage({
        commission_amount: parseFloat(commission_amount),
        currency,
        tier_name,
        referred_user_name
      });

      const result = await this.sendMessage(userPhone, message);

      return {
        ...result,
        notification_type: 'affiliate_commission'
      };

    } catch (error) {
      logger.error('Erro ao enviar notificação de comissão:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificação de pagamento recebido
   */
  async sendPaymentReceivedNotification(userPhone, paymentData) {
    try {
      const { amount, currency, type, bonus_amount } = paymentData;

      const message = this.buildPaymentReceivedMessage({
        amount: parseFloat(amount),
        currency,
        type,
        bonus_amount: bonus_amount ? parseFloat(bonus_amount) : 0
      });

      const result = await this.sendMessage(userPhone, message);

      return {
        ...result,
        notification_type: 'payment_received'
      };

    } catch (error) {
      logger.error('Erro ao enviar notificação de pagamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar alerta de operação importante
   */
  async sendOperationAlert(userPhone, operationData) {
    try {
      const { operation_type, amount, currency, result, balance_after } = operationData;

      const message = this.buildOperationAlertMessage({
        operation_type,
        amount: parseFloat(amount),
        currency,
        result,
        balance_after: parseFloat(balance_after)
      });

      const result_send = await this.sendMessage(userPhone, message);

      return {
        ...result_send,
        notification_type: 'operation_alert'
      };

    } catch (error) {
      logger.error('Erro ao enviar alerta de operação:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Construir mensagem de saque aprovado
   */
  buildWithdrawalApprovedMessage({ amount, currency, withdrawal_type, net_amount, fee_amount }) {
    const currencySymbol = this.getCurrencySymbol(currency);
    const typeLabel = this.getWithdrawalTypeLabel(withdrawal_type);

    return `🟢 *SAQUE APROVADO* 🟢

✅ Seu saque foi aprovado com sucesso!

💰 *Valor solicitado:* ${currencySymbol} ${amount.toFixed(2)}
💸 *Taxa:* ${currencySymbol} ${fee_amount.toFixed(2)}
💵 *Valor líquido:* ${currencySymbol} ${net_amount.toFixed(2)}
📋 *Tipo:* ${typeLabel}

⏰ O valor será processado em até 24 horas úteis.

CoinBitClub - Trading Automatizado`;
  }

  /**
   * Construir mensagem de saque processado
   */
  buildWithdrawalCompletedMessage({ amount, currency, withdrawal_type, net_amount, processed_at }) {
    const currencySymbol = this.getCurrencySymbol(currency);
    const typeLabel = this.getWithdrawalTypeLabel(withdrawal_type);
    const processedDate = new Date(processed_at).toLocaleString('pt-BR');

    return `✅ *SAQUE PROCESSADO* ✅

🎉 Seu saque foi processado com sucesso!

💵 *Valor:* ${currencySymbol} ${net_amount.toFixed(2)}
📋 *Tipo:* ${typeLabel}
📅 *Processado em:* ${processedDate}

O valor já está disponível em sua conta.

CoinBitClub - Trading Automatizado`;
  }

  /**
   * Construir mensagem de saque rejeitado
   */
  buildWithdrawalRejectedMessage({ amount, currency, reason }) {
    const currencySymbol = this.getCurrencySymbol(currency);

    return `❌ *SAQUE REJEITADO* ❌

😔 Infelizmente seu saque foi rejeitado.

💰 *Valor:* ${currencySymbol} ${amount.toFixed(2)}
📝 *Motivo:* ${reason || 'Não especificado'}

O valor foi estornado para sua conta. Entre em contato conosco para mais informações.

CoinBitClub - Trading Automatizado`;
  }

  /**
   * Construir mensagem de comissão de afiliado
   */
  buildAffiliateCommissionMessage({ commission_amount, currency, tier_name, referred_user_name }) {
    const currencySymbol = this.getCurrencySymbol(currency);

    return `💎 *NOVA COMISSÃO RECEBIDA* 💎

🎯 Parabéns! Você recebeu uma nova comissão!

💰 *Valor:* ${currencySymbol} ${commission_amount.toFixed(2)}
👤 *Usuário:* ${referred_user_name}
🏆 *Nível:* ${tier_name}

Sua comissão já está disponível para saque ou pode ser usada como crédito.

CoinBitClub - Programa de Afiliados`;
  }

  /**
   * Construir mensagem de pagamento recebido
   */
  buildPaymentReceivedMessage({ amount, currency, type, bonus_amount }) {
    const currencySymbol = this.getCurrencySymbol(currency);
    const typeLabel = type === 'subscription' ? 'Assinatura' : 'Recarga';
    
    let message = `✅ *PAGAMENTO CONFIRMADO* ✅

🎉 Seu pagamento foi processado com sucesso!

💰 *Valor:* ${currencySymbol} ${amount.toFixed(2)}
📋 *Tipo:* ${typeLabel}`;

    if (bonus_amount > 0) {
      message += `\n🎁 *Bônus:* ${currencySymbol} ${bonus_amount.toFixed(2)}`;
    }

    message += `\n\nSeu saldo já está disponível para trading!

CoinBitClub - Trading Automatizado`;

    return message;
  }

  /**
   * Construir mensagem de alerta de operação
   */
  buildOperationAlertMessage({ operation_type, amount, currency, result, balance_after }) {
    const currencySymbol = this.getCurrencySymbol(currency);
    const icon = result === 'profit' ? '📈' : '📉';
    const resultLabel = result === 'profit' ? 'LUCRO' : 'PERDA';

    return `${icon} *OPERAÇÃO CONCLUÍDA* ${icon}

📊 *Tipo:* ${operation_type.toUpperCase()}
💰 *Valor:* ${currencySymbol} ${Math.abs(amount).toFixed(2)}
📊 *Resultado:* ${resultLabel}
💵 *Saldo atual:* ${currencySymbol} ${balance_after.toFixed(2)}

CoinBitClub - Trading Automatizado`;
  }

  /**
   * Formatar número de telefone
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remover caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');

    // Se não tem código do país, adicionar 55 (Brasil)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      cleanPhone = '55' + cleanPhone;
    } else if (cleanPhone.length === 10) {
      cleanPhone = '5511' + cleanPhone;
    } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    // Validar formato final
    if (cleanPhone.length >= 12 && cleanPhone.length <= 15) {
      return cleanPhone;
    }

    return null;
  }

  /**
   * Obter símbolo da moeda
   */
  getCurrencySymbol(currency) {
    const symbols = {
      USD: '$',
      BRL: 'R$',
      EUR: '€'
    };
    return symbols[currency] || currency;
  }

  /**
   * Obter label do tipo de saque
   */
  getWithdrawalTypeLabel(type) {
    const labels = {
      prepaid_balance: 'Saldo Pré-pago',
      affiliate_commission: 'Comissão de Afiliado',
      profit_withdrawal: 'Saque de Lucros',
      emergency_withdrawal: 'Saque de Emergência'
    };
    return labels[type] || type;
  }

  /**
   * Verificar status da instância Zapi
   */
  async checkInstanceStatus() {
    try {
      if (!this.isConfigured()) {
        return { status: 'not_configured' };
      }

      const response = await fetch(`${this.baseURL}/v1/status`, {
        method: 'GET',
        headers: {
          'Client-Token': this.apiKey
        }
      });

      const result = await response.json();

      return {
        status: response.ok ? 'connected' : 'error',
        details: result
      };

    } catch (error) {
      logger.error('Erro ao verificar status da instância Zapi:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Obter informações da instância
   */
  async getInstanceInfo() {
    try {
      if (!this.isConfigured()) {
        return { error: 'WhatsApp não configurado' };
      }

      const response = await fetch(`${this.baseURL}/v1/instance`, {
        method: 'GET',
        headers: {
          'Client-Token': this.apiKey
        }
      });

      const result = await response.json();

      return result;

    } catch (error) {
      logger.error('Erro ao obter informações da instância:', error);
      return { error: error.message };
    }
  }

  /**
   * Enviar mensagem de teste
   */
  async sendTestMessage(phone) {
    const message = `🧪 *TESTE DE NOTIFICAÇÃO* 🧪

Esta é uma mensagem de teste do sistema de notificações WhatsApp.

✅ Se você recebeu esta mensagem, as notificações estão funcionando corretamente!

CoinBitClub - Sistema de Notificações`;

    return await this.sendMessage(phone, message);
  }

  /**
   * Validar configuração do WhatsApp
   */
  validateConfiguration() {
    const issues = [];

    if (!this.enabled) {
      issues.push('Notificações WhatsApp estão desabilitadas');
    }

    if (!this.apiKey) {
      issues.push('ZAPI_API_KEY não configurada');
    }

    if (!this.instanceId) {
      issues.push('ZAPI_INSTANCE_ID não configurada');
    }

    if (!this.baseURL) {
      issues.push('ZAPI_BASE_URL não configurada');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Obter estatísticas de envio
   */
  async getMessagingStats() {
    // Este método pode ser implementado para coletar estatísticas
    // de mensagens enviadas, falhas, etc.
    return {
      total_sent: 0,
      total_failed: 0,
      last_24h: 0,
      implementation_needed: true
    };
  }
}

export default WhatsAppService;
