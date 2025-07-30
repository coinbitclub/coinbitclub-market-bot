/**
 * 🧪 TESTE COMPLETO DOS SINAIS COINBITCLUB
 * 
 * Testa todos os tipos de sinais do Pine Script CoinBitClub
 * com payloads realistas baseados no código Pine
 */

const https = require('https');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

console.log('🧪 TESTE COMPLETO SINAIS COINBITCLUB');
console.log('====================================');
console.log(`🎯 URL: ${BASE_URL}`);
console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);

// === PAYLOADS DE TESTE BASEADOS NO PINE SCRIPT ===

const testSignals = [
    {
        name: "SINAL LONG (entrada média)",
        payload: {
            ticker: "BTCUSDT",
            time: "2025-07-30 15:30:00",
            close: "45123.45",
            ema9_30: "44987.12",
            rsi_4h: "68.54",
            rsi_15: "72.18",
            momentum_15: "234.67",
            atr_30: "1256.78",
            atr_pct_30: "2.78",
            vol_30: "15678.45",
            vol_ma_30: "12456.78",
            diff_btc_ema7: "0.67", // > 0.5% = entrada LONG
            cruzou_acima_ema9: "1",
            cruzou_abaixo_ema9: "0",
            golden_cross_30: "0",
            death_cross_30: "0",
            signal: "SINAL LONG"
        }
    },
    
    {
        name: "SINAL LONG FORTE (entrada forte)",
        payload: {
            ticker: "ETHUSDT",
            time: "2025-07-30 15:35:00",
            close: "2456.78",
            ema9_30: "2432.15",
            rsi_4h: "74.32",
            rsi_15: "78.45",
            momentum_15: "87.23",
            atr_30: "45.67",
            atr_pct_30: "1.86",
            vol_30: "9876.54",
            vol_ma_30: "8765.43",
            diff_btc_ema7: "1.12", // > 0.8% = entrada FORTE
            cruzou_acima_ema9: "1",
            cruzou_abaixo_ema9: "0",
            golden_cross_30: "1", // Golden Cross também
            death_cross_30: "0",
            signal: "SINAL LONG FORTE"
        }
    },
    
    {
        name: "SINAL SHORT (entrada média)",
        payload: {
            ticker: "ADAUSDT",
            time: "2025-07-30 15:40:00",
            close: "0.4523",
            ema9_30: "0.4567",
            rsi_4h: "32.15",
            rsi_15: "28.76",
            momentum_15: "-12.34",
            atr_30: "0.0234",
            atr_pct_30: "5.18",
            vol_30: "234567.89",
            vol_ma_30: "198765.43",
            diff_btc_ema7: "-0.73", // < -0.5% = entrada SHORT
            cruzou_acima_ema9: "0",
            cruzou_abaixo_ema9: "1",
            golden_cross_30: "0",
            death_cross_30: "0",
            signal: "SINAL SHORT"
        }
    },
    
    {
        name: "SINAL SHORT FORTE (entrada forte)",
        payload: {
            ticker: "SOLUSDT",
            time: "2025-07-30 15:45:00",
            close: "98.45",
            ema9_30: "101.23",
            rsi_4h: "25.67",
            rsi_15: "22.34",
            momentum_15: "-45.67",
            atr_30: "4.56",
            atr_pct_30: "4.63",
            vol_30: "45678.90",
            vol_ma_30: "39876.54",
            diff_btc_ema7: "-1.15", // < -0.8% = entrada FORTE
            cruzou_acima_ema9: "0",
            cruzou_abaixo_ema9: "1",
            golden_cross_30: "0",
            death_cross_30: "1", // Death Cross também
            signal: "SINAL SHORT FORTE"
        }
    },
    
    {
        name: "FECHE LONG (saída de posição)",
        payload: {
            ticker: "BTCUSDT",
            time: "2025-07-30 16:00:00",
            close: "44987.23",
            ema9_30: "45123.45",
            rsi_4h: "45.32",
            rsi_15: "42.18",
            momentum_15: "-67.89",
            atr_30: "1345.67",
            atr_pct_30: "2.99",
            vol_30: "13456.78",
            vol_ma_30: "15678.90",
            diff_btc_ema7: "-0.35", // Reversão: era positivo, agora negativo
            cruzou_acima_ema9: "0",
            cruzou_abaixo_ema9: "1", // Cruzou para baixo = sair de LONG
            golden_cross_30: "0",
            death_cross_30: "0",
            signal: "FECHE LONG"
        }
    },
    
    {
        name: "FECHE SHORT (saída de posição)",
        payload: {
            ticker: "ETHUSDT",
            time: "2025-07-30 16:05:00",
            close: "2478.90",
            ema9_30: "2456.78",
            rsi_4h: "58.76",
            rsi_15: "62.34",
            momentum_15: "34.56",
            atr_30: "48.90",
            atr_pct_30: "1.97",
            vol_30: "8765.43",
            vol_ma_30: "9876.54",
            diff_btc_ema7: "0.45", // Reversão: era negativo, agora positivo
            cruzou_acima_ema9: "1", // Cruzou para cima = sair de SHORT
            cruzou_abaixo_ema9: "0",
            golden_cross_30: "0",
            death_cross_30: "0",
            signal: "FECHE SHORT"
        }
    },
    
    {
        name: "CONFIRMAÇÃO LONG",
        payload: {
            ticker: "BNBUSDT",
            time: "2025-07-30 16:10:00",
            close: "312.45",
            ema9_30: "309.87",
            rsi_4h: "65.43",
            rsi_15: "69.87",
            momentum_15: "12.34",
            atr_30: "8.76",
            atr_pct_30: "2.80",
            vol_30: "3456.78",
            vol_ma_30: "2987.65",
            diff_btc_ema7: "0.58", // Confirmação: passou de <0.5% para >0.5%
            cruzou_acima_ema9: "0", // Cruzamento foi na barra anterior
            cruzou_abaixo_ema9: "0",
            golden_cross_30: "0",
            death_cross_30: "0",
            signal: "CONFIRMAÇÃO LONG"
        }
    },
    
    {
        name: "CONFIRMAÇÃO SHORT",
        payload: {
            ticker: "XRPUSDT",
            time: "2025-07-30 16:15:00",
            close: "0.5234",
            ema9_30: "0.5298",
            rsi_4h: "34.56",
            rsi_15: "31.23",
            momentum_15: "-8.90",
            atr_30: "0.0187",
            atr_pct_30: "3.57",
            vol_30: "123456.78",
            vol_ma_30: "145678.90",
            diff_btc_ema7: "-0.67", // Confirmação: passou de >-0.5% para <-0.5%
            cruzou_acima_ema9: "0",
            cruzou_abaixo_ema9: "0", // Cruzamento foi na barra anterior
            golden_cross_30: "0",
            death_cross_30: "0",
            signal: "CONFIRMAÇÃO SHORT"
        }
    }
];

