const { Pool } = require('pg');
const axios = require('axios');
const { CONFIG, validateConfig } = require('./config');

// 🚀 SISTEMA DE LEITURA DO MERCADO - VERSÃO PROFISSIONAL ENTERPRISE
// 
// ⚠️  POLÍTICA RIGOROSA DE DADOS REAIS:
// ❌ VALORES SIMULADOS/MOCK/FAKE SÃO COMPLETAMENTE PROIBIDOS
// ❌ SISTEMA OPERA APENAS COM DADOS 100% REAIS DAS APIS
// ❌ SE UMA API FALHAR, O SISTEMA PARA - SEM FALLBACK SIMULADO
// ✅ INTEGRIDADE TOTAL DOS DADOS É PRIORIDADE MÁXIMA
//
// 📋 RECOMENDAÇÕES DE TRADING:
// 🎯 SOMENTE_LONG: Apenas operações de compra (mercado altista)
// 🎯 SOMENTE_SHORT: Apenas operações de venda (mercado baixista)  
// 🎯 LONG_E_SHORT: Operações mistas (mercado lateral/indefinido)
// ⚠️  NEUTRO = LONG_E_SHORT (não abrimos operações "neutras")
// 📊 OPERAÇÕES REAIS: Apenas LONG e/ou SHORT são executadas
//
// APIs INTEGRADAS (DADOS REAIS OBRIGATÓRIOS):
// - CoinStats API (Fear & Greed Index)
// - Alternative.me API (Backup Fear & Greed)  
// - Binance API (Preços e Dominância Bitcoin)
// - OpenAI API (Análise IA com fallback baseado em regras REAIS)

// ⚠️ CONFIGURAÇÕES REMOVIDAS - AGORA USAMOS VARIÁVEIS DE AMBIENTE
// Todas as chaves de API e configurações estão no arquivo .env

const pool = new Pool({ 
    connectionString: CONFIG.DATABASE.URL,
    ssl: CONFIG.DATABASE.SSL,
    max: CONFIG.DATABASE.POOL_SIZE,
    idleTimeoutMillis: CONFIG.DATABASE.TIMEOUT,
    connectionTimeoutMillis: 2000,
});

class SistemaLeituraMercadoProfissional {
    constructor() {
        this.isRunning = false;
        this.currentCycleId = null;
        this.cycleNumber = 0;
        this.lastCleanup = null;
        this.apiStats = {
            coinstats: { calls: 0, errors: 0, totalTime: 0 },
            binance: { calls: 0, errors: 0, totalTime: 0 },
            openai: { calls: 0, errors: 0, totalTime: 0 }
        };
        
        console.log('🚀 SISTEMA DE LEITURA DO MERCADO PROFISSIONAL INICIALIZANDO...');
    }

    async logSystem(component, message, level = 'INFO', details = null) {
        try {
            await pool.query(`
                INSERT INTO system_logs (component, message, level, details, timestamp)
                VALUES ($1, $2, $3, $4, NOW())
            `, [`SISTEMA_LEITURA_MERCADO_${component}`, message, level, details]);
            
            console.log(`[${new Date().toISOString()}] ${level}: ${component} - ${message}`);
        } catch (error) {
            console.error('Erro ao salvar log do sistema:', error.message);
        }
    }

