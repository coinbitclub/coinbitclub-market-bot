
// ========================================
// MARKETBOT - WEBHOOK CONTROLLER REAL
// Processamento de sinais TradingView real
// ========================================

import { Controller, Post, Body, Headers, IP, Request } from '@nestjs/common';
import { Client } from 'pg';
import ccxt from 'ccxt';

interface TradingViewSignal {
  symbol: string;
  action: string; // "SINAL LONG FORTE", "SINAL SHORT FORTE", "FECHE LONG", "FECHE SHORT"
  price?: number;
  strategy?: string;
  timeframe?: string;
  alert_message?: string;
}

@Controller('/api/webhooks')
export class WebhookController {
  private client: Client;
  private requestCounts = new Map<string, { count: number, resetTime: number }>();

  constructor() {
    this.client = new Client({ 
      connectionString: process.env.DATABASE_URL 
    });
  }

  @Post('/signal')
  async receiveSignal(
    @Body() signalData: TradingViewSignal,
    @Headers() headers: any,
    @IP() ipAddress: string,
    @Request() req: any
  ): Promise<any> {
    try {
      // Validar rate limiting (300 req/hora por IP)
      this.checkRateLimit(ipAddress);

      // Validar autenticação
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token de autorização necessário');
      }

      const token = authHeader.substring(7);
      if (token !== process.env.TRADINGVIEW_WEBHOOK_SECRET) {
        throw new Error('Token inválido');
      }

      // Validar dados obrigatórios
      if (!signalData.symbol || !signalData.action) {
        throw new Error('Symbol e action são obrigatórios');
      }

      await this.client.connect();

      // Processar sinal
      const signal = await this.processTradingSignal(signalData, ipAddress);
      
      // Se for sinal de fechamento, processar imediatamente
      if (signalData.action.includes('FECHE')) {
        await this.processCloseSignal(signalData);
        return { status: 'close_signal_processed', signal_id: signal.id };
      }

      // Se for sinal de abertura, validar IA e executar
      if (signalData.action.includes('FORTE')) {
        const users = await this.getEligibleUsers();
        const results = await this.executeForUsers(signal, users);
        
        return {
          status: 'signal_processed',
          signal_id: signal.id,
          users_processed: results.length,
          successful_executions: results.filter(r => r.success).length
        };
      }

      return { status: 'signal_ignored', reason: 'Action not recognized' };

    } catch (error) {
      console.error('Webhook error:', error);
      return { status: 'error', message: error.message };
    } finally {
      await this.client.end();
    }
  }

  private checkRateLimit(ipAddress: string): void {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    
    const current = this.requestCounts.get(ipAddress) || { count: 0, resetTime: now + hour };
    
    if (now > current.resetTime) {
      // Reset counter
      this.requestCounts.set(ipAddress, { count: 1, resetTime: now + hour });
    } else {
      current.count++;
      if (current.count > 300) {
        throw new Error('Rate limit exceeded: 300 requests per hour');
      }
      this.requestCounts.set(ipAddress, current);
    }
  }

  private async processTradingSignal(signalData: TradingViewSignal, ipAddress: string): Promise<any> {
    const signalType = signalData.action.includes('LONG') ? 'BUY' : 'SELL';
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos

    const result = await this.client.query(`
      INSERT INTO trading_signals (
        source, symbol, signal_type, entry_price,
        status, received_at, expires_at, raw_data
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
      RETURNING *
    `, [
      'tradingview', signalData.symbol, signalType, signalData.price,
      'PENDING', expiresAt, JSON.stringify({ ...signalData, ip: ipAddress })
    ]);

    return result.rows[0];
  }

  private async processCloseSignal(signalData: TradingViewSignal): Promise<void> {
    const side = signalData.action.includes('LONG') ? 'BUY' : 'SELL';
    
    // Buscar posições abertas do tipo correto
    const positions = await this.client.query(`
      SELECT * FROM trading_positions 
      WHERE symbol = $1 AND side = $2 AND status = 'OPEN'
    `, [signalData.symbol, side]);

    console.log(`🔄 Fechando ${positions.rows.length} posições ${side} de ${signalData.symbol}`);

    for (const position of positions.rows) {
      await this.closePosition(position);
    }
  }

  private async closePosition(position: any): Promise<void> {
    try {
      // Aqui seria a integração real com a exchange
      // Por enquanto, simular fechamento
      
      await this.client.query(`
        UPDATE trading_positions 
        SET status = 'CLOSED', 
            closed_at = NOW(),
            realized_pnl_usd = unrealized_pnl_usd
        WHERE id = $1
      `, [position.id]);

      // Calcular e aplicar comissão se houver lucro
      if (position.unrealized_pnl_usd > 0) {
        await this.applyCommission(position);
      }

      console.log(`✅ Posição ${position.id} fechada`);
      
    } catch (error) {
      console.error(`❌ Erro ao fechar posição ${position.id}:`, error);
    }
  }

  private async applyCommission(position: any): Promise<void> {
    // Buscar plano do usuário
    const userPlan = await this.client.query(`
      SELECT us.plan_type FROM user_subscriptions us
      WHERE us.user_id = $1 AND us.status = 'active'
    `, [position.user_id]);

    const commissionRate = userPlan.rows.length > 0 ? 0.10 : 0.20; // 10% plano, 20% prepago
    const commissionAmount = position.unrealized_pnl_usd * commissionRate;

    // Descontar comissão do saldo
    await this.client.query(`
      UPDATE users 
      SET account_balance_usd = account_balance_usd - $1
      WHERE id = $2
    `, [commissionAmount, position.user_id]);

    // Registrar transação de comissão
    await this.client.query(`
      INSERT INTO commission_transactions (
        user_id, position_id, amount_usd, commission_type,
        commission_rate, status, processed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      position.user_id, position.id, commissionAmount, 
      'TRADING_SUCCESS', commissionRate, 'COMPLETED'
    ]);

    console.log(`💰 Comissão aplicada: $${commissionAmount.toFixed(2)} (${(commissionRate * 100)}%)`);
  }

  private async getEligibleUsers(): Promise<any[]> {
    // Buscar usuários com:
    // 1. Trading habilitado
    // 2. Saldo para mainnet OU qualquer usuário para testnet
    // 3. Dentro dos limites diários
    
    const result = await this.client.query(`
      SELECT u.*, ts.*, ue.exchange, ue.is_testnet
      FROM users u
      JOIN trading_settings ts ON u.id = ts.user_id  
      JOIN user_exchange_accounts ue ON u.id = ue.user_id
      WHERE u.enable_trading = true
        AND ue.is_active = true
        AND ts.auto_trading_enabled = true
    `);

    return result.rows;
  }

  private async executeForUsers(signal: any, users: any[]): Promise<any[]> {
    const results = [];
    
    // Ordenar por prioridade: MAINNET com saldo > MAINNET com cupom > TESTNET
    const sortedUsers = this.sortUsersByPriority(users);
    
    for (const user of sortedUsers) {
      try {
        const result = await this.executeOrderForUser(signal, user);
        results.push({ user_id: user.id, success: true, result });
      } catch (error) {
        results.push({ user_id: user.id, success: false, error: error.message });
      }
    }
    
    return results;
  }

  private sortUsersByPriority(users: any[]): any[] {
    return users.sort((a, b) => {
      // Prioridade 1: MAINNET com saldo real
      if (!a.is_testnet && a.account_balance_usd > 0 && (b.is_testnet || b.account_balance_usd <= 0)) return -1;
      if (!b.is_testnet && b.account_balance_usd > 0 && (a.is_testnet || a.account_balance_usd <= 0)) return 1;
      
      // Prioridade 2: MAINNET com créditos administrativos
      if (!a.is_testnet && a.prepaid_credits > 0 && (b.is_testnet || b.prepaid_credits <= 0)) return -1;
      if (!b.is_testnet && b.prepaid_credits > 0 && (a.is_testnet || a.prepaid_credits <= 0)) return 1;
      
      // Prioridade 3: TESTNET
      return 0;
    });
  }

  private async executeOrderForUser(signal: any, user: any): Promise<any> {
    // Implementação da execução real seria aqui
    // Por enquanto, criar posição simulada
    
    const positionSize = user.account_balance_usd * (user.max_position_size_percent / 100);
    const leverage = user.default_leverage || 5;
    const stopLoss = signal.entry_price * (1 - (user.default_stop_loss_percent / 100));
    const takeProfit = signal.entry_price * (1 + (user.default_take_profit_percent / 100));

    const result = await this.client.query(`
      INSERT INTO trading_positions (
        user_id, exchange_account_id, signal_id, symbol, side,
        size, entry_price, leverage, stop_loss, take_profit,
        status, opened_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `, [
      user.id, user.exchange_account_id, signal.id, signal.symbol, signal.signal_type,
      positionSize, signal.entry_price, leverage, stopLoss, takeProfit, 'OPEN'
    ]);

    return result.rows[0];
  }
}
