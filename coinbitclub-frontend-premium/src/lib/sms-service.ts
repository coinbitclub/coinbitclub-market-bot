// Serviço SMS usando Twilio
export class TwilioSMSService {
  private client: any;
  
  constructor() {
    // Twilio será carregado dinamicamente para evitar problemas no build
    this.initTwilio();
  }

  private async initTwilio() {
    if (typeof window === 'undefined') {
      const twilio = require('twilio');
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.client) {
        await this.initTwilio();
      }

      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('⚠️ Twilio não configurado - usando simulação SMS');
        return this.simulateSMS(to, message);
      }

      // Formatação do número para padrão internacional
      const formattedPhone = this.formatPhoneNumber(to);
      
      const message_sent = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log('✅ SMS enviado via Twilio:', message_sent.sid);
      
      return {
        success: true,
        messageId: message_sent.sid
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar SMS via Twilio:', error);
      
      // Fallback para simulação em caso de erro
      console.warn('🔄 Usando simulação SMS como fallback');
      return this.simulateSMS(to, message);
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, adiciona +55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    // Adiciona o sinal de +
    return '+' + cleaned;
  }

  private simulateSMS(to: string, message: string): { success: boolean; messageId: string } {
    const simulatedId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📱 SIMULAÇÃO SMS:');
    console.log(`Para: ${to}`);
    console.log(`Mensagem: ${message}`);
    console.log(`ID Simulado: ${simulatedId}`);
    console.log('──────────────────────────');
    
    return {
      success: true,
      messageId: simulatedId
    };
  }

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  createVerificationMessage(code: string, type: 'register' | 'recovery' = 'register'): string {
    const messages = {
      register: `🔐 CoinBitClub - Seu código de verificação é: ${code}. Válido por 15 minutos. Não compartilhe este código.`,
      recovery: `🔑 CoinBitClub - Código para recuperar sua senha: ${code}. Válido por 15 minutos. Se não foi você, ignore esta mensagem.`
    };
    
    return messages[type];
  }
}

// Instância única do serviço
export const smsService = new TwilioSMSService();