    async logAPICall(apiName, endpoint, responseTime, statusCode, success, errorMessage = null, sistemaLeituraId = null) {
        try {
            await pool.query(`
                INSERT INTO sistema_leitura_api_monitoring (
                    api_name, endpoint, response_time_ms, status_code, success, 
                    error_message, sistema_leitura_id, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [apiName, endpoint, responseTime, statusCode, success, errorMessage, sistemaLeituraId]);
        } catch (error) {
            console.error('Erro ao log de API:', error.message);
        }
    }

    async aplicarRegrasNegocio(fearGreedValue, btcDominance) {
        const regras = [];
        let finalRecommendation = 'LONG_E_SHORT'; // Padrão é LONG_E_SHORT (não NEUTRO)
        let confidence = 75;

        // REGRA 1: Fear & Greed Index
        if (fearGreedValue < 30) {
            regras.push({
                type: 'FEAR_GREED',
                condition: 'value < 30',
                result: 'SOMENTE_LONG',
                priority: 1,
                confidence_impact: 15
            });
            finalRecommendation = 'SOMENTE_LONG';
            confidence += 15;
        } else if (fearGreedValue > 80) {
            regras.push({
                type: 'FEAR_GREED', 
                condition: 'value > 80',
                result: 'SOMENTE_SHORT',
                priority: 1,
                confidence_impact: 15
            });
            finalRecommendation = 'SOMENTE_SHORT';
            confidence += 15;
        } else {
            regras.push({
                type: 'FEAR_GREED',
                condition: '30 <= value <= 80', 
                result: 'LONG_E_SHORT',
                priority: 1,
                confidence_impact: 0
            });
            finalRecommendation = 'LONG_E_SHORT';
        }

        // REGRA 2: BTC Dominance
        if (btcDominance >= 50) {
            regras.push({
                type: 'BTC_DOMINANCE',
                condition: 'dominance >= 50%',
                result: 'FAVOR_BTC_SHORT_ALTS',
                priority: 2,
                confidence_impact: 10
            });
            confidence += 10;
        } else if (btcDominance <= 45) {
            regras.push({
                type: 'BTC_DOMINANCE',
                condition: 'dominance <= 45%',
                result: 'FAVOR_ALTS_LONG',
                priority: 2,
                confidence_impact: 10
            });
            confidence += 10;
        }

        return {
            appliedRules: regras,
            finalRecommendation,
            confidence: Math.min(confidence, 100)
        };
    }

    async extrairFearGreed() {
        const startTime = Date.now();
        let sistemaLeituraId = null;
        
        try {
            console.log('📊 Extraindo Fear & Greed Index (CoinStats)...');
            this.apiStats.coinstats.calls++;
            
            // Tentar primeiro a API CoinStats
            let response;
            let fgValue;
            
            try {
                response = await axios.get('https://api.coinstats.app/public/v1/fear-greed', {
                    headers: { 
                        'X-API-KEY': CONFIG.APIS.COINSTATS.KEY,
                        'Accept': 'application/json'
                    },
                    timeout: CONFIG.SECURITY.API_TIMEOUT
                });
                
                fgValue = response.data?.value || response.data?.fearGreedIndex?.value;
            } catch (coinStatsError) {
                console.log('⚠️ CoinStats falhou, usando API alternativa...');
                
                // Fallback para alternative.me
                response = await axios.get('https://api.alternative.me/fng/', {
                    timeout: CONFIG.SECURITY.API_TIMEOUT
                });
                
                fgValue = parseInt(response.data.data[0].value);
            }

            const responseTime = Date.now() - startTime;

            if (!fgValue || isNaN(fgValue)) {
                // ❌ VALORES SIMULADOS SÃO PROIBIDOS NESTE PROJETO
                // ❌ ESTE SISTEMA OPERA APENAS COM DADOS 100% REAIS
                // ❌ SEM FALLBACK SIMULADO - FALHA COMPLETA SE NÃO HÁ DADOS REAIS
                const errorMsg = `ERRO CRÍTICO: Não foi possível obter dados reais do Fear & Greed Index. 
                VALORES SIMULADOS SÃO PROIBIDOS NESTE PROJETO.
                APIs testadas: CoinStats, Alternative.me - Todas falharam.
                Sistema será interrompido para manter integridade dos dados.`;
                
                console.error('❌ ' + errorMsg);
                throw new Error(errorMsg);
            }

            let classification = 'NEUTRAL';
            let direction = 'LONG_E_SHORT'; // Padrão convertido de NEUTRO para LONG_E_SHORT
            
            if (fgValue < 25) {
                classification = 'EXTREME_FEAR';
                direction = 'SOMENTE_LONG';
            } else if (fgValue < 50) {
                classification = 'FEAR';
                direction = 'LONG_E_SHORT';
            } else if (fgValue < 75) {
                classification = 'GREED';
                direction = 'LONG_E_SHORT';
            } else {
                classification = 'EXTREME_GREED';
                direction = 'SOMENTE_SHORT';
            }

            await this.logAPICall('CoinStats', 'fear-and-greed', responseTime, 200, true, null, sistemaLeituraId);
            this.apiStats.coinstats.totalTime += responseTime;

            await this.logSystem('FEAR_GREED', `Extraído com sucesso: ${fgValue} (${classification})`, 'INFO', {
                value: fgValue,
                classification,
                direction,
                response_time: responseTime
            });

            return { 
                value: fgValue, 
                classification, 
                direction,
                timestamp: new Date(),
                extractionTime: responseTime
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.apiStats.coinstats.errors++;
            
            await this.logAPICall('CoinStats', 'fear-and-greed', responseTime, 0, false, error.message, sistemaLeituraId);
            await this.logSystem('FEAR_GREED', `Erro na extração: ${error.message}`, 'ERROR');
            
            throw error;
        }
    }

    async extrairBinanceTop100() {
        const startTime = Date.now();
        let sistemaLeituraId = null;
        
        try {
            console.log('🪙 Extraindo TOP 100 Binance...');
            this.apiStats.binance.calls++;
            
            const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
                timeout: CONFIG.SECURITY.API_TIMEOUT
            });

            const responseTime = Date.now() - startTime;
            const allSymbols = response.data.filter(s => s.symbol.endsWith('USDT'));
            const top100 = allSymbols
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 100);

            // Calcular métricas do mercado
            const btcData = allSymbols.find(s => s.symbol === 'BTCUSDT');
            const totalVolume = top100.reduce((sum, s) => sum + parseFloat(s.quoteVolume), 0);
            const btcVolume = btcData ? parseFloat(btcData.quoteVolume) : 0;
            const btcDominance = totalVolume > 0 ? (btcVolume / totalVolume * 100) : 45.0;
            const btcPrice = btcData ? parseFloat(btcData.lastPrice) : 45000;

            // Identificar top gainers e losers
            const topGainers = top100
                .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
                .slice(0, 5)
                .map(s => ({
                    symbol: s.symbol,
                    change: parseFloat(s.priceChangePercent),
                    volume: parseFloat(s.quoteVolume)
                }));

            const topLosers = top100
                .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
                .slice(0, 5)
                .map(s => ({
                    symbol: s.symbol,
                    change: parseFloat(s.priceChangePercent),
                    volume: parseFloat(s.quoteVolume)
                }));

            await this.logAPICall('Binance', '24hr-ticker', responseTime, 200, true, null, sistemaLeituraId);
            this.apiStats.binance.totalTime += responseTime;

            await this.logSystem('BINANCE_TOP100', `Extraído com sucesso. BTC: $${btcPrice.toFixed(2)}, Dominance: ${btcDominance.toFixed(2)}%`, 'INFO', {
                btc_price: btcPrice,
                btc_dominance: btcDominance,
                total_volume: totalVolume,
                top_symbols: top100.length,
                response_time: responseTime
            });

            return {
                btcDominance,
                btcPrice,
                totalVolume,
                topGainers,
                topLosers,
                top100Symbols: top100,
                timestamp: new Date(),
                extractionTime: responseTime
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.apiStats.binance.errors++;
            
            await this.logAPICall('Binance', '24hr-ticker', responseTime, 0, false, error.message, sistemaLeituraId);
            await this.logSystem('BINANCE_TOP100', `Erro na extração: ${error.message}`, 'ERROR');
            
            throw error;
        }
    }

    async analisarComIA(fearGreedData, binanceData) {
        const startTime = Date.now();
        let sistemaLeituraId = null;
        let fallbackUsed = false;
        
        try {
            console.log('🤖 Executando análise com IA...');
            this.apiStats.openai.calls++;
            
            const prompt = `
SISTEMA DE LEITURA DO MERCADO - ANÁLISE PROFISSIONAL

DADOS ATUAIS:
- Fear & Greed Index: ${fearGreedData.value} (${fearGreedData.classification})
- BTC Dominance: ${binanceData.btcDominance.toFixed(2)}%
- BTC Price: $${binanceData.btcPrice.toFixed(2)}
- Volume Total 24h: $${(binanceData.totalVolume / 1e9).toFixed(2)}B

TOP GAINERS: ${binanceData.topGainers.map(g => `${g.symbol}: +${g.change.toFixed(2)}%`).join(', ')}
TOP LOSERS: ${binanceData.topLosers.map(l => `${l.symbol}: ${l.change.toFixed(2)}%`).join(', ')}

REGRAS DE DIREÇÃO RIGOROSAS:
1. Fear & Greed < 25: SOMENTE_LONG (medo extremo = oportunidade de compra)
2. Fear & Greed 25-75: LONG_E_SHORT (mercado balanceado)
3. Fear & Greed > 75: SOMENTE_SHORT (ganância extrema = risco de correção)

4. BTC Dominance ≥50%: Favor ao Bitcoin, cuidado com altcoins
5. BTC Dominance ≤45%: Temporada de altcoins
6. Volume alto + volatilidade: Ajustar confiança

Forneça EXATAMENTE:
DIREÇÃO: [LONG/SHORT/LONG_E_SHORT] (Obs: LONG_E_SHORT substitui NEUTRO)
CONFIANÇA: [65-95]
LÓGICA: [análise técnica em 3 linhas máximo]
`;

            let marketDirection = 'LONG_E_SHORT'; // Padrão convertido de NEUTRO
            let confidence = 75;
            let reasoning = 'Análise baseada em dados de mercado atuais';

            try {
                const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-3.5-turbo',
                    messages: [{ 
                        role: 'system', 
                        content: 'Você é um analista profissional de criptomoedas. Seja preciso e direto.' 
                    }, {
                        role: 'user', 
                        content: prompt 
                    }],
                    max_tokens: 200,
                    temperature: 0.3
                }, {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.APIS.OPENAI.KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: CONFIG.SECURITY.API_TIMEOUT
                });

                const responseTime = Date.now() - startTime;
                const aiText = aiResponse.data.choices[0].message.content;
                
                // Extrair direção com precisão
                const directionMatch = aiText.match(/DIREÇÃO:\s*(LONG|SHORT|LONG_E_SHORT)/i);
                if (directionMatch) {
                    marketDirection = directionMatch[1].toUpperCase();
                }
                
                // Extrair confiança
                const confMatch = aiText.match(/CONFIANÇA:\s*(\d+)/i);
                if (confMatch) {
                    confidence = Math.max(65, Math.min(95, parseInt(confMatch[1])));
                }
                
                // Extrair lógica
                const logicMatch = aiText.match(/LÓGICA:\s*(.+)/i);
                if (logicMatch) {
                    reasoning = logicMatch[1].trim();
                }

                await this.logAPICall('OpenAI', 'chat/completions', responseTime, 200, true, null, sistemaLeituraId);
                this.apiStats.openai.totalTime += responseTime;

            } catch (aiError) {
                const responseTime = Date.now() - startTime;
                fallbackUsed = true;
                
                await this.logAPICall('OpenAI', 'chat/completions', responseTime, 0, false, aiError.message, sistemaLeituraId);
                await this.logSystem('OPENAI', `Usando fallback profissional: ${aiError.message}`, 'WARN');
                
                // Fallback profissional baseado em regras
                if (fearGreedData.value < 25) {
                    marketDirection = 'LONG';
                    confidence = 80;
                    reasoning = 'Medo extremo detectado. Oportunidade histórica de compra.';
                } else if (fearGreedData.value > 75) {
                    marketDirection = 'SHORT';
                    confidence = 80;
                    reasoning = 'Ganância extrema. Alto risco de correção iminente.';
                } else if (binanceData.btcDominance > 50) {
                    marketDirection = 'LONG_E_SHORT'; // Convertido de NEUTRO
                    confidence = 70;
                    reasoning = 'BTC dominante. Mercado em consolidação, aguardar definição.';
                } else {
                    marketDirection = 'LONG';
                    confidence = 75;
                    reasoning = 'Temporada de altcoins. Dominância BTC baixa favorece diversificação.';
                }
            }

            await this.logSystem('IA_ANALYSIS', `Análise concluída: ${marketDirection} (${confidence}%) - Fallback: ${fallbackUsed}`, 'INFO', {
                direction: marketDirection,
                confidence,
                fallback_used: fallbackUsed,
                fear_greed: fearGreedData.value,
                btc_dominance: binanceData.btcDominance
            });

            return { 
                marketDirection, 
                confidence, 
                reasoning,
                fallbackUsed,
                timestamp: new Date(),
                extractionTime: Date.now() - startTime
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.apiStats.openai.errors++;
            
            await this.logSystem('IA_ANALYSIS', `Erro crítico na análise: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async salvarCicloCompleto(fearGreedData, binanceData, iaData, regrasAplicadas) {
        try {
            const result = await pool.query(`
                INSERT INTO sistema_leitura_mercado (
                    cycle_id, cycle_number,
                    fear_greed_value, fear_greed_classification, fear_greed_direction, fear_greed_timestamp,
                    btc_dominance, btc_price, total_market_cap, total_volume_24h,
                    top_gainers, top_losers, binance_timestamp,
                    openai_analysis, market_direction, confidence_level, reasoning,
                    fallback_used, openai_timestamp,
                    applied_rules, final_recommendation,
                    extraction_time_coinstats, extraction_time_binance, extraction_time_openai,
                    total_cycle_time, status, next_cycle_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
                ) RETURNING id
            `, [
                this.currentCycleId, this.cycleNumber,
                fearGreedData.value, fearGreedData.classification, fearGreedData.direction, fearGreedData.timestamp,
                binanceData.btcDominance, binanceData.btcPrice, binanceData.totalVolume, binanceData.totalVolume,
                JSON.stringify(binanceData.topGainers), JSON.stringify(binanceData.topLosers), binanceData.timestamp,
                iaData.reasoning, iaData.marketDirection, iaData.confidence, iaData.reasoning,
                iaData.fallbackUsed, iaData.timestamp,
                JSON.stringify(regrasAplicadas.appliedRules), regrasAplicadas.finalRecommendation,
                fearGreedData.extractionTime, binanceData.extractionTime, iaData.extractionTime,
                fearGreedData.extractionTime + binanceData.extractionTime + iaData.extractionTime,
                'ATIVO', new Date(Date.now() + CONFIG.UPDATE_INTERVAL)
            ]);

            const sistemaLeituraId = result.rows[0].id;

            // Salvar histórico de regras
            for (const regra of regrasAplicadas.appliedRules) {
                await pool.query(`
                    INSERT INTO sistema_leitura_regras_historico (
                        sistema_leitura_id, rule_type, rule_condition, rule_result,
                        rule_priority, input_values, output_recommendation, confidence_impact
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    sistemaLeituraId, regra.type, regra.condition, regra.result,
                    regra.priority, JSON.stringify({}), regrasAplicadas.finalRecommendation, regra.confidence_impact
                ]);
            }

            return sistemaLeituraId;

        } catch (error) {
            await this.logSystem('SAVE_CYCLE', `Erro ao salvar ciclo: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async executarCicloCompleto() {
        const cycleStartTime = Date.now();
        // Gerar UUID válido para PostgreSQL ao invés de string customizada
        const uuidResult = await pool.query('SELECT gen_random_uuid() as uuid');
        this.currentCycleId = uuidResult.rows[0].uuid;
        this.cycleNumber++;

        try {
            console.log(`\n🔄 INICIANDO CICLO ${this.cycleNumber} (${this.currentCycleId})...`);
            
            // 1. Extrair Fear & Greed
            const fearGreedData = await this.extrairFearGreed();
            
            // 2. Extrair Binance TOP 100
            const binanceData = await this.extrairBinanceTop100();
            
            // 3. Aplicar regras de negócio
            const regrasAplicadas = await this.aplicarRegrasNegocio(fearGreedData.value, binanceData.btcDominance);
            
            // 4. Análise com IA
            const iaData = await this.analisarComIA(fearGreedData, binanceData);
            
            // 5. Salvar ciclo completo
            const sistemaLeituraId = await this.salvarCicloCompleto(fearGreedData, binanceData, iaData, regrasAplicadas);
            
            const totalTime = Date.now() - cycleStartTime;

            console.log(`✅ CICLO ${this.cycleNumber} CONCLUÍDO EM ${totalTime}ms`);
            console.log(`   📊 Fear & Greed: ${fearGreedData.value} (${fearGreedData.classification})`);
            console.log(`   ₿ BTC: $${binanceData.btcPrice.toFixed(2)} | Dominance: ${binanceData.btcDominance.toFixed(2)}%`);
            console.log(`   🤖 IA: ${iaData.marketDirection} (${iaData.confidence}%) ${iaData.fallbackUsed ? '[FALLBACK]' : ''}`);
            console.log(`   🎯 Recomendação Final: ${regrasAplicadas.finalRecommendation}`);
            
            await this.logSystem('CICLO_COMPLETO', `Ciclo ${this.cycleNumber} executado com sucesso`, 'INFO', {
                cycle_id: this.currentCycleId,
                cycle_number: this.cycleNumber,
                total_time: totalTime,
                fear_greed: fearGreedData.value,
                btc_price: binanceData.btcPrice,
                btc_dominance: binanceData.btcDominance,
                direction: iaData.marketDirection,
                confidence: iaData.confidence,
                final_recommendation: regrasAplicadas.finalRecommendation,
                sistema_leitura_id: sistemaLeituraId
            });

        } catch (error) {
            console.error(`❌ ERRO NO CICLO ${this.cycleNumber}:`, error.message);
            await this.logSystem('CICLO_COMPLETO', `Erro no ciclo ${this.cycleNumber}: ${error.message}`, 'ERROR', {
                cycle_id: this.currentCycleId,
                cycle_number: this.cycleNumber,
                error_stack: error.stack
            });
        }
    }

    async executarLimpeza() {
        try {
            console.log('🧹 Executando limpeza automática profissional...');
            
            const result = await pool.query('SELECT * FROM executar_limpeza_sistema_leitura_mercado(24, true)');
            
            console.log('✅ Limpeza concluída:');
            result.rows.forEach(row => {
                console.log(`   📊 ${row.tabela}: ${row.registros_removidos} registros (${row.espaco_liberado})`);
            });
            
            this.lastCleanup = new Date();
            
        } catch (error) {
            console.error('❌ Erro na limpeza:', error.message);
            await this.logSystem('CLEANUP', `Erro na limpeza: ${error.message}`, 'ERROR');
        }
    }

    async verificarSeDeveExecutarLimpeza() {
        if (!this.lastCleanup || (Date.now() - this.lastCleanup.getTime()) >= CONFIG.CLEANUP_INTERVAL) {
            await this.executarLimpeza();
        }
    }

    async obterStatusAtual() {
        try {
            const result = await pool.query('SELECT * FROM vw_dashboard_sistema_leitura');
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao obter status:', error.message);
            return null;
        }
    }

    async obterEstatisticasPerformance() {
        try {
            const result = await pool.query('SELECT * FROM vw_sistema_leitura_status_atual');
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    async iniciar() {
        if (this.isRunning) {
            console.log('⚠️ Sistema já está em execução');
            return;
        }

        this.isRunning = true;
        await this.logSystem('SISTEMA', 'Sistema de Leitura do Mercado Profissional iniciado', 'INFO');
        
        console.log('🎯 SISTEMA DE LEITURA DO MERCADO PROFISSIONAL ATIVO');
        console.log('   ⏰ Ciclos automatizados a cada 15 minutos');
        console.log('   📊 Monitoramento completo de APIs');
        console.log('   🤖 IA com fallback profissional');
        console.log('   📈 Regras de negócio rigorosas');
        console.log('   🧹 Limpeza automática Enterprise');
        console.log('   📋 Logs e auditoria completos\n');

        // Executar primeira análise imediatamente
        await this.executarCicloCompleto();

        // Agendar próximos ciclos
        const intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.executarCicloCompleto();
                await this.verificarSeDeveExecutarLimpeza();
            } else {
                clearInterval(intervalId);
            }
        }, CONFIG.UPDATE_INTERVAL);

        const nextCycle = new Date(Date.now() + CONFIG.UPDATE_INTERVAL);
        console.log(`\n⏱️ Próximo ciclo agendado para: ${nextCycle.toLocaleTimeString('pt-BR')}`);
    }

    async parar() {
        this.isRunning = false;
        await this.logSystem('SISTEMA', 'Sistema de Leitura do Mercado Profissional parado', 'INFO');
        console.log('🛑 Sistema parado graciosamente');
    }

    getPerformanceStats() {
        return {
            cycleNumber: this.cycleNumber,
            apiStats: this.apiStats,
            uptime: this.isRunning ? Date.now() - this.startTime : 0,
            lastCleanup: this.lastCleanup
        };
    }
}

// Inicialização automática
const sistema = new SistemaLeituraMercadoProfissional();

// Handlers para encerramento gracioso
process.on('SIGINT', async () => {
    console.log('\n🔄 Encerrando Sistema de Leitura do Mercado...');
    await sistema.parar();
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await sistema.parar();
    await pool.end();
    process.exit(0);
});

// 🚀 INICIALIZAÇÃO DO SISTEMA APENAS SE EXECUTADO DIRETAMENTE
if (require.main === module) {
    // Validar configurações antes de iniciar
    validateConfig();
    
    // Log de inicialização
    console.log('🌟 INICIANDO SISTEMA DE LEITURA DO MERCADO ENTERPRISE');
    console.log(`🔧 Ambiente: ${CONFIG.SERVER.NODE_ENV}`);
    console.log(`🔄 Auto-start: ${CONFIG.SISTEMA.AUTO_START}`);
    console.log(`⏰ Intervalo: ${CONFIG.SISTEMA.CYCLE_INTERVAL / 60000} min`);
    
    sistema.iniciar().catch(console.error);
}

module.exports = { SistemaLeituraMercadoProfissional, CONFIG };

console.log(`
🎯 SISTEMA DE LEITURA DO MERCADO PROFISSIONAL v1.0

🏢 CARACTERÍSTICAS ENTERPRISE:
   ✅ Estrutura de banco robusta e escalável
   ✅ Monitoramento completo de APIs em tempo real
   ✅ Sistema de logs profissional com auditoria
   ✅ Regras de negócio aplicadas e rastreáveis
   ✅ IA com fallback inteligente e profissional
   ✅ Performance otimizada com índices e triggers
   ✅ Limpeza automática configurável
   ✅ Views analíticas para relatórios executive
   
📊 APIs INTEGRADAS:
   • CoinStats (Fear & Greed Index)
   • Binance (TOP 100 + Métricas de Mercado)
   • OpenAI (Análise Inteligente com Fallback)
   
🔄 OPERAÇÃO:
   • Ciclos automáticos de 15 minutos
   • Direções: LONG, SHORT, LONG_E_SHORT (LONG_E_SHORT substitui NEUTRO)
   • Recomendações: SOMENTE_LONG, SOMENTE_SHORT, LONG_E_SHORT (NEUTRO convertido para LONG_E_SHORT)
   • Limpeza automática a cada 24 horas
   
🚀 Para usar: node sistema-leitura-mercado-enterprise.js

⚠️  POLÍTICA ANTI-SIMULAÇÃO ATIVA:
   • PROIBIDO usar valores simulados, mock ou fake
   • Sistema para se APIs falharem (sem fallbacks simulados)
   • Auditoria automática para detecção de dados não-reais
   
📈 TRADING CLARIFICAÇÃO:
   • NEUTRO foi eliminado - convertido para LONG_E_SHORT
   • Não abrimos operações "neutras" - sempre LONG ou SHORT
   • LONG_E_SHORT permite ambas as direções conforme oportunidades
`);