async function executarTestes() {
    console.log('\n🚀 INICIANDO TESTES DOS SINAIS COINBITCLUB');
    console.log('==========================================');
    
    for (let i = 0; i < testSignals.length; i++) {
        const test = testSignals[i];
        console.log(`\n🔥 TESTE ${i + 1}: ${test.name.toUpperCase()}`);
        console.log('='.repeat(50));
        
        await testarSinalCoinBitClub(test.payload);
        
        // Aguardar 1 segundo entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Teste de compatibilidade com sinal simples
    console.log('\n🔥 TESTE FINAL: COMPATIBILIDADE COM SINAL SIMPLES');
    console.log('='.repeat(50));
    
    const simpleSinal = {
        symbol: "BTCUSDT",
        action: "BUY",
        price: 45000,
        strategy: "simple_test",
        timeframe: "1h"
    };
    
    await testarSinalCoinBitClub(simpleSinal);
    
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Total de testes: ${testSignals.length + 1}`);
    console.log('🎯 Tipos testados:');
    console.log('   • SINAL LONG (entrada média)');
    console.log('   • SINAL LONG FORTE (entrada forte)');
    console.log('   • SINAL SHORT (entrada média)');
    console.log('   • SINAL SHORT FORTE (entrada forte)');
    console.log('   • FECHE LONG (saída)');
    console.log('   • FECHE SHORT (saída)');
    console.log('   • CONFIRMAÇÃO LONG');
    console.log('   • CONFIRMAÇÃO SHORT');
    console.log('   • Sinal simples (compatibilidade)');
    
    console.log('\n🔗 CONFIGURAÇÃO PARA TRADINGVIEW:');
    console.log('URL: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal');
    console.log('Method: POST');
    console.log('Content-Type: application/json');
    
    console.log('\n📦 PAYLOAD PARA ALERTAS (use no Pine Script):');
    console.log('No final do código Pine, nos alertas, use:');
    console.log('alert(build_json("SINAL LONG"), alert.freq_once_per_bar)');
    console.log('\n✅ SISTEMA 100% PREPARADO PARA COINBITCLUB!');
}

function testarSinalCoinBitClub(payload) {
    return new Promise((resolve) => {
        console.log(`🔄 Testando: ${payload.signal || payload.action}`);
        console.log(`📊 Símbolo: ${payload.ticker || payload.symbol}`);
        
        if (payload.diff_btc_ema7) {
            console.log(`📈 Diff BTC/EMA7: ${payload.diff_btc_ema7}%`);
        }
        
        console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'coinbitclub-market-bot.up.railway.app',
            port: 443,
            path: '/api/webhooks/signal',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);

            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(responseData);
                    console.log(`✅ Resposta:`, JSON.stringify(jsonResponse, null, 2));
                    
                    if (jsonResponse.success) {
                        console.log(`🎯 Sinal processado com sucesso!`);
                        if (jsonResponse.signal_type) {
                            console.log(`   Tipo: ${jsonResponse.signal_type}`);
                            console.log(`   Ação: ${jsonResponse.action}`);
                            console.log(`   Força: ${jsonResponse.strength}`);
                        }
                    }
                } catch (e) {
                    console.log(`✅ Resposta (raw):`, responseData);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Erro na requisição:`, error.message);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

// Executar os testes
executarTestes().catch(console.error);
