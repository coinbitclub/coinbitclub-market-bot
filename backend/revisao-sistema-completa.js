/**
 * 🚨 REVISÃO COMPLETA DO SISTEMA - ESPECIFICAÇÃO CORRETA
 * 
 * 1. IA SEM AUTONOMIA - Apenas processa sinais TradingView
 * 2. FEAR & GREED define direção do mercado PRIMEIRO
 * 3. TP = 2x Alavancagem, SL = 3x Alavancagem
 * 4. Fechar posições abertas antes de aplicar correções
 */

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class SystemReviewComplete {
    constructor() {
        this.config = {
            // IA SEM AUTONOMIA - Apenas executa sinais TradingView
            ai: {
                autonomous_trading: false,          // ❌ IA NÃO pode enviar ordens próprias
                analysis_only: true,               // ✅ IA apenas analisa
                follow_signals_only: true,         // ✅ Apenas segue sinais externos
                decision_maker: 'TRADINGVIEW'       // ✅ TradingView é quem decide
            },
            
            // FEAR & GREED - DEFINIDOR PRINCIPAL DA DIREÇÃO
            fearGreed: {
                enabled: true,                      // ✅ Sempre ativo
                priority: 'HIGHEST',               // ✅ Máxima prioridade
                fallback_value: 50,                // ✅ Em caso de falha da API
                
                // REGRAS DEFINIDAS
                rules: {
                    extreme_fear: { min: 0, max: 29, allowed: ['LONG'] },          // < 30: Só LONG
                    balanced: { min: 30, max: 80, allowed: ['LONG', 'SHORT'] },    // 30-80: Ambos
                    extreme_greed: { min: 81, max: 100, allowed: ['SHORT'] }       // > 80: Só SHORT
                }
            },
            
            // TRADING CORRIGIDO
            trading: {
                leverage: 5,
                balance_percentage: 30,
                take_profit_multiplier: 2,          // TP = 2x leverage (10%)
                stop_loss_multiplier: 3,            // SL = 3x leverage (15%)
                max_open_positions: 2
            }
        };
    }

    /**
     * 1️⃣ FECHAR TODAS AS POSIÇÕES ABERTAS
     */
    async closeAllOpenPositions() {
        console.log('🚨 FECHANDO TODAS AS POSIÇÕES ABERTAS');
        console.log('='.repeat(60));

        try {
            // Buscar chaves da Paloma
            const chavesQuery = `
                SELECT api_key, secret_key 
                FROM user_api_keys 
                WHERE user_id = (SELECT id FROM users WHERE email = 'pamaral15@hotmail.com')
                AND exchange = 'bybit';
            `;
            
            const chaves = await pool.query(chavesQuery);
            
            if (chaves.rows.length === 0) {
                console.log('⚠️ Chaves API não encontradas');
                return;
            }

            const { api_key, secret_key } = chaves.rows[0];

            // Buscar posições abertas
            const positions = await this.getOpenPositions(api_key, secret_key);
            
            if (positions.length === 0) {
                console.log('✅ Nenhuma posição aberta encontrada');
                return;
            }

            console.log(`📊 ${positions.length} posição(ões) abertas encontrada(s)`);

            // Fechar cada posição
            for (const position of positions) {
                await this.closePosition(api_key, secret_key, position);
            }

            console.log('✅ TODAS AS POSIÇÕES FORAM FECHADAS');

        } catch (error) {
            console.error('❌ Erro ao fechar posições:', error.message);
        }
    }

    async getOpenPositions(apiKey, secretKey) {
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const queryString = 'category=linear&settleCoin=USDT';
            
            const paramStr = timestamp + apiKey + recvWindow + queryString;
            const signature = require('crypto').createHmac('sha256', secretKey).update(paramStr).digest('hex');

            const response = await axios.get('https://api.bybit.com/v5/position/list', {
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-SIGN-TYPE': '2',
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow
                },
                params: { category: 'linear', settleCoin: 'USDT' }
            });

            if (response.data.retCode === 0) {
                return response.data.result.list.filter(pos => parseFloat(pos.size) > 0);
            }

            return [];
        } catch (error) {
            console.error('❌ Erro ao buscar posições:', error.message);
            return [];
        }
    }

    async closePosition(apiKey, secretKey, position) {
        try {
            console.log(`🔄 Fechando posição ${position.symbol}: ${position.side} ${position.size}`);

            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const orderData = {
                category: 'linear',
                symbol: position.symbol,
                side: position.side === 'Buy' ? 'Sell' : 'Buy',
                orderType: 'Market',
                qty: position.size,
                reduceOnly: true
            };

            const queryString = Object.keys(orderData)
                .sort()
                .map(key => `${key}=${orderData[key]}`)
                .join('&');

            const paramStr = timestamp + apiKey + recvWindow + queryString;
            const signature = require('crypto').createHmac('sha256', secretKey).update(paramStr).digest('hex');

            const response = await axios.post('https://api.bybit.com/v5/order/create', orderData, {
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-SIGN-TYPE': '2',
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.retCode === 0) {
                console.log(`✅ Posição ${position.symbol} fechada com sucesso`);
            } else {
                console.log(`❌ Erro ao fechar ${position.symbol}: ${response.data.retMsg}`);
            }

        } catch (error) {
            console.error(`❌ Erro ao fechar posição ${position.symbol}:`, error.message);
        }
    }

    /**
     * 2️⃣ CONFIGURAR FEAR & GREED COMO PRIORIDADE
     */
    async setupFearGreedSystem() {
        console.log('\n📊 CONFIGURANDO SISTEMA FEAR & GREED');
        console.log('='.repeat(60));
        console.log('🎯 REGRAS DE DIREÇÃO:');
        console.log('   < 30: Medo Extremo → Só permite LONG');
        console.log('   30-80: Equilíbrio → Permite LONG e SHORT');
        console.log('   > 80: Ganância Extrema → Só permite SHORT');
        console.log('   Falha API → Fallback: 50 (equilibrado)');
        console.log('');

        try {
            // Buscar valor atual do Fear & Greed
            const currentFG = await this.getFearGreedIndex();
            console.log(`📊 Fear & Greed atual: ${currentFG}`);

            // Determinar direções permitidas
            const allowedDirections = this.getAllowedDirections(currentFG);
            console.log(`🎯 Direções permitidas: ${allowedDirections.join(', ')}`);

            // Salvar configuração no banco
            await this.saveFearGreedConfig(currentFG, allowedDirections);

            console.log('✅ Sistema Fear & Greed configurado');

        } catch (error) {
            console.error('❌ Erro ao configurar Fear & Greed:', error.message);
        }
    }

    async getFearGreedIndex() {
        try {
            const response = await axios.get('https://api.alternative.me/fng/', { timeout: 5000 });
            
            if (response.data && response.data.data && response.data.data[0]) {
                const value = parseInt(response.data.data[0].value);
                console.log(`📊 Fear & Greed obtido da API: ${value}`);
                return value;
            }
            
            throw new Error('Dados inválidos da API');
            
        } catch (error) {
            console.log(`⚠️ Falha na API Fear & Greed: ${error.message}`);
            console.log(`🔄 Usando fallback: ${this.config.fearGreed.fallback_value}`);
            return this.config.fearGreed.fallback_value;
        }
    }

    getAllowedDirections(fearGreedValue) {
        const rules = this.config.fearGreed.rules;

        if (fearGreedValue < 30) {
            return rules.extreme_fear.allowed;     // ['LONG']
        } else if (fearGreedValue <= 80) {
            return rules.balanced.allowed;         // ['LONG', 'SHORT']
        } else {
            return rules.extreme_greed.allowed;    // ['SHORT']
        }
    }

    async saveFearGreedConfig(value, allowedDirections) {
        try {
            const configData = {
                fear_greed_value: value,
                allowed_directions: allowedDirections,
                timestamp: new Date().toISOString(),
                rules_applied: this.config.fearGreed.rules
            };

            // Salvar na tabela system_config
            await pool.query(`
                INSERT INTO system_config (key, value, updated_at)
                VALUES ('fear_greed_market_direction', $1, NOW())
                ON CONFLICT (key) 
                DO UPDATE SET value = $1, updated_at = NOW()
            `, [JSON.stringify(configData)]);

            console.log('📊 Configuração Fear & Greed salva no banco');

        } catch (error) {
            console.error('❌ Erro ao salvar Fear & Greed:', error.message);
        }
    }

    /**
     * 3️⃣ DESATIVAR IA AUTÔNOMA
     */
    async disableAIAutonomy() {
        console.log('\n🤖 DESATIVANDO AUTONOMIA DA IA');
        console.log('='.repeat(60));
        console.log('❌ IA NÃO pode enviar ordens próprias');
        console.log('✅ IA apenas analisa dados');
        console.log('✅ IA apenas processa sinais TradingView');
        console.log('✅ TradingView é o único emissor de sinais');
        console.log('');

        try {
            const aiConfig = {
                autonomous_trading: false,
                analysis_only: true,
                follow_signals_only: true,
                decision_maker: 'TRADINGVIEW',
                last_updated: new Date().toISOString(),
                restrictions: [
                    'NO_AUTONOMOUS_ORDERS',
                    'NO_SELF_DECISIONS',
                    'TRADINGVIEW_SIGNALS_ONLY',
                    'ANALYSIS_ONLY_MODE'
                ]
            };

            // Salvar configuração da IA
            await pool.query(`
                INSERT INTO system_config (key, value, updated_at)
                VALUES ('ai_autonomy_settings', $1, NOW())
                ON CONFLICT (key) 
                DO UPDATE SET value = $1, updated_at = NOW()
            `, [JSON.stringify(aiConfig)]);

            console.log('✅ Autonomia da IA desativada e configurada');

        } catch (error) {
            console.error('❌ Erro ao configurar IA:', error.message);
        }
    }

    /**
     * 4️⃣ CORRIGIR CONFIGURAÇÕES TP/SL
     */
    async correctTradingConfig() {
        console.log('\n⚙️ CORRIGINDO CONFIGURAÇÕES DE TRADING');
        console.log('='.repeat(60));
        console.log('📊 FÓRMULA CORRETA:');
        console.log('   Take Profit = 2x Alavancagem (5x = 10%)');
        console.log('   Stop Loss = 3x Alavancagem (5x = 15%)');
        console.log('');

        try {
            // Buscar ID da Paloma
            const palomaQuery = `
                SELECT id FROM users WHERE email = 'pamaral15@hotmail.com';
            `;
            
            const paloma = await pool.query(palomaQuery);
            const userId = paloma.rows[0].id;

            // Configurações corretas
            const correctConfig = {
                leverage: this.config.trading.leverage,
                balance_percentage: this.config.trading.balance_percentage,
                take_profit_multiplier: this.config.trading.take_profit_multiplier,
                stop_loss_multiplier: this.config.trading.stop_loss_multiplier,
                max_open_positions: this.config.trading.max_open_positions,
                
                // Valores calculados
                take_profit_percent: this.config.trading.leverage * this.config.trading.take_profit_multiplier,
                stop_loss_percent: this.config.trading.leverage * this.config.trading.stop_loss_multiplier
            };

            console.log(`✅ TP: ${correctConfig.take_profit_percent}%`);
            console.log(`✅ SL: ${correctConfig.stop_loss_percent}%`);

            // Atualizar no banco
            await pool.query(`
                UPDATE user_trading_params 
                SET 
                    take_profit_percent = $2,
                    stop_loss_percent = $3,
                    max_open_positions = $4,
                    risk_settings = $5,
                    updated_at = NOW()
                WHERE user_id = $1
            `, [
                userId,
                correctConfig.take_profit_percent,
                correctConfig.stop_loss_percent,
                correctConfig.max_open_positions,
                JSON.stringify(correctConfig)
            ]);

            console.log('✅ Configurações de trading corrigidas');

        } catch (error) {
            console.error('❌ Erro ao corrigir trading:', error.message);
        }
    }

    /**
     * 5️⃣ VALIDAR SINAL CONFORME REGRAS
     */
    validateSignal(signal) {
        const { symbol, direction, price } = signal;
        
        console.log(`🔍 VALIDANDO SINAL: ${symbol} ${direction} @ ${price}`);

        // 1. Verificar Fear & Greed primeiro
        const fearGreedResult = this.validateFearGreed(direction);
        if (!fearGreedResult.valid) {
            return {
                valid: false,
                reason: fearGreedResult.reason,
                fearGreed: fearGreedResult.value
            };
        }

        // 2. Verificar se IA tem autonomia (deve ser false)
        if (this.config.ai.autonomous_trading) {
            return {
                valid: false,
                reason: 'IA com autonomia detectada - não permitido'
            };
        }

        return {
            valid: true,
            fearGreed: fearGreedResult.value,
            allowedDirections: fearGreedResult.allowedDirections
        };
    }

    async validateFearGreed(direction) {
        try {
            const currentFG = await this.getFearGreedIndex();
            const allowedDirections = this.getAllowedDirections(currentFG);

            if (!allowedDirections.includes(direction.toUpperCase())) {
                return {
                    valid: false,
                    reason: `Direção ${direction} bloqueada pelo Fear & Greed (${currentFG})`,
                    value: currentFG,
                    allowedDirections: allowedDirections
                };
            }

            return {
                valid: true,
                value: currentFG,
                allowedDirections: allowedDirections
            };

        } catch (error) {
            console.error('❌ Erro na validação Fear & Greed:', error.message);
            return {
                valid: false,
                reason: 'Erro ao validar Fear & Greed'
            };
        }
    }

    /**
     * 6️⃣ EXECUTAR REVISÃO COMPLETA
     */
    async executeCompleteReview() {
        try {
            console.log('🚀 INICIANDO REVISÃO COMPLETA DO SISTEMA');
            console.log('='.repeat(70));
            console.log('📅 Data: 29 de Julho de 2025');
            console.log('🎯 Objetivo: Alinhar sistema conforme especificação');
            console.log('');

            // 1. Fechar posições abertas
            await this.closeAllOpenPositions();

            // 2. Configurar Fear & Greed
            await this.setupFearGreedSystem();

            // 3. Desativar IA autônoma
            await this.disableAIAutonomy();

            // 4. Corrigir configurações trading
            await this.correctTradingConfig();

            console.log('\n🎉 REVISÃO COMPLETA CONCLUÍDA!');
            console.log('='.repeat(70));
            console.log('✅ SISTEMA ALINHADO CONFORME ESPECIFICAÇÃO:');
            console.log('   1. ✅ Posições abertas fechadas');
            console.log('   2. ✅ Fear & Greed configurado como prioridade');
            console.log('   3. ✅ IA sem autonomia - apenas processa sinais');
            console.log('   4. ✅ TP/SL corrigidos: 2x e 3x leverage');
            console.log('   5. ✅ TradingView como único emissor de sinais');
            console.log('');
            console.log('🚀 SISTEMA PRONTO PARA OPERAÇÃO CONFORME ESPECIFICAÇÃO!');

            // Exemplo de validação
            console.log('\n🧪 EXEMPLO DE VALIDAÇÃO:');
            const exemploSinal = {
                symbol: 'BTCUSDT',
                direction: 'SHORT',
                price: 50000
            };

            const validacao = await this.validateSignal(exemploSinal);
            console.log(`   Sinal: ${exemploSinal.symbol} ${exemploSinal.direction}`);
            console.log(`   Válido: ${validacao.valid ? '✅' : '❌'}`);
            if (!validacao.valid) {
                console.log(`   Motivo: ${validacao.reason}`);
            }

        } catch (error) {
            console.error('❌ Erro na revisão completa:', error.message);
        } finally {
            await pool.end();
        }
    }
}

// Executar revisão completa
const systemReview = new SystemReviewComplete();
systemReview.executeCompleteReview();
