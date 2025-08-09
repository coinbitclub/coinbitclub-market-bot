/**
 * 🔐 VALIDADOR DE CHAVES E SALDOS AVANÇADO
 * Sistema completo de validação automática de chaves de exchange
 * Monitoramento de saldos pré-pagos e bônus para operações
 * Isolamento total entre usuários com segurança enterprise
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

class ExchangeKeyValidator {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/coinbitclub',
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
        });

        // Cache de validações (5 minutos)
        this.validationCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;

        // Configurações de segurança
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'CoinBitClubSecretKey32CharsForProd';
        
        console.log('🔐 Exchange Key Validator iniciado');
        console.log('🔍 Validação automática de chaves: ATIVA');
        console.log('💰 Monitoramento de saldos: ATIVO');
        console.log('🛡️ Isolamento multiusuário: ATIVO');
    }

    /**
     * 🔍 VALIDAÇÃO COMPLETA DE USUÁRIO PARA OPERAÇÕES
     */
    async validateUserForTrading(userId, signal = null) {
        try {
            console.log(`🔍 Validando usuário ${userId} para trading...`);

            // ETAPA 1: Buscar dados completos do usuário
            const userData = await this.getUserCompleteData(userId);
            if (!userData.success) {
                return userData;
            }

            const user = userData.user;

            // ETAPA 2: Validar chaves de exchange
            const keysValidation = await this.validateUserExchangeKeys(user);
            if (!keysValidation.valid) {
                return {
                    success: false,
                    reason: keysValidation.reason,
                    error: 'INVALID_EXCHANGE_KEYS',
                    details: keysValidation
                };
            }

            // ETAPA 3: Validar saldos (incluindo pré-pago e bônus)
            const balanceValidation = await this.validateUserBalances(user, signal);
            if (!balanceValidation.valid) {
                return {
                    success: false,
                    reason: balanceValidation.reason,
                    error: 'INSUFFICIENT_BALANCE',
                    details: balanceValidation
                };
            }

            // ETAPA 4: Verificar limites e bloqueios
            const limitValidation = await this.validateUserLimits(user, signal);
            if (!limitValidation.valid) {
                return {
                    success: false,
                    reason: limitValidation.reason,
                    error: 'USER_LIMITS_EXCEEDED',
                    details: limitValidation
                };
            }

            // ETAPA 5: Gerar configuração de trading
            const tradingConfig = await this.generateTradingConfig(user, keysValidation.exchange);

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    plan_type: user.plan_type,
                    is_active: user.is_active
                },
                exchange: keysValidation.exchange,
                balances: balanceValidation.balances,
                tradingConfig: tradingConfig,
                validation: {
                    keys: keysValidation,
                    balances: balanceValidation,
                    limits: limitValidation
                }
            };

        } catch (error) {
            console.error(`❌ Erro na validação do usuário ${userId}:`, error.message);
            return {
                success: false,
                reason: 'Erro interno na validação',
                error: 'VALIDATION_ERROR'
            };
        }
    }

    /**
     * 👤 BUSCAR DADOS COMPLETOS DO USUÁRIO
     */
    async getUserCompleteData(userId) {
        try {
            const result = await this.pool.query(`
                SELECT 
                    id, email, plan_type, is_active, created_at,
                    balance_brl, balance_usd, prepaid_balance_usd,
                    admin_credits_brl, admin_credits_usd,
                    
                    -- Chaves criptografadas
                    binance_api_key_encrypted, binance_api_secret_encrypted,
                    bybit_api_key_encrypted, bybit_api_secret_encrypted,
                    
                    -- Configurações
                    custom_config, exchange_config,
                    
                    -- Controles de limite
                    max_positions, daily_loss_limit_usd,
                    last_trade_at, total_trades_today,
                    
                    -- Status
                    account_status, risk_level
                FROM users 
                WHERE id = $1 AND is_active = true
            `, [userId]);

            if (result.rows.length === 0) {
                return {
                    success: false,
                    reason: 'Usuário não encontrado ou inativo'
                };
            }

            return {
                success: true,
                user: result.rows[0]
            };

        } catch (error) {
            console.error('❌ Erro ao buscar dados do usuário:', error.message);
            return {
                success: false,
                reason: 'Erro ao acessar dados do usuário'
            };
        }
    }

    /**
     * 🔐 VALIDAR CHAVES DE EXCHANGE DO USUÁRIO
     */
    async validateUserExchangeKeys(user) {
        try {
            // Verificar cache primeiro
            const cacheKey = `keys_${user.id}`;
            const cached = this.validationCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log(`📋 Usando validação em cache para usuário ${user.id}`);
                return cached.data;
            }

            const validation = {
                valid: false,
                exchange: null,
                reason: '',
                binance: { available: false, valid: false },
                bybit: { available: false, valid: false }
            };

            // Verificar Binance
            if (user.binance_api_key_encrypted && user.binance_api_secret_encrypted) {
                validation.binance.available = true;
                
                try {
                    const binanceKeys = await this.decryptExchangeKeys(
                        user.binance_api_key_encrypted,
                        user.binance_api_secret_encrypted
                    );
                    
                    const binanceValid = await this.testBinanceConnection(binanceKeys);
                    validation.binance.valid = binanceValid.success;
                    validation.binance.error = binanceValid.error;
                    
                    if (binanceValid.success) {
                        validation.valid = true;
                        validation.exchange = 'BINANCE';
                        validation.exchangeData = binanceValid.data;
                    }
                } catch (error) {
                    validation.binance.error = 'Erro ao descriptografar chaves Binance';
                }
            }

            // Verificar Bybit se Binance não está válida
            if (!validation.valid && user.bybit_api_key_encrypted && user.bybit_api_secret_encrypted) {
                validation.bybit.available = true;
                
                try {
                    const bybitKeys = await this.decryptExchangeKeys(
                        user.bybit_api_key_encrypted,
                        user.bybit_api_secret_encrypted
                    );
                    
                    const bybitValid = await this.testBybitConnection(bybitKeys);
                    validation.bybit.valid = bybitValid.success;
                    validation.bybit.error = bybitValid.error;
                    
                    if (bybitValid.success) {
                        validation.valid = true;
                        validation.exchange = 'BYBIT';
                        validation.exchangeData = bybitValid.data;
                    }
                } catch (error) {
                    validation.bybit.error = 'Erro ao descriptografar chaves Bybit';
                }
            }

            // Definir razão se não válido
            if (!validation.valid) {
                if (!validation.binance.available && !validation.bybit.available) {
                    validation.reason = 'Nenhuma chave de exchange configurada';
                } else {
                    validation.reason = 'Chaves de exchange inválidas ou sem permissão';
                }
            }

            // Cache da validação
            this.validationCache.set(cacheKey, {
                data: validation,
                timestamp: Date.now()
            });

            return validation;

        } catch (error) {
            console.error('❌ Erro na validação de chaves:', error.message);
            return {
                valid: false,
                reason: 'Erro interno na validação de chaves'
            };
        }
    }

    /**
     * 💰 VALIDAR SALDOS DO USUÁRIO (INCLUINDO PRÉ-PAGO E BÔNUS)
     */
    async validateUserBalances(user, signal = null) {
        try {
            // Obter todos os tipos de saldo
            const balances = {
                balance_brl: parseFloat(user.balance_brl) || 0,
                balance_usd: parseFloat(user.balance_usd) || 0,
                prepaid_balance_usd: parseFloat(user.prepaid_balance_usd) || 0,
                admin_credits_brl: parseFloat(user.admin_credits_brl) || 0,
                admin_credits_usd: parseFloat(user.admin_credits_usd) || 0
            };

            // Calcular saldo total disponível
            const totalUSD = balances.balance_usd + balances.prepaid_balance_usd + balances.admin_credits_usd;
            const totalBRL = balances.balance_brl + balances.admin_credits_brl;

            // Obter valor mínimo necessário
            const minTradeUSD = this.getMinimumTradeAmount(user.plan_type, signal);
            const minTradeBRL = minTradeUSD * 5.5; // Conversão aproximada

            // Validações
            const validation = {
                valid: false,
                reason: '',
                balances: balances,
                totals: { usd: totalUSD, brl: totalBRL },
                minimums: { usd: minTradeUSD, brl: minTradeBRL },
                currency: null,
                availableAmount: 0
            };

            // Priorizar USD (mais comum em crypto)
            if (totalUSD >= minTradeUSD) {
                validation.valid = true;
                validation.currency = 'USD';
                validation.availableAmount = totalUSD;
            } else if (totalBRL >= minTradeBRL) {
                validation.valid = true;
                validation.currency = 'BRL';
                validation.availableAmount = totalBRL;
            } else {
                validation.reason = `Saldo insuficiente. Mínimo: $${minTradeUSD} USD ou R$${minTradeBRL} BRL`;
            }

            // Verificação especial para sinais FORTE (reduzir mínimo em 50%)
            if (!validation.valid && signal && signal.includes('FORTE')) {
                const reducedMinUSD = minTradeUSD * 0.5;
                const reducedMinBRL = minTradeBRL * 0.5;
                
                if (totalUSD >= reducedMinUSD) {
                    validation.valid = true;
                    validation.currency = 'USD';
                    validation.availableAmount = totalUSD;
                    validation.reason = 'Aprovado para sinal FORTE com limite reduzido';
                } else if (totalBRL >= reducedMinBRL) {
                    validation.valid = true;
                    validation.currency = 'BRL';
                    validation.availableAmount = totalBRL;
                    validation.reason = 'Aprovado para sinal FORTE com limite reduzido';
                }
            }

            return validation;

        } catch (error) {
            console.error('❌ Erro na validação de saldos:', error.message);
            return {
                valid: false,
                reason: 'Erro ao verificar saldos'
            };
        }
    }

    /**
     * 📊 VALIDAR LIMITES E BLOQUEIOS DO USUÁRIO
     */
    async validateUserLimits(user, signal = null) {
        try {
            const validation = {
                valid: true,
                reason: '',
                limits: {
                    maxPositions: parseInt(user.max_positions) || 2,
                    dailyLossLimit: parseFloat(user.daily_loss_limit_usd) || 100,
                    totalTradesToday: parseInt(user.total_trades_today) || 0
                },
                current: {
                    activePositions: 0,
                    dailyLoss: 0,
                    tradesToday: 0
                }
            };

            // Verificar posições ativas
            const activePositionsResult = await this.pool.query(`
                SELECT COUNT(*) as count, COALESCE(SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END), 0) as daily_loss
                FROM active_positions 
                WHERE user_id = $1 AND status = 'ACTIVE'
                AND created_at >= CURRENT_DATE
            `, [user.id]);

            validation.current.activePositions = parseInt(activePositionsResult.rows[0].count);
            validation.current.dailyLoss = parseFloat(activePositionsResult.rows[0].daily_loss);

            // Verificar limite de posições
            if (validation.current.activePositions >= validation.limits.maxPositions) {
                validation.valid = false;
                validation.reason = `Limite de ${validation.limits.maxPositions} posições ativas atingido`;
                return validation;
            }

            // Verificar limite de perda diária
            if (validation.current.dailyLoss >= validation.limits.dailyLossLimit) {
                validation.valid = false;
                validation.reason = `Limite de perda diária atingido ($${validation.limits.dailyLossLimit})`;
                return validation;
            }

            // Verificar bloqueio específico do ticker
            if (signal && signal.ticker) {
                const tickerBlock = await this.pool.query(`
                    SELECT id FROM ticker_blocks 
                    WHERE user_id = $1 AND ticker = $2 
                    AND expires_at > NOW()
                `, [user.id, signal.ticker]);

                if (tickerBlock.rows.length > 0) {
                    validation.valid = false;
                    validation.reason = `Ticker ${signal.ticker} bloqueado temporariamente`;
                    return validation;
                }
            }

            // Verificar cooldown entre trades
            if (user.last_trade_at) {
                const lastTrade = new Date(user.last_trade_at);
                const now = new Date();
                const cooldownMinutes = 5; // 5 minutos entre trades
                const timeDiff = (now - lastTrade) / 1000 / 60;

                if (timeDiff < cooldownMinutes) {
                    validation.valid = false;
                    validation.reason = `Cooldown ativo. Aguarde ${Math.ceil(cooldownMinutes - timeDiff)} minutos`;
                    return validation;
                }
            }

            return validation;

        } catch (error) {
            console.error('❌ Erro na validação de limites:', error.message);
            return {
                valid: false,
                reason: 'Erro ao verificar limites'
            };
        }
    }

    /**
     * 🔧 DESCRIPTOGRAFAR CHAVES DE EXCHANGE
     */
    async decryptExchangeKeys(encryptedKey, encryptedSecret) {
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

            // Descriptografar API Key
            const keyBuffer = Buffer.from(encryptedKey, 'hex');
            const keyIv = keyBuffer.slice(0, 16);
            const keyEncrypted = keyBuffer.slice(16);
            const keyDecipher = crypto.createDecipheriv(algorithm, key, keyIv);
            const apiKey = keyDecipher.update(keyEncrypted, null, 'utf8') + keyDecipher.final('utf8');

            // Descriptografar API Secret
            const secretBuffer = Buffer.from(encryptedSecret, 'hex');
            const secretIv = secretBuffer.slice(0, 16);
            const secretEncrypted = secretBuffer.slice(16);
            const secretDecipher = crypto.createDecipheriv(algorithm, key, secretIv);
            const apiSecret = secretDecipher.update(secretEncrypted, null, 'utf8') + secretDecipher.final('utf8');

            return {
                apiKey: apiKey,
                apiSecret: apiSecret
            };

        } catch (error) {
            throw new Error('Erro ao descriptografar chaves: ' + error.message);
        }
    }

    /**
     * 🔌 TESTAR CONEXÃO BINANCE
     */
    async testBinanceConnection(keys) {
        try {
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            
            const signature = crypto
                .createHmac('sha256', keys.apiSecret)
                .update(queryString)
                .digest('hex');

            const response = await axios.get('https://api.binance.com/api/v3/account', {
                headers: {
                    'X-MBX-APIKEY': keys.apiKey
                },
                params: {
                    timestamp: timestamp,
                    signature: signature
                },
                timeout: 10000
            });

            return {
                success: true,
                data: {
                    permissions: response.data.permissions,
                    canTrade: response.data.canTrade,
                    balances: response.data.balances?.slice(0, 5) // Primeiros 5 saldos
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.msg || error.message
            };
        }
    }

    /**
     * 🔌 TESTAR CONEXÃO BYBIT
     */
    async testBybitConnection(keys) {
        try {
            const timestamp = Date.now().toString();
            const params = { timestamp };
            
            const paramString = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');

            const signature = crypto
                .createHmac('sha256', keys.apiSecret)
                .update(timestamp + keys.apiKey + paramString)
                .digest('hex');

            const response = await axios.get('https://api.bybit.com/v2/private/wallet/balance', {
                headers: {
                    'api-key': keys.apiKey,
                    'api-signature': signature,
                    'api-timestamp': timestamp
                },
                timeout: 10000
            });

            return {
                success: response.data.ret_code === 0,
                data: {
                    account: response.data.result,
                    canTrade: true
                },
                error: response.data.ret_msg
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.ret_msg || error.message
            };
        }
    }

    /**
     * 💰 OBTER VALOR MÍNIMO PARA TRADE
     */
    getMinimumTradeAmount(planType, signal = null) {
        const baseMinimumsUSD = {
            'FREE': 50,
            'BASIC': 30,
            'PREMIUM': 20,
            'VIP': 10
        };

        let minimum = baseMinimumsUSD[planType] || 50;

        // Redução para sinais FORTE
        if (signal && signal.includes('FORTE')) {
            minimum = minimum * 0.5;
        }

        return minimum;
    }

    /**
     * ⚙️ GERAR CONFIGURAÇÃO DE TRADING
     */
    async generateTradingConfig(user, exchange) {
        try {
            const config = {
                exchange: exchange,
                userId: user.id,
                planType: user.plan_type,
                riskLevel: user.risk_level || 'MODERATE',
                
                // Configurações de posição
                maxPositionSize: this.calculateMaxPositionSize(user),
                leverageMultiplier: this.getLeverageMultiplier(user.plan_type),
                
                // Stop Loss e Take Profit
                defaultStopLoss: 0.02, // 2%
                defaultTakeProfit: 0.04, // 4%
                
                // Configurações específicas do usuário
                customConfig: user.custom_config ? JSON.parse(user.custom_config) : {},
                exchangeConfig: user.exchange_config ? JSON.parse(user.exchange_config) : {},
                
                // Timestamps
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
            };

            return config;

        } catch (error) {
            console.error('❌ Erro ao gerar configuração de trading:', error.message);
            return {
                exchange: exchange,
                userId: user.id,
                error: 'Erro ao gerar configuração'
            };
        }
    }

    /**
     * 📊 CALCULAR TAMANHO MÁXIMO DE POSIÇÃO
     */
    calculateMaxPositionSize(user) {
        const planLimits = {
            'FREE': 0.1,    // 10% do saldo
            'BASIC': 0.15,  // 15% do saldo
            'PREMIUM': 0.20, // 20% do saldo
            'VIP': 0.25     // 25% do saldo
        };

        return planLimits[user.plan_type] || 0.1;
    }

    /**
     * 📈 OBTER MULTIPLICADOR DE ALAVANCAGEM
     */
    getLeverageMultiplier(planType) {
        const leverages = {
            'FREE': 1,     // Sem alavancagem
            'BASIC': 2,    // 2x
            'PREMIUM': 3,  // 3x
            'VIP': 5       // 5x
        };

        return leverages[planType] || 1;
    }

    /**
     * 🧹 LIMPAR CACHE DE VALIDAÇÕES
     */
    clearValidationCache(userId = null) {
        if (userId) {
            this.validationCache.delete(`keys_${userId}`);
        } else {
            this.validationCache.clear();
        }
    }

    /**
     * 📊 OBTER ESTATÍSTICAS DO VALIDADOR
     */
    getValidatorStats() {
        return {
            cacheSize: this.validationCache.size,
            cacheTimeout: this.cacheTimeout,
            totalValidations: this.totalValidations || 0,
            successfulValidations: this.successfulValidations || 0
        };
    }
}

module.exports = ExchangeKeyValidator;
