#!/usr/bin/env node

/**
 * 🔥 TESTADOR DE APIS COM VARIÁVEIS DO RAILWAY
 * 
 * Testa diretamente as APIs usando as variáveis do Railway
 */

console.log('🔥 TESTADOR DE APIS - RAILWAY DIRETO');
console.log('===================================');
console.log('');

async function testarOpenAI() {
    console.log('🤖 TESTANDO OPENAI...');
    console.log('---------------------');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ OPENAI_API_KEY não encontrada nas variáveis de ambiente');
        console.log('💡 Execute: railway variables --set "OPENAI_API_KEY=sua_chave"');
        return false;
    }
    
    console.log(`✅ OPENAI_API_KEY encontrada: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`🎉 OpenAI FUNCIONANDO! (${data.data?.length || 0} modelos disponíveis)`);
            console.log('📋 Modelos principais encontrados:');
            
            const modelosImportantes = ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'];
            modelosImportantes.forEach(modelo => {
                const encontrado = data.data?.find(m => m.id.includes(modelo));
                if (encontrado) {
                    console.log(`   ✅ ${encontrado.id}`);
                }
            });
            
            return true;
        } else {
            console.log(`❌ OpenAI erro: ${response.status} - ${response.statusText}`);
            if (response.status === 401) {
                console.log('🔑 Chave API inválida ou expirada');
            }
            return false;
        }
    } catch (error) {
        console.log(`❌ Erro de conexão: ${error.message}`);
        return false;
    }
}

async function testarBybit() {
    console.log('\n🔹 TESTANDO BYBIT...');
    console.log('--------------------');
    
    const apiKey = process.env.BYBIT_API_KEY;
    const secretKey = process.env.BYBIT_SECRET_KEY;
    
    if (!apiKey) {
        console.log('❌ BYBIT_API_KEY não encontrada');
        console.log('💡 Configure: railway variables --set "BYBIT_API_KEY=sua_chave"');
        return false;
    }
    
    if (!secretKey) {
        console.log('❌ BYBIT_SECRET_KEY não encontrada');
        console.log('💡 Configure: railway variables --set "BYBIT_SECRET_KEY=sua_chave"');
        return false;
    }
    
    console.log(`✅ BYBIT_API_KEY encontrada: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`✅ BYBIT_SECRET_KEY encontrada: ${secretKey.substring(0, 6)}...${secretKey.substring(secretKey.length - 4)}`);
    
    try {
        // Teste do endpoint público do Bybit
        const response = await fetch('https://api.bybit.com/v5/market/time');
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎉 Bybit endpoint público FUNCIONANDO!');
            console.log(`📅 Server time: ${new Date(parseInt(data.result.timeNano) / 1000000)}`);
            return true;
        } else {
            console.log(`❌ Bybit erro: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Erro de conexão: ${error.message}`);
        return false;
    }
}

async function testarStripe() {
    console.log('\n💳 TESTANDO STRIPE...');
    console.log('---------------------');
    
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
        console.log('❌ STRIPE_SECRET_KEY não encontrada');
        console.log('💡 Configure: railway variables --set "STRIPE_SECRET_KEY=sua_chave"');
        return false;
    }
    
    console.log(`✅ STRIPE_SECRET_KEY encontrada: ${secretKey.substring(0, 8)}...${secretKey.substring(secretKey.length - 4)}`);
    
    // Verificar formato da chave
    if (secretKey.startsWith('sk_live_')) {
        console.log('🎉 Chave LIVE detectada - PRODUÇÃO!');
        return true;
    } else if (secretKey.startsWith('sk_test_')) {
        console.log('⚠️ Chave TEST detectada - Ambiente de testes');
        return true;
    } else {
        console.log('❌ Formato de chave inválido');
        return false;
    }
}

async function executarTestes() {
    console.log('🚀 INICIANDO TESTES DAS APIS...\n');
    
    const resultados = {
        openai: await testarOpenAI(),
        bybit: await testarBybit(),
        stripe: await testarStripe()
    };
    
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    
    const total = Object.keys(resultados).length;
    const funcionando = Object.values(resultados).filter(Boolean).length;
    const porcentagem = Math.round((funcionando / total) * 100);
    
    console.log(`✅ APIs funcionando: ${funcionando}/${total} (${porcentagem}%)`);
    console.log(`🤖 OpenAI: ${resultados.openai ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`🔹 Bybit: ${resultados.bybit ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`💳 Stripe: ${resultados.stripe ? '✅ OK' : '❌ FALHOU'}`);
    
    if (funcionando === total) {
        console.log('\n🎉 TODAS AS APIS ESTÃO FUNCIONANDO!');
        console.log('🚀 SISTEMA PRONTO PARA OPERAÇÃO REAL!');
    } else if (funcionando >= 1) {
        console.log('\n🟡 ALGUMAS APIS FUNCIONANDO - Configure as faltantes');
    } else {
        console.log('\n🔴 NENHUMA API FUNCIONANDO - Configure as chaves');
    }
    
    console.log('\n💡 PRÓXIMO PASSO: railway up (para fazer deploy)');
}

if (require.main === module) {
    executarTestes().catch(console.error);
}

module.exports = { testarOpenAI, testarBybit, testarStripe };
