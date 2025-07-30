// Integração com Z-API para WhatsApp e SMS
export interface ZAPIMessage {
  phone: string;
  message: string;
  messageId?: string;
}

export interface ZAPIResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface ZAPIWebhook {
  instanceId: string;
  messageId: string;
  phone: string;
  fromMe: boolean;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  textMessage?: {
    message: string;
  };
  timestamp: number;
}

export interface NotificationTemplate {
  type: 'ai_report' | 'trade_alert' | 'balance_update' | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

class ZAPIService {
  private instanceId: string;

  private token: string;

  private baseUrl = 'https://api.z-api.io/instances';

  constructor() {
    this.instanceId = process.env.ZAPI_INSTANCE || '';
    this.token = process.env.ZAPI_TOKEN || '';
    
    if (!this.instanceId || !this.token) {
      console.warn('Z-API credentials not configured');
    }
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.instanceId}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Client-Token': this.token,
          'Content-Type': 'application/json'
        },
        ...(data && { body: JSON.stringify(data) })
      });

      if (!response.ok) {
        throw new Error(`Z-API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Z-API request failed:', error);
      throw error;
    }
  }

  // Enviar mensagem de texto via WhatsApp
  async sendWhatsAppMessage(phone: string, message: string): Promise<ZAPIResponse> {
    try {
      // Formatar número para padrão internacional
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const data = await this.makeRequest('/token/send-text', 'POST', {
        phone: formattedPhone,
        message
      });

      return {
        success: true,
        messageId: data.messageId,
        details: data
      };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar mensagem com botões (WhatsApp Business)
  async sendWhatsAppButtons(
    phone: string,
    message: string,
    buttons: { id: string; text: string }[]
  ): Promise<ZAPIResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const data = await this.makeRequest('/token/send-button-list', 'POST', {
        phone: formattedPhone,
        message,
        buttonList: {
          buttons: buttons.map(btn => ({
            id: btn.id,
            text: btn.text
          }))
        }
      });

      return {
        success: true,
        messageId: data.messageId,
        details: data
      };
    } catch (error) {
      console.error('Erro ao enviar botões WhatsApp:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar SMS
  async sendSMS(phone: string, message: string): Promise<ZAPIResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Z-API não tem SMS nativo, vamos usar WhatsApp como alternativa
      // Para SMS real, integraria com outro provedor como Twilio
      return await this.sendWhatsAppMessage(formattedPhone, `📱 SMS: ${message}`);
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar relatório IA por WhatsApp
  async sendAIReport(phone: string, report: {
    title: string;
    summary: string;
    fullReport?: string;
  }): Promise<ZAPIResponse> {
    try {
      const message = `
🦅 *${report.title}*

📋 *Resumo:*
${report.summary}

⏰ Gerado em: ${new Date().toLocaleString('pt-BR')}

${report.fullReport ? '📄 Relatório completo disponível no seu dashboard.' : ''}

🔗 Acesse: ${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard
      `.trim();

      return await this.sendWhatsAppMessage(phone, message);
    } catch (error) {
      console.error('Erro ao enviar relatório IA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar alerta de trade
  async sendTradeAlert(phone: string, alert: {
    symbol: string;
    action: 'buy' | 'sell' | 'close';
    price: number;
    quantity: number;
    result?: 'profit' | 'loss';
    amount?: number;
  }): Promise<ZAPIResponse> {
    try {
      const emoji = alert.action === 'buy' ? '🟢' : alert.action === 'sell' ? '🔴' : '⚪';
      const actionText = alert.action === 'buy' ? 'COMPRA' : alert.action === 'sell' ? 'VENDA' : 'FECHAMENTO';
      
      let message = `
${emoji} *ALERTA DE TRADE*

📊 Par: *${alert.symbol}*
🎯 Ação: *${actionText}*
💰 Preço: *$${alert.price.toFixed(4)}*
📏 Quantidade: *${alert.quantity}*
      `;

      if (alert.result && alert.amount) {
        const resultEmoji = alert.result === 'profit' ? '🎉' : '📉';
        const resultText = alert.result === 'profit' ? 'LUCRO' : 'PREJUÍZO';
        message += `
${resultEmoji} Resultado: *${resultText}*
💵 Valor: *$${Math.abs(alert.amount).toFixed(2)}*
        `;
      }

      message += `
⏰ ${new Date().toLocaleString('pt-BR')}
🔗 Ver detalhes: ${process.env.NEXT_PUBLIC_APP_URL}/user/operations
      `.trim();

      return await this.sendWhatsAppMessage(phone, message);
    } catch (error) {
      console.error('Erro ao enviar alerta de trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar alerta de saldo
  async sendBalanceAlert(phone: string, balance: {
    current: number;
    previous: number;
    type: 'deposit' | 'withdrawal' | 'profit' | 'loss';
  }): Promise<ZAPIResponse> {
    try {
      const emoji = balance.type === 'deposit' || balance.type === 'profit' ? '📈' : '📉';
      const typeText = {
        deposit: 'DEPÓSITO',
        withdrawal: 'SAQUE',
        profit: 'LUCRO',
        loss: 'PREJUÍZO'
      }[balance.type];

      const change = balance.current - balance.previous;
      const changeText = change >= 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`;

      const message = `
${emoji} *ATUALIZAÇÃO DE SALDO*

💰 Saldo Atual: *$${balance.current.toFixed(2)}*
📊 Variação: *${changeText}*
🏷️ Tipo: *${typeText}*

⏰ ${new Date().toLocaleString('pt-BR')}
🔗 Ver dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard
      `.trim();

      return await this.sendWhatsAppMessage(phone, message);
    } catch (error) {
      console.error('Erro ao enviar alerta de saldo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Verificar status da instância
  async getInstanceStatus(): Promise<{
    connected: boolean;
    battery?: number;
    phone?: string;
  }> {
    try {
      const data = await this.makeRequest('/token/status', 'GET');
      
      return {
        connected: data.connected || false,
        battery: data.battery,
        phone: data.phone
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { connected: false };
    }
  }

  // Obter QR Code para conectar WhatsApp
  async getQRCode(): Promise<string | null> {
    try {
      const data = await this.makeRequest('/token/qr-code', 'GET');
      return data.qrcode || null;
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return null;
    }
  }

  // Desconectar instância
  async disconnect(): Promise<boolean> {
    try {
      await this.makeRequest('/token/disconnect', 'POST');
      return true;
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      return false;
    }
  }

  // Formatar número de telefone para padrão internacional
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se começar com 55 (Brasil), mantém
    if (cleanPhone.startsWith('55')) {
      return cleanPhone;
    }
    
    // Se for número brasileiro sem código do país, adiciona 55
    if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      return `55${cleanPhone}`;
    }
    
    // Se for número brasileiro com DDD, adiciona 55
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      return `55${cleanPhone}`;
    }
    
    return cleanPhone;
  }

  // Validar número de WhatsApp
  async validateWhatsAppNumber(phone: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const data = await this.makeRequest('/token/phone-exists', 'POST', {
        phone: formattedPhone
      });
      
      return data.exists || false;
    } catch (error) {
      console.error('Erro ao validar número:', error);
      return false;
    }
  }
}

