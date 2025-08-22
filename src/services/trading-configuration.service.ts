// ========================================
// MARKETBOT - TRADING CONFIGURATION SERVICE
// Sistema de configurações alteráveis pelo admin
// ========================================

import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { EventEmitter } from 'events';

export interface TradingConfig {
  // Configurações de Alavancagem
  min_leverage: number;
  max_leverage: number;
  default_leverage: number;
  
  // Configurações de Stop Loss
  min_stop_loss_multiplier: number;
  max_stop_loss_multiplier: number;
  default_stop_loss_multiplier: number;
  
  // Configurações de Take Profit
  min_take_profit_multiplier: number;
  max_take_profit_multiplier: number;
  default_take_profit_multiplier: number;
  
  // Configurações de Posição
  min_position_size_percent: number;
  max_position_size_percent: number;
  default_position_size_percent: number;
  
  // Limitações Operacionais
  max_simultaneous_positions: number;
  coin_lock_duration_minutes: number;
  
  // Configurações de Risco
  max_daily_loss_percent: number;
  max_weekly_loss_percent: number;
  required_2fa_for_trades: boolean;
  
  // Configurações da Exchange
  default_exchange: string;
  api_timeout_seconds: number;
  rate_limit_per_minute: number;
  
  // Configurações do Sistema
  enable_paper_trading: boolean;
  enable_real_trading: boolean;
  maintenance_mode: boolean;
  
  // Metadados
  updated_by: string;
  updated_at: Date;
  version: number;
}

export interface TradingLimits {
  user_id: string;
  daily_loss_limit_usd: number;
  weekly_loss_limit_usd: number;
  max_position_size_usd: number;
  max_simultaneous_positions: number;
  custom_leverage_limit: number;
  is_vip: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: Date;
  updated_at: Date;
}

export interface ConfigurationAudit {
  id: string;
  config_key: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  change_reason: string;
  timestamp: Date;
  ip_address: string;
}

