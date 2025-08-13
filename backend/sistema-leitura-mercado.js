#!/usr/bin/env node
/**
 * 🎯 SISTEMA DE LEITURA DO MERCADO - COINBITCLUB
 * 
 * RESPONSÁVEL: Análise completa do mercado de criptomoedas
 * INTEGRAÇÕES: CoinStats (F&G) + Binance (TOP 100) + OpenAI (Análise)
 * ATUALIZAÇÃO: 15 minutos
 * LIMPEZA: 24 horas (automática)
 * 
 * PARA NOVO DESENVOLVEDOR:
 * - Este é o sistema principal de leitura de mercado
 * - Todas as análises passam por aqui
 * - Dados são limpos automaticamente para não ocupar espaço
 */

require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

// ================================================
// CONFIGURAÇÕES PRINCIPAIS
// ================================================

const CONFIG = {
    // APIs
    COINSTATS_API_KEY: process.env.COINSTATS_API_KEY || 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY || 'tEJm7uhqtpgAftcaVGlQbADfR1LOmeLW5WkN6gNNYKzmmXyHso4NSAiXHFXdXRxw',
    
    // Intervalos
    LEITURA_INTERVAL: 15 * 60 * 1000, // 15 minutos
    LIMPEZA_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
    
    // URLs das APIs
    COINSTATS_FEAR_GREED: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
    COINSTATS_MARKETS: 'https://openapiv1.coinstats.app/markets',
    BINANCE_TICKER_24H: 'https://api.binance.com/api/v3/ticker/24hr',
    OPENAI_COMPLETIONS: 'https://api.openai.com/v1/chat/completions'
};

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ================================================
// CLASSE PRINCIPAL - SISTEMA DE LEITURA DO MERCADO
// ================================================

class SistemaLeituraMercado {
    constructor() {
        this.isRunning = false;
        this.ultimaLeitura = null;
        
        console.log('🎯 SISTEMA DE LEITURA DO MERCADO - COINBITCLUB');
        console.log('===============================================');
        console.log('📊 Integrações: CoinStats + Binance + OpenAI');
        console.log('⏰ Análise: 15 minutos');
        console.log('🧹 Limpeza: 24 horas (automática)');
        console.log('💾 Banco: PostgreSQL Railway\n');
    }

