import axios from 'axios';

// Configuração do axios para ignorar erro de SSL em desenvolvimento
const axiosConfig = {
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingViewWebhook/1.0'
    },
    validateStatus: function (status) {
        return status >= 200 && status < 600; // Aceita qualquer resposta para debug
    }
};

// Dados de teste do webhook do TradingView
const webhookData = {
    timestamp: new Date().toISOString(),
    exchange: "BINANCE",
    symbol: "BTCUSDT",
    action: "BUY",
    price: 45000,
    volume: 0.001,
    strategy: "TEST_SIGNAL",
    source: "TradingView"
};

console.log('🚀 ===== TESTE FINAL DO WEBHOOK =====');
console.log('📊 Dados do sinal:', JSON.stringify(webhookData, null, 2));

async function testWebhook() {
    try {
        console.log('\n📡 Enviando webhook para localhost:3001...');
        
        const response = await axios.post(
            'http://localhost:3001/api/webhooks/tradingview',
            webhookData,
            axiosConfig
        );
        
        console.log(`\n✅ SUCESSO! Status: ${response.status}`);
        console.log('📋 Resposta:', response.data);
        console.log('🔗 Headers de resposta:', response.headers);
        
        if (response.status === 200) {
            console.log('\n🎉 WEBHOOK FUNCIONANDO PERFEITAMENTE!');
            console.log('✅ Sinais do TradingView estão sendo recebidos com código 200');
        }
        
    } catch (error) {
        console.log('\n❌ ERRO NO TESTE:');
        
        if (error.response) {
            console.log(`📊 Status: ${error.response.status}`);
            console.log(`📋 Resposta: ${JSON.stringify(error.response.data, null, 2)}`);
            console.log(`🔗 Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
        } else if (error.request) {
            console.log('🔍 Erro de conexão:', error.message);
            console.log('📡 Request não conseguiu chegar ao servidor');
        } else {
            console.log('⚠️ Erro geral:', error.message);
        }
    }
}

// Teste de conectividade básica primeiro
async function testConnection() {
    try {
        console.log('\n🔍 Testando conectividade básica...');
        
        const response = await axios.get(
            'http://localhost:3001/api/status',
            { ...axiosConfig, timeout: 5000 }
        );
        
        console.log(`✅ Servidor está ativo! Status: ${response.status}`);
        return true;
        
    } catch (error) {
        console.log('❌ Servidor não está respondendo');
        console.log('🔍 Erro:', error.message);
        return false;
    }
}

// Execução principal
async function main() {
    console.log('⏰ Iniciando testes em', new Date().toLocaleString());
    
    // Teste de conectividade
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.log('\n🚨 SERVIDOR NÃO ESTÁ ACESSÍVEL');
        console.log('💡 Verifique se o servidor está rodando na porta 3001');
        process.exit(1);
    }
    
    // Teste do webhook
    await testWebhook();
    
    console.log('\n🏁 Teste finalizado!');
}

main().catch(console.error);