export class TradingConfigurationService extends EventEmitter {
  private static instance: TradingConfigurationService;
  private db: Pool;
  private configCache: TradingConfig | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    super();
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
  }

  static getInstance(): TradingConfigurationService {
    if (!TradingConfigurationService.instance) {
      TradingConfigurationService.instance = new TradingConfigurationService();
    }
    return TradingConfigurationService.instance;
  }

  // ========================================
  // CONFIGURAÇÕES PRINCIPAIS
  // ========================================

  async getTradingConfig(): Promise<TradingConfig> {
    // Verificar cache
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      const result = await this.db.query(`
        SELECT config_data 
        FROM trading_configurations 
        WHERE is_active = true 
        ORDER BY version DESC 
        LIMIT 1
      `);

      let config: TradingConfig;

      if (result.rows.length === 0) {
        // Criar configuração padrão se não existir
        config = await this.createDefaultConfig();
      } else {
        config = result.rows[0].config_data as TradingConfig;
      }

      // Atualizar cache
      this.configCache = config;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      return config;
    } catch (error) {
      console.error('❌ Erro ao buscar configuração de trading:', error);
      throw error;
    }
  }

  async updateTradingConfig(
    updates: Partial<TradingConfig>, 
    adminUserId: string, 
    reason: string,
    ipAddress: string
  ): Promise<TradingConfig> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar configuração atual
      const currentConfig = await this.getTradingConfig();
      
      // Validar mudanças
      const validatedUpdates = await this.validateConfigUpdates(updates, currentConfig);
      
      // Criar nova versão da configuração
      const newConfig: TradingConfig = {
        ...currentConfig,
        ...validatedUpdates,
        updated_by: adminUserId,
        updated_at: new Date(),
        version: currentConfig.version + 1
      };

      // Desativar configuração anterior
      await client.query(`
        UPDATE trading_configurations 
        SET is_active = false 
        WHERE is_active = true
      `);

      // Inserir nova configuração
      await client.query(`
        INSERT INTO trading_configurations (
          config_data, 
          version, 
          updated_by, 
          is_active,
          created_at
        ) VALUES ($1, $2, $3, true, NOW())
      `, [JSON.stringify(newConfig), newConfig.version, adminUserId]);

      // Registrar auditoria para cada mudança
      for (const [key, newValue] of Object.entries(validatedUpdates)) {
        if (key in currentConfig && (currentConfig as any)[key] !== newValue) {
          await this.logConfigChange(
            client,
            key,
            (currentConfig as any)[key],
            newValue,
            adminUserId,
            reason,
            ipAddress
          );
        }
      }

      await client.query('COMMIT');

      // Limpar cache
      this.configCache = null;
      this.cacheExpiry = 0;

      // Emitir evento de mudança
      this.emit('config_updated', {
        oldConfig: currentConfig,
        newConfig,
        updates: validatedUpdates,
        updatedBy: adminUserId
      });

      console.log(`✅ Configuração de trading atualizada por ${adminUserId}`);
      console.log('Mudanças:', validatedUpdates);

      return newConfig;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao atualizar configuração:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // LIMITAÇÕES POR USUÁRIO
  // ========================================

  async getUserTradingLimits(userId: string): Promise<TradingLimits | null> {
    try {
      const result = await this.db.query(`
        SELECT * FROM user_trading_limits 
        WHERE user_id = $1
      `, [userId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ Erro ao buscar limites do usuário:', error);
      throw error;
    }
  }

  async setUserTradingLimits(
    userId: string, 
    limits: Partial<TradingLimits>,
    adminUserId: string
  ): Promise<TradingLimits> {
    try {
      const existingLimits = await this.getUserTradingLimits(userId);
      
      const newLimits: TradingLimits = {
        user_id: userId,
        daily_loss_limit_usd: limits.daily_loss_limit_usd || 1000,
        weekly_loss_limit_usd: limits.weekly_loss_limit_usd || 5000,
        max_position_size_usd: limits.max_position_size_usd || 500,
        max_simultaneous_positions: limits.max_simultaneous_positions || 2,
        custom_leverage_limit: limits.custom_leverage_limit || 10,
        is_vip: limits.is_vip || false,
        risk_level: limits.risk_level || 'MEDIUM',
        created_at: existingLimits?.created_at || new Date(),
        updated_at: new Date()
      };

      if (existingLimits) {
        // Atualizar existente
        await this.db.query(`
          UPDATE user_trading_limits 
          SET 
            daily_loss_limit_usd = $2,
            weekly_loss_limit_usd = $3,
            max_position_size_usd = $4,
            max_simultaneous_positions = $5,
            custom_leverage_limit = $6,
            is_vip = $7,
            risk_level = $8,
            updated_at = NOW()
          WHERE user_id = $1
        `, [
          userId,
          newLimits.daily_loss_limit_usd,
          newLimits.weekly_loss_limit_usd,
          newLimits.max_position_size_usd,
          newLimits.max_simultaneous_positions,
          newLimits.custom_leverage_limit,
          newLimits.is_vip,
          newLimits.risk_level
        ]);
      } else {
        // Criar novo
        await this.db.query(`
          INSERT INTO user_trading_limits (
            user_id, daily_loss_limit_usd, weekly_loss_limit_usd,
            max_position_size_usd, max_simultaneous_positions,
            custom_leverage_limit, is_vip, risk_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          userId,
          newLimits.daily_loss_limit_usd,
          newLimits.weekly_loss_limit_usd,
          newLimits.max_position_size_usd,
          newLimits.max_simultaneous_positions,
          newLimits.custom_leverage_limit,
          newLimits.is_vip,
          newLimits.risk_level
        ]);
      }

      console.log(`✅ Limites de trading definidos para usuário ${userId} por admin ${adminUserId}`);
      return newLimits;

    } catch (error) {
      console.error('❌ Erro ao definir limites do usuário:', error);
      throw error;
    }
  }

  // ========================================
  // VALIDAÇÕES DE CONFIGURAÇÃO
  // ========================================

  private async validateConfigUpdates(
    updates: Partial<TradingConfig>, 
    currentConfig: TradingConfig
  ): Promise<Partial<TradingConfig>> {
    const validated: Partial<TradingConfig> = {};

    // Validar alavancagem
    if (updates.min_leverage !== undefined) {
      if (updates.min_leverage < 1 || updates.min_leverage > 20) {
        throw new Error('Alavancagem mínima deve estar entre 1x e 20x');
      }
      validated.min_leverage = updates.min_leverage;
    }

    if (updates.max_leverage !== undefined) {
      if (updates.max_leverage < 1 || updates.max_leverage > 20) {
        throw new Error('Alavancagem máxima deve estar entre 1x e 20x');
      }
      if (updates.max_leverage < (validated.min_leverage || currentConfig.min_leverage)) {
        throw new Error('Alavancagem máxima não pode ser menor que a mínima');
      }
      validated.max_leverage = updates.max_leverage;
    }

    // Validar stop loss
    if (updates.min_stop_loss_multiplier !== undefined) {
      if (updates.min_stop_loss_multiplier < 1.5 || updates.min_stop_loss_multiplier > 10) {
        throw new Error('Multiplicador de stop loss mínimo deve estar entre 1.5x e 10x');
      }
      validated.min_stop_loss_multiplier = updates.min_stop_loss_multiplier;
    }

    // Validar take profit
    if (updates.min_take_profit_multiplier !== undefined) {
      if (updates.min_take_profit_multiplier < 2 || updates.min_take_profit_multiplier > 15) {
        throw new Error('Multiplicador de take profit mínimo deve estar entre 2x e 15x');
      }
      validated.min_take_profit_multiplier = updates.min_take_profit_multiplier;
    }

    // Validar tamanho de posição
    if (updates.min_position_size_percent !== undefined) {
      if (updates.min_position_size_percent < 5 || updates.min_position_size_percent > 100) {
        throw new Error('Tamanho mínimo de posição deve estar entre 5% e 100%');
      }
      validated.min_position_size_percent = updates.min_position_size_percent;
    }

    if (updates.max_position_size_percent !== undefined) {
      if (updates.max_position_size_percent < 5 || updates.max_position_size_percent > 100) {
        throw new Error('Tamanho máximo de posição deve estar entre 5% e 100%');
      }
      validated.max_position_size_percent = updates.max_position_size_percent;
    }

    // Validar limites operacionais
    if (updates.max_simultaneous_positions !== undefined) {
      if (updates.max_simultaneous_positions < 1 || updates.max_simultaneous_positions > 10) {
        throw new Error('Máximo de posições simultâneas deve estar entre 1 e 10');
      }
      validated.max_simultaneous_positions = updates.max_simultaneous_positions;
    }

    if (updates.coin_lock_duration_minutes !== undefined) {
      if (updates.coin_lock_duration_minutes < 30 || updates.coin_lock_duration_minutes > 480) {
        throw new Error('Duração do bloqueio de moeda deve estar entre 30 e 480 minutos');
      }
      validated.coin_lock_duration_minutes = updates.coin_lock_duration_minutes;
    }

    // Copiar outras configurações válidas
    const simpleFields = [
      'default_leverage', 'max_stop_loss_multiplier', 'default_stop_loss_multiplier',
      'max_take_profit_multiplier', 'default_take_profit_multiplier', 
      'default_position_size_percent', 'max_daily_loss_percent', 'max_weekly_loss_percent',
      'required_2fa_for_trades', 'default_exchange', 'api_timeout_seconds',
      'rate_limit_per_minute', 'enable_paper_trading', 'enable_real_trading',
      'maintenance_mode'
    ];

    for (const field of simpleFields) {
      if (updates[field as keyof TradingConfig] !== undefined) {
        (validated as any)[field] = updates[field as keyof TradingConfig];
      }
    }

    return validated;
  }

  // ========================================
  // CONFIGURAÇÃO PADRÃO
  // ========================================

  private async createDefaultConfig(): Promise<TradingConfig> {
    const defaultConfig: TradingConfig = {
      // Alavancagem
      min_leverage: 1,
      max_leverage: 10,
      default_leverage: 5,
      
      // Stop Loss (multiplicador da alavancagem)
      min_stop_loss_multiplier: 2,
      max_stop_loss_multiplier: 5,
      default_stop_loss_multiplier: 3,
      
      // Take Profit (multiplicador da alavancagem)
      min_take_profit_multiplier: 3,
      max_take_profit_multiplier: 8,
      default_take_profit_multiplier: 5,
      
      // Tamanho da posição (% do saldo)
      min_position_size_percent: 10,
      max_position_size_percent: 50,
      default_position_size_percent: 25,
      
      // Limitações operacionais
      max_simultaneous_positions: 2,
      coin_lock_duration_minutes: 120,
      
      // Gestão de risco
      max_daily_loss_percent: 10,
      max_weekly_loss_percent: 25,
      required_2fa_for_trades: true,
      
      // Exchange
      default_exchange: 'binance',
      api_timeout_seconds: 30,
      rate_limit_per_minute: 100,
      
      // Sistema
      enable_paper_trading: true,
      enable_real_trading: true,
      maintenance_mode: false,
      
      // Metadados
      updated_by: 'system',
      updated_at: new Date(),
      version: 1
    };

    // Salvar no banco
    await this.db.query(`
      INSERT INTO trading_configurations (
        config_data, 
        version, 
        updated_by, 
        is_active,
        created_at
      ) VALUES ($1, $2, $3, true, NOW())
    `, [JSON.stringify(defaultConfig), 1, 'system']);

    console.log('✅ Configuração padrão de trading criada');
    return defaultConfig;
  }

  // ========================================
  // AUDITORIA DE MUDANÇAS
  // ========================================

  private async logConfigChange(
    client: any,
    configKey: string,
    oldValue: any,
    newValue: any,
    changedBy: string,
    reason: string,
    ipAddress: string
  ): Promise<void> {
    await client.query(`
      INSERT INTO trading_config_audit (
        config_key, old_value, new_value, changed_by, 
        change_reason, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [configKey, oldValue, newValue, changedBy, reason, ipAddress]);
  }

  async getConfigAudit(limit: number = 50): Promise<ConfigurationAudit[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM trading_config_audit 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);

      return result.rows.map(row => ({
        id: row.id,
        config_key: row.config_key,
        old_value: row.old_value,
        new_value: row.new_value,
        changed_by: row.changed_by,
        change_reason: row.change_reason,
        timestamp: row.created_at,
        ip_address: row.ip_address
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar auditoria de configuração:', error);
      throw error;
    }
  }

  // ========================================
  // VALIDAÇÕES EM TEMPO REAL
  // ========================================

  async validateTradeRequest(
    userId: string,
    symbol: string,
    leverage: number,
    positionSizePercent: number,
    stopLoss: number,
    takeProfit: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const config = await this.getTradingConfig();

    // Verificar modo de manutenção
    if (config.maintenance_mode) {
      errors.push('Sistema em modo de manutenção');
    }

    // Verificar se trading real está habilitado
    if (!config.enable_real_trading) {
      errors.push('Trading real está desabilitado');
    }

    // Validar alavancagem
    if (leverage < config.min_leverage || leverage > config.max_leverage) {
      errors.push(`Alavancagem deve estar entre ${config.min_leverage}x e ${config.max_leverage}x`);
    }

    // Validar tamanho da posição
    if (positionSizePercent < config.min_position_size_percent || 
        positionSizePercent > config.max_position_size_percent) {
      errors.push(`Tamanho da posição deve estar entre ${config.min_position_size_percent}% e ${config.max_position_size_percent}%`);
    }

    // Validar stop loss
    const minStopLoss = leverage * config.min_stop_loss_multiplier;
    const maxStopLoss = leverage * config.max_stop_loss_multiplier;
    if (stopLoss < minStopLoss || stopLoss > maxStopLoss) {
      errors.push(`Stop loss deve estar entre ${minStopLoss}% e ${maxStopLoss}%`);
    }

    // Validar take profit
    const minTakeProfit = leverage * config.min_take_profit_multiplier;
    const maxTakeProfit = leverage * config.max_take_profit_multiplier;
    if (takeProfit < minTakeProfit || takeProfit > maxTakeProfit) {
      errors.push(`Take profit deve estar entre ${minTakeProfit}% e ${maxTakeProfit}%`);
    }

    // Verificar posições simultâneas
    const activePositions = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM trading_positions 
      WHERE user_id = $1 AND status = 'OPEN'
    `, [userId]);

    if (parseInt(activePositions.rows[0].count) >= config.max_simultaneous_positions) {
      errors.push(`Máximo de ${config.max_simultaneous_positions} posições simultâneas atingido`);
    }

    // Verificar bloqueio de moeda
    const coinLock = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM trading_positions 
      WHERE user_id = $1 
      AND symbol = $2 
      AND created_at > NOW() - INTERVAL '${config.coin_lock_duration_minutes} minutes'
    `, [userId, symbol]);

    if (parseInt(coinLock.rows[0].count) > 0) {
      errors.push(`Moeda ${symbol} bloqueada por ${config.coin_lock_duration_minutes} minutos após operação`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default TradingConfigurationService;