    // ================================================
    // 1️⃣ LEITURA DO ÍNDICE FEAR & GREED
    // ================================================
    async lerFearGreed() {
        console.log('1️⃣ Lendo Fear & Greed Index...');
        
        try {
            const response = await axios.get(CONFIG.COINSTATS_FEAR_GREED, {
                headers: {
                    'X-API-KEY': CONFIG.COINSTATS_API_KEY,
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            const valor = response.data.now?.value || 50; // Fallback: 50
            const classificacao = response.data.now?.value_classification || 'Neutral';

            // REGRAS DE DIREÇÃO FEAR & GREED
            let direcaoPermitida;
            if (valor < 30) {
                direcaoPermitida = 'SOMENTE_LONG'; // <30 → Somente Long
            } else if (valor > 80) {
                direcaoPermitida = 'SOMENTE_SHORT'; // >80 → Somente Short
            } else {
                direcaoPermitida = 'LONG_E_SHORT'; // 30-80 → Long e Short
            }

            const fearGreedData = {
                valor: valor,
                classificacao: classificacao,
                direcao_permitida: direcaoPermitida,
                timestamp: response.data.now?.update_time || new Date().toISOString(),
                fonte: 'coinstats_api'
            };

            console.log(`   ✅ F&G: ${valor} (${classificacao}) → ${direcaoPermitida}`);
            return fearGreedData;

        } catch (error) {
            console.log('   ⚠️ Erro CoinStats, usando fallback F&G = 50');
            return {
                valor: 50,
                classificacao: 'Neutral',
                direcao_permitida: 'LONG_E_SHORT',
                timestamp: new Date().toISOString(),
                fonte: 'fallback'
            };
        }
    }

    // ================================================
    // 2️⃣ LEITURA DA BINANCE (TOP 100)
    // ================================================
    async lerBinanceTop100() {
        console.log('2️⃣ Lendo Binance TOP 100...');
        
        try {
            // Dados 24h de todas as moedas
            const response = await axios.get(CONFIG.BINANCE_TICKER_24H, {
                timeout: 15000
            });

            // Filtrar e ordenar TOP 100 USDT por volume
            const top100 = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .map(ticker => ({
                    symbol: ticker.symbol,
                    baseAsset: ticker.symbol.replace('USDT', ''),
                    lastPrice: parseFloat(ticker.lastPrice),
                    priceChangePercent: parseFloat(ticker.priceChangePercent),
                    quoteVolume: parseFloat(ticker.quoteVolume),
                    highPrice: parseFloat(ticker.highPrice),
                    lowPrice: parseFloat(ticker.lowPrice)
                }))
                .sort((a, b) => b.quoteVolume - a.quoteVolume)
                .slice(0, 100);

            // ANÁLISE DOS DADOS
            const positivas = top100.filter(coin => coin.priceChangePercent > 0).length;
            const negativas = top100.filter(coin => coin.priceChangePercent < 0).length;
            const percentualPositivas = (positivas / 100) * 100;

            // Variação ponderada por volume
            const totalVolume = top100.reduce((sum, coin) => sum + coin.quoteVolume, 0);
            const variacaoPonderada = top100.reduce((sum, coin) => {
                return sum + (coin.priceChangePercent * (coin.quoteVolume / totalVolume));
            }, 0);

            // Dominância BTC
            const btcData = top100.find(coin => coin.baseAsset === 'BTC');
            const btcDominance = btcData ? (btcData.quoteVolume / totalVolume) * 100 : 0;

            // Volatilidade média
            const volatilidade = top100.reduce((sum, coin) => {
                return sum + ((coin.highPrice - coin.lowPrice) / coin.lowPrice) * 100;
            }, 0) / 100;

            const binanceData = {
                total_analisadas: 100,
                moedas_positivas: positivas,
                moedas_negativas: negativas,
                percentual_positivas: percentualPositivas,
                variacao_ponderada: variacaoPonderada,
                btc_dominance: btcDominance,
                volatilidade_media: volatilidade,
                volume_total_24h: totalVolume,
                top_10: top100.slice(0, 10),
                timestamp: new Date().toISOString()
            };

            console.log(`   ✅ TOP 100: ${percentualPositivas.toFixed(1)}% positivas`);
            console.log(`   📊 Dominância BTC: ${btcDominance.toFixed(1)}%`);
            console.log(`   🔄 Variação ponderada: ${variacaoPonderada.toFixed(2)}%`);

            return binanceData;

        } catch (error) {
            console.log('   ❌ Erro Binance:', error.message);
            throw error;
        }
    }

    // ================================================
    // 3️⃣ LEITURA DA DOMINÂNCIA BTC (CoinStats Markets)
    // ================================================
    async lerDominanciaBTC() {
        console.log('3️⃣ Lendo dominância BTC (CoinStats Markets)...');
        
        try {
            const response = await axios.get(CONFIG.COINSTATS_MARKETS, {
                headers: {
                    'X-API-KEY': CONFIG.COINSTATS_API_KEY,
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            // Buscar BTC nos dados
            const btcData = response.data.result?.find(coin => coin.symbol === 'BTC');
            const dominancia = btcData?.marketCap ? 
                (btcData.marketCap / response.data.totalMarketCap) * 100 : 50;

            console.log(`   ✅ Dominância BTC: ${dominancia.toFixed(2)}%`);
            
            return {
                dominancia_btc: dominancia,
                market_cap_total: response.data.totalMarketCap || 0,
                fonte: 'coinstats_markets'
            };

        } catch (error) {
            console.log('   ⚠️ Erro CoinStats Markets, usando dados Binance');
            return {
                dominancia_btc: 50,
                market_cap_total: 0,
                fonte: 'fallback'
            };
        }
    }

    // ================================================
    // 4️⃣ ANÁLISE DA IA (OpenAI)
    // ================================================
    async consultarIA(fearGreedData, binanceData, dominanciaData) {
        console.log('4️⃣ Consultando IA para análise...');
        
        try {
            const prompt = `
ANÁLISE DE MERCADO CRIPTO - SISTEMA DE LEITURA DO MERCADO

DADOS ATUAIS:
- Fear & Greed Index: ${fearGreedData.valor} (${fearGreedData.classificacao})
- Direção F&G: ${fearGreedData.direcao_permitida}
- Moedas positivas TOP 100: ${binanceData.percentual_positivas.toFixed(1)}%
- Dominância BTC: ${dominanciaData.dominancia_btc.toFixed(1)}%
- Variação ponderada: ${binanceData.variacao_ponderada.toFixed(2)}%
- Volatilidade média: ${binanceData.volatilidade_media.toFixed(2)}%

REGRAS DE ANÁLISE:
1. Fear & Greed PREVALECE sempre:
   - <30: SOMENTE LONG
   - 30-80: LONG e SHORT
   - >80: SOMENTE SHORT

2. Dominância BTC:
   - ≥50% e subindo: SHORT Altcoins
   - ≤45% e caindo: LONG Altcoins
   - Estável: NEUTRO

3. Se divergência entre indicadores:
   - Fear & Greed prevalece
   - Reduzir 50% dos parâmetros de abertura

RESPONDA EM JSON:
{
  "direcao_final": "LONG/SHORT/NEUTRO",
  "confianca": 0.0-1.0,
  "divergencia_detectada": true/false,
  "reducao_parametros": true/false,
  "justificativa": "explicação em 1 linha"
}
`;

            const response = await axios.post(CONFIG.OPENAI_COMPLETIONS, {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é o sistema de análise do SISTEMA DE LEITURA DO MERCADO. Sempre responda em JSON válido.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            });

            const iaResponse = response.data.choices[0].message.content;
            console.log('   🤖 Resposta IA:', iaResponse);

            try {
                const analiseIA = JSON.parse(iaResponse);
                console.log(`   ✅ IA decidiu: ${analiseIA.direcao_final} (${Math.round(analiseIA.confianca * 100)}%)`);
                
                return {
                    direcao_final: analiseIA.direcao_final || 'NEUTRO',
                    confianca: analiseIA.confianca || 0.5,
                    divergencia_detectada: analiseIA.divergencia_detectada || false,
                    reducao_parametros: analiseIA.reducao_parametros || false,
                    justificativa: analiseIA.justificativa || 'Análise padrão',
                    tokens_usados: response.data.usage?.total_tokens || 0,
                    fonte: 'openai'
                };

            } catch (parseError) {
                // Fallback se não conseguir parsear JSON
                return this.analiseFallback(fearGreedData, binanceData);
            }

        } catch (error) {
            console.log('   ⚠️ OpenAI indisponível, usando análise fallback');
            return this.analiseFallback(fearGreedData, binanceData);
        }
    }

    // ================================================
    // ANÁLISE FALLBACK (sem IA)
    // ================================================
    analiseFallback(fearGreedData, binanceData) {
        let direcao = 'NEUTRO';
        let confianca = 0.6;
        let justificativa = 'Análise baseada em Fear & Greed';

        // Seguir regras Fear & Greed
        if (fearGreedData.valor < 30) {
            direcao = 'LONG';
            confianca = 0.8;
            justificativa = 'F&G baixo indica medo extremo - oportunidade LONG';
        } else if (fearGreedData.valor > 80) {
            direcao = 'SHORT';
            confianca = 0.8;
            justificativa = 'F&G alto indica ganância extrema - sinal SHORT';
        } else if (binanceData.percentual_positivas > 70) {
            direcao = 'LONG';
            confianca = 0.7;
            justificativa = 'Maioria das moedas positivas - tendência LONG';
        } else if (binanceData.percentual_positivas < 30) {
            direcao = 'SHORT';
            confianca = 0.7;
            justificativa = 'Maioria das moedas negativas - tendência SHORT';
        }

        return {
            direcao_final: direcao,
            confianca: confianca,
            divergencia_detectada: false,
            reducao_parametros: false,
            justificativa: justificativa,
            tokens_usados: 0,
            fonte: 'fallback'
        };
    }

    // ================================================
    // 💾 SALVAR DADOS NO BANCO
    // ================================================
    async salvarLeituraMercado(dados) {
        try {
            console.log('💾 Salvando leitura do mercado...');
            
            await pool.query(`
                INSERT INTO sistema_leitura_mercado (
                    fear_greed_index, fear_greed_classificacao, fear_greed_direcao,
                    binance_positivas, binance_percentual_positivas, binance_variacao_ponderada,
                    btc_dominance, volatilidade_media, volume_total_24h,
                    ia_direcao_final, ia_confianca, ia_divergencia, ia_reducao_parametros,
                    ia_justificativa, dados_completos, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
            `, [
                dados.fearGreed.valor,
                dados.fearGreed.classificacao,
                dados.fearGreed.direcao_permitida,
                dados.binance.moedas_positivas,
                dados.binance.percentual_positivas,
                dados.binance.variacao_ponderada,
                dados.dominancia.dominancia_btc,
                dados.binance.volatilidade_media,
                dados.binance.volume_total_24h,
                dados.ia.direcao_final,
                dados.ia.confianca,
                dados.ia.divergencia_detectada,
                dados.ia.reducao_parametros,
                dados.ia.justificativa,
                JSON.stringify(dados)
            ]);

            console.log('   ✅ Dados salvos no banco');

        } catch (error) {
            console.error('   ❌ Erro ao salvar:', error.message);
        }
    }

    // ================================================
    // 🧹 LIMPEZA AUTOMÁTICA (24 HORAS)
    // ================================================
    async executarLimpezaAutomatica() {
        try {
            console.log('\n🧹 EXECUTANDO LIMPEZA AUTOMÁTICA DO SISTEMA DE LEITURA DO MERCADO...');
            
            const resultado = await pool.query(`
                WITH dados_removidos AS (
                    DELETE FROM sistema_leitura_mercado 
                    WHERE timestamp < NOW() - INTERVAL '24 hours'
                    RETURNING id
                ),
                logs_removidos AS (
                    DELETE FROM system_logs 
                    WHERE created_at < NOW() - INTERVAL '24 hours'
                    AND message LIKE '%SISTEMA DE LEITURA%'
                    RETURNING id
                ),
                sinais_removidos AS (
                    DELETE FROM ia_analysis_results 
                    WHERE created_at < NOW() - INTERVAL '24 hours'
                    RETURNING id
                )
                SELECT 
                    (SELECT COUNT(*) FROM dados_removidos) as leituras_removidas,
                    (SELECT COUNT(*) FROM logs_removidos) as logs_removidos,
                    (SELECT COUNT(*) FROM sinais_removidos) as sinais_removidos
            `);

            const stats = resultado.rows[0];
            
            console.log(`   ✅ Limpeza concluída:`);
            console.log(`      📊 ${stats.leituras_removidas} leituras de mercado removidas`);
            console.log(`      📝 ${stats.logs_removidos} logs removidos`);
            console.log(`      🎯 ${stats.sinais_removidos} sinais removidos`);
            
            // Log da limpeza
            await pool.query(`
                INSERT INTO system_logs (level, message, created_at) 
                VALUES ('INFO', 'SISTEMA DE LEITURA DO MERCADO: Limpeza automática executada - ${stats.leituras_removidas} registros removidos', NOW())
            `);

        } catch (error) {
            console.error('❌ Erro na limpeza automática:', error.message);
        }
    }

    // ================================================
    // 🔄 CICLO PRINCIPAL DE LEITURA
    // ================================================
    async executarLeituraMercado() {
        if (this.isRunning) {
            console.log('⏳ Leitura anterior ainda em andamento...');
            return;
        }

        this.isRunning = true;
        const timestamp = new Date().toISOString();

        try {
            console.log('\n🎯 === NOVA LEITURA DO MERCADO ===');
            console.log('📅 Timestamp:', timestamp);

            // 1. Fear & Greed
            const fearGreedData = await this.lerFearGreed();
            
            // 2. Binance TOP 100
            const binanceData = await this.lerBinanceTop100();
            
            // 3. Dominância BTC
            const dominanciaData = await this.lerDominanciaBTC();
            
            // 4. Análise IA
            const iaData = await this.consultarIA(fearGreedData, binanceData, dominanciaData);

            // 5. Consolidar dados
            const leituraCompleta = {
                timestamp: timestamp,
                fearGreed: fearGreedData,
                binance: binanceData,
                dominancia: dominanciaData,
                ia: iaData
            };

            // 6. Salvar no banco
            await this.salvarLeituraMercado(leituraCompleta);

            // 7. Resultado final
            this.ultimaLeitura = leituraCompleta;

            console.log('\n✅ === LEITURA CONCLUÍDA ===');
            console.log(`🎯 DIREÇÃO FINAL: ${iaData.direcao_final}`);
            console.log(`📊 Confiança: ${Math.round(iaData.confianca * 100)}%`);
            console.log(`⚠️ Redução parâmetros: ${iaData.reducao_parametros ? 'SIM' : 'NÃO'}`);
            console.log(`💡 Justificativa: ${iaData.justificativa}`);

            return leituraCompleta;

        } catch (error) {
            console.error('❌ Erro na leitura do mercado:', error.message);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    // ================================================
    // 🚀 INICIALIZAÇÃO DO SISTEMA
    // ================================================
    iniciarSistema() {
        console.log('🔄 Iniciando SISTEMA DE LEITURA DO MERCADO...');
        
        // Primeira leitura imediata
        this.executarLeituraMercado();
        
        // Leituras regulares (15 minutos)
        setInterval(() => {
            this.executarLeituraMercado();
        }, CONFIG.LEITURA_INTERVAL);
        
        // Limpeza automática (24 horas)
        setInterval(() => {
            this.executarLimpezaAutomatica();
        }, CONFIG.LIMPEZA_INTERVAL);
        
        console.log('✅ Sistema ativo! Pressione Ctrl+C para parar');
    }

    // Obter última leitura
    obterUltimaLeitura() {
        return this.ultimaLeitura;
    }
}

// ================================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ================================================

const sistemaLeitura = new SistemaLeituraMercado();

// Verificar argumentos de linha de comando
if (process.argv.includes('--once')) {
    console.log('🔄 Executando leitura única...');
    sistemaLeitura.executarLeituraMercado()
        .then(resultado => {
            console.log('\n✅ RESULTADO DA LEITURA:');
            console.log(`📊 F&G: ${resultado.fearGreed.valor} → ${resultado.fearGreed.direcao_permitida}`);
            console.log(`💰 Binance: ${resultado.binance.percentual_positivas.toFixed(1)}% positivas`);
            console.log(`🎯 IA: ${resultado.ia.direcao_final} (${Math.round(resultado.ia.confianca * 100)}%)`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro:', error.message);
            process.exit(1);
        });
} else if (process.argv.includes('--cleanup')) {
    console.log('🧹 Executando limpeza manual...');
    sistemaLeitura.executarLimpezaAutomatica()
        .then(() => {
            console.log('✅ Limpeza concluída');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro na limpeza:', error.message);
            process.exit(1);
        });
} else {
    // Modo contínuo
    sistemaLeitura.iniciarSistema();
}

// Exportar para uso em outros módulos
module.exports = sistemaLeitura;
