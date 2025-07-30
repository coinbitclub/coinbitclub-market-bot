const axios = require('axios');

async function testTradingSignal() {
    console.log('🎯 TESTANDO SINAL DE TRADING');
    console.log('============================');
    
    const testSignal = {
        ticker: "BTCUSDT",
        time: "2025-07-30 00:30:00",
        close: "67500.00",
        ema9_30: "67200.50",
        rsi_4h: "58.5",
        rsi_15: "62.8",
        momentum_15: "0.024",
        atr_30: "1250.5",
        atr_pct_30: "1.85",
        vol_30: "12580",
        vol_ma_30: "11420",
        diff_btc_ema7: "0.52",
        cruzou_acima_ema9: "1",
        cruzou_abaixo_ema9: "0",
        golden_cross_30: "0",
        death_cross_30: "0",
        signal: "SINAL LONG"
    };
    
    try {
        console.log('📡 Enviando sinal de teste para webhook...');
        console.log('🎯 Sinal:', testSignal.signal);
        console.log('💰 Par:', testSignal.ticker);
        console.log('💵 Preço:', testSignal.close);
        
        const response = await axios.post('http://localhost:3000/webhook/tradingview', testSignal, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('\n✅ RESPOSTA DO SISTEMA:');
        console.log('Status:', response.status);
        console.log('Resposta:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 SINAL PROCESSADO COM SUCESSO!');
            console.log('💡 Sistema de trading está operacional');
            
            // Aguardar um pouco e verificar se alguma operação foi criada
            console.log('\n⏳ Aguardando processamento...');
            setTimeout(async () => {
                try {
                    const statusResponse = await axios.get('http://localhost:8080/api/status');
                    console.log('\n📊 Status do sistema:', statusResponse.data.status);
                } catch (error) {
                    console.log('❌ Erro ao verificar status:', error.message);
                }
            }, 3000);
            
        } else {
            console.log('\n⚠️ Sinal não foi processado');
            console.log('Motivo:', response.data.reason || 'Não especificado');
        }
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Dados:', error.response.data);
        } else {
            console.log('Erro:', error.message);
        }
    }
}

// Executar teste
testTradingSignal();
