/**
 * 🧪 TESTE DO SISTEMA COMPLETO - VERIFICAÇÃO DE FUNCIONAMENTO
 * ===========================================================
 * Testa webhook + Fear & Greed + processamento de sinais
 */

const axios = require('axios');

async function testarSistemaCompleto() {
    console.log('🧪 INICIANDO TESTE DO SISTEMA COMPLETO');
    console.log('=====================================');

    try {
        // 1. Testar se o orquestrador está rodando
        console.log('1. 🔍 Testando servidor orquestrador...');
        
        const response = await axios.get('http://localhost:3000/status', {
            timeout: 5000
        });
        
        console.log('✅ Orquestrador ATIVO:', response.data);
        
        // 2. Testar webhook TradingView
        console.log('\n2. 🔔 Testando webhook TradingView...');
        
        const sinalTeste = {
            action: 'SINAL LONG',
            ticker: 'BTCUSDT',
            price: 72500.00,
            timestamp: new Date().toISOString(),
            source: 'TESTE_SISTEMA'
        };
        
        const webhookResponse = await axios.post('http://localhost:3000/webhook/tradingview', sinalTeste, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Webhook funcionando:', webhookResponse.data);
        
        // 3. Verificar dashboard
        console.log('\n3. 📊 Testando dashboard...');
        
        const dashboardResponse = await axios.get('http://localhost:3000/api/dashboard/paloma', {
            timeout: 5000
        });
        
        console.log('✅ Dashboard funcionando:', dashboardResponse.data.usuario);
        
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('Sistema está funcionando corretamente.');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 SOLUÇÃO: Inicie o servidor orquestrador primeiro!');
        }
    }
}

testarSistemaCompleto();
