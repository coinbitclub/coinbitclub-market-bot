/**
 * 🔍 BUSCA POR OUTRAS CHAVES NO SISTEMA
 * ====================================
 * 
 * Vamos procurar se há outras chaves funcionando no código
 */

console.log('🔍 BUSCA POR OUTRAS CHAVES NO SISTEMA');
console.log('===================================\n');

// Chaves encontradas no código
const chavesEncontradas = [
    // Do arquivo test-working-keys.js
    {
        nome: "Luiza - Test Working Keys",
        apiKey: "iGBRNexUa9OwJQqfM1",
        apiSecret: "HYfCLjFDbzKhJgK4vBPgbRQzGHw0LPsXBuHM"
    },
    {
        nome: "Paloma - Test Working Keys", 
        apiKey: "twS3VQO6t8L2yEwZaO",
        apiSecret: "YgP8KJmnmX6n4pzP3TbAOr7j6K4g7x9T2Vf9"
    },
    
    // Do arquivo debug-bybit-connection.js
    {
        nome: "Debug Connection Test",
        apiKey: "iGBRNexUa9OwJQqfM1", 
        apiSecret: "HYfCLjFDbzKhJgK4vBPgbRQzGHw0LPsXBuHM"
    },
    
    // Chaves que testamos antes (possivelmente diferentes)
    {
        nome: "Paloma Original",
        apiKey: "15t5ByCJWFAKOvNF0E",
        apiSecret: "LxHPOFcxzZ6v9l0HYLm9GUvhm6TaF6PQX1vN"
    },
    {
        nome: "Erica Original",
        apiKey: "3rz1Bwm3SFdF3Aep8Z", 
        apiSecret: "TPXH43y8r9YGsIYO5l3HXzjH3a6dWL1oi2vG"
    }
];

const crypto = require('crypto');

async function testBybitKey(nome, apiKey, apiSecret) {
    console.log(`\n🧪 TESTANDO: ${nome}`);
    console.log(`🔑 API Key: ${apiKey}`);
    console.log('-----------------------------------');
    
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        // Método oficial da documentação Bybit
        const signaturePayload = timestamp + apiKey + recvWindow + queryString;
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(signaturePayload)
            .digest('hex');
        
        const url = `https://api.bybit.com/v5/account/wallet-balance?${queryString}&sign=${signature}`;
        
        const response = await fetch(url, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        
        const responseText = await response.text();
        
        if (response.status === 200 && responseText) {
            try {
                const data = JSON.parse(responseText);
                console.log(`🎯 Código de retorno: ${data.retCode}`);
                console.log(`💬 Mensagem: ${data.retMsg}`);
                
                if (data.retCode === 0) {
                    console.log('✅ CHAVE VÁLIDA! Checando saldos...');
                    
                    if (data.result && data.result.list) {
                        let totalValue = 0;
                        for (const account of data.result.list) {
                            if (account.coin && account.coin.length > 0) {
                                for (const coin of account.coin) {
                                    const balance = parseFloat(coin.walletBalance);
                                    if (balance > 0) {
                                        console.log(`💰 ${coin.coin}: ${balance}`);
                                        if (coin.coin === 'USDT') totalValue += balance;
                                    }
                                }
                            }
                        }
                        console.log(`💎 Total em USDT: $${totalValue.toFixed(2)}`);
                        return { status: 'valid', balance: totalValue };
                    }
                } else {
                    console.log(`❌ Erro: ${data.retMsg}`);
                    return { status: 'invalid', error: data.retMsg };
                }
            } catch (parseError) {
                console.log('❌ Erro ao parsear resposta');
                return { status: 'error', error: 'Parse error' };
            }
        } else {
            console.log('❌ Requisição falhou');
            return { status: 'failed', error: `HTTP ${response.status}` };
        }
        
    } catch (error) {
        console.log(`❌ Erro na requisição: ${error.message}`);
        return { status: 'exception', error: error.message };
    }
    
    return { status: 'unknown' };
}

async function testAllKeys() {
    console.log('🚀 TESTANDO TODAS AS CHAVES ENCONTRADAS NO CÓDIGO\n');
    
    const resultados = [];
    
    for (const chave of chavesEncontradas) {
        const resultado = await testBybitKey(chave.nome, chave.apiKey, chave.apiSecret);
        resultados.push({
            nome: chave.nome,
            apiKey: chave.apiKey,
            resultado: resultado
        });
        
        // Pausa entre requisições para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 RESUMO DOS RESULTADOS');
    console.log('========================');
    
    const chavesValidas = resultados.filter(r => r.resultado.status === 'valid');
    const chavesInvalidas = resultados.filter(r => r.resultado.status === 'invalid');
    const chavesComErro = resultados.filter(r => !['valid', 'invalid'].includes(r.resultado.status));
    
    console.log(`✅ Chaves válidas: ${chavesValidas.length}`);
    chavesValidas.forEach(chave => {
        console.log(`   - ${chave.nome}: $${chave.resultado.balance || 0}`);
    });
    
    console.log(`❌ Chaves inválidas: ${chavesInvalidas.length}`);
    chavesInvalidas.forEach(chave => {
        console.log(`   - ${chave.nome}: ${chave.resultado.error}`);
    });
    
    console.log(`⚠️ Chaves com erro: ${chavesComErro.length}`);
    chavesComErro.forEach(chave => {
        console.log(`   - ${chave.nome}: ${chave.resultado.error}`);
    });
    
    if (chavesValidas.length > 0) {
        console.log('\n🎉 ÓTIMA NOTÍCIA! Encontramos chaves válidas!');
        console.log('Agora podemos usar essas chaves para coletar saldos.');
        
        // Mostrar as chaves que funcionam
        console.log('\n🔑 CHAVES FUNCIONAIS PARA USAR:');
        chavesValidas.forEach((chave, index) => {
            console.log(`${index + 1}. ${chave.nome}:`);
            console.log(`   API Key: ${chave.apiKey}`);
            console.log(`   Saldo: $${chave.resultado.balance || 0}`);
        });
        
    } else {
        console.log('\n😞 Infelizmente, nenhuma chave está funcionando.');
        console.log('Todas retornaram erros de autenticação.');
    }
    
    return chavesValidas;
}

// Executar o teste
testAllKeys().then(chavesValidas => {
    if (chavesValidas.length > 0) {
        console.log('\n🎯 PRÓXIMO PASSO:');
        console.log('Use as chaves válidas encontradas para atualizar o sistema de coleta!');
    }
});