// Instância singleton
export const zapiService = new ZAPIService();

// Templates de mensagens pré-definidos
export const MessageTemplates = {
  welcomeMessage: (userName: string) => `
🎉 *Bem-vindo ao CoinBitClub, ${userName}!*

Sua conta foi criada com sucesso. Agora você pode:

📈 Receber sinais de trading em tempo real
🤖 Acessar análises de IA exclusivas
💰 Acompanhar seus resultados
🎯 Configurar alertas personalizados

🔗 Acesse seu dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard

Dúvidas? Digite *AJUDA* a qualquer momento.
  `.trim(),

  trialExpiring: (daysLeft: number) => `
⏰ *Seu período de teste expira em ${daysLeft} dias*

Para continuar aproveitando todos os recursos:

🎯 Escolha um plano que se adeque ao seu perfil
💎 Mantenha acesso a sinais premium
🚀 Continue recebendo análises de IA

🔗 Renovar agora: ${process.env.NEXT_PUBLIC_APP_URL}/user/plans

Não perca essa oportunidade!
  `.trim(),

  systemMaintenance: (startTime: string, duration: string) => `
🔧 *Manutenção Programada*

🕐 Início: ${startTime}
⏱️ Duração estimada: ${duration}

Durante este período:
• Sistema pode ficar indisponível
• Sinais serão mantidos em fila
• Notificações podem atrasar

Obrigado pela compreensão! 🙏
  `.trim(),

  helpMessage: () => `
🆘 *Central de Ajuda - CoinBitClub*

*Comandos disponíveis:*
📊 *SALDO* - Ver saldo atual
📈 *TRADES* - Últimas operações
📋 *RELATORIO* - Último relatório IA
⚙️ *CONFIG* - Configurações
📞 *SUPORTE* - Falar com suporte

🌐 Dashboard completo: ${process.env.NEXT_PUBLIC_APP_URL}
📞 Suporte: WhatsApp ou email

Estamos aqui para ajudar! 🚀
  `.trim()
};

// Função para verificar se Z-API está configurado
export function isZAPIConfigured(): boolean {
  return !!(process.env.ZAPI_INSTANCE && process.env.ZAPI_TOKEN);
}

// Função para formatar telefone brasileiro
export function formatBrazilianPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}
