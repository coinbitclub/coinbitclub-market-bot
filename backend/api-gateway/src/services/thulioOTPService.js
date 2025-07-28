// Serviço Thulio SMS OTP
// Integração para autenticação OTP via SMS

import https from 'https';
import crypto from 'crypto';

class ThulioOTPService {
  constructor() {
    this.baseURL = 'https://api.thulio.io/v1'; // URL base do Thulio para SMS
    this.apiKey = process.env.THULIO_API_KEY;
    this.senderName = process.env.THULIO_SENDER_NAME || 'CoinBitClub';
    this.otpCodeStore = new Map(); // Armazenamento temporário dos códigos OTP
  }

  // Gerar código OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
  }

  // Enviar OTP via SMS
  async sendOTP(phoneNumber, email) {
    try {
      const otp = this.generateOTP();
      const expirationTime = Date.now() + (5 * 60 * 1000); // 5 minutos

      // Armazenar OTP temporariamente
      this.otpCodeStore.set(email, {
        code: otp,
        phone: phoneNumber,
        expires: expirationTime,
        attempts: 0
      });

      // Formato da mensagem SMS
      const message = `CoinBitClub - Seu codigo de verificacao: ${otp}. Valido por 5 minutos. Nao compartilhe.`;

      // Enviar via Thulio SMS API
      const response = await this.makeThulioRequest('/sms', {
        method: 'POST',
        data: {
          from: this.senderName,
          to: phoneNumber,
          message: message
        }
      });

      console.log(`📱 OTP enviado via SMS Thulio para ${phoneNumber}: ${otp}`);
      
      return {
        success: true,
        message: 'Código OTP enviado via SMS',
        service: 'Thulio SMS API',
        expiresIn: '5 minutos'
      };

    } catch (error) {
      console.error('Erro ao enviar OTP via SMS Thulio:', error);
      throw new Error('Falha ao enviar código via SMS');
    }
  }

  // Verificar código OTP
  async verifyOTP(email, code) {
    const otpData = this.otpCodeStore.get(email);
    
    if (!otpData) {
      throw new Error('Código não encontrado ou expirado');
    }

    if (Date.now() > otpData.expires) {
      this.otpCodeStore.delete(email);
      throw new Error('Código expirado. Solicite um novo código.');
    }

    if (otpData.attempts >= 3) {
      this.otpCodeStore.delete(email);
      throw new Error('Muitas tentativas. Solicite um novo código.');
    }

    if (otpData.code !== code) {
      otpData.attempts++;
      throw new Error('Código inválido');
    }

    // Código válido - remover da memória
    this.otpCodeStore.delete(email);
    
    return {
      success: true,
      message: 'Código verificado com sucesso',
      verified: true
    };
  }

  // Fazer requisição para API do Thulio
  async makeThulioRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseURL);
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'CoinBitClub-Bot/1.0'
        }
      };

      const req = https.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`Thulio API Error: ${response.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.data) {
        req.write(JSON.stringify(options.data));
      }

      req.end();
    });
  }

  // Limpar códigos expirados (executar periodicamente)
  cleanExpiredCodes() {
    const now = Date.now();
    for (const [email, otpData] of this.otpCodeStore.entries()) {
      if (now > otpData.expires) {
        this.otpCodeStore.delete(email);
      }
    }
  }

  // Obter status do serviço
  async getStatus() {
    try {
      const response = await this.makeThulioRequest('/account');
      return {
        service: 'Thulio SMS API',
        status: 'connected',
        sender: this.senderName,
        online: true,
        balance: response.balance || 'N/A'
      };
    } catch (error) {
      return {
        service: 'Thulio SMS API',
        status: 'error',
        error: error.message,
        online: false
      };
    }
  }
}

// Exportar instância singleton
export const thulioOTP = new ThulioOTPService();

// Limpar códigos expirados a cada 10 minutos
setInterval(() => {
  thulioOTP.cleanExpiredCodes();
}, 10 * 60 * 1000);
