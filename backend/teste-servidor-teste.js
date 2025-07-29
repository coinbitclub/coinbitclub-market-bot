/**
 * 🧪 TESTE DO SERVIDOR DE TESTE
 */

const axios = require('axios');

async function testar() {
    const baseUrl = 'http://localhost:3001';

    console.log('🧪 TESTANDO SERVIDOR DE TESTE');
    console.log('============================');

    try {
        // 1. Health check
        const health = await axios.get(`${baseUrl}/health`);
        console.log(`✅ Health: ${health.status}`);

        // 2. Debug routes
        const debug = await axios.get(`${baseUrl}/debug/routes`);
        console.log(`✅ Debug routes: ${debug.data.routes.length} rotas encontradas`);

        // 3. Testar rotas dos gestores
        const rotasGestores = [
            '/api/gestores/chaves/parametrizacoes/padrao',
            '/api/gestores/usuarios/configuracoes',
            '/api/gestores/afiliados/configuracoes'
        ];

        console.log('\n📋 TESTANDO ROTAS DOS GESTORES:');
        for (const rota of rotasGestores) {
            try {
                const response = await axios.get(`${baseUrl}${rota}`);
                console.log(`✅ ${rota}: ${response.status} - ${response.data.sucesso ? 'SUCESSO' : 'FALHA'}`);
                
                if (rota.includes('parametrizacoes/padrao')) {
                    const trading = response.data.parametrizacoes?.trading;
                    if (trading) {
                        console.log(`   📊 Max operações: ${trading.max_open_positions}`);
                        console.log(`   📊 Balance: ${trading.balance_percentage}%`);
                        console.log(`   📊 Leverage: ${trading.leverage_default}x`);
                    }
                }
                
            } catch (error) {
                console.log(`❌ ${rota}: ${error.response?.status || 'ERRO'} - ${error.message}`);
            }
        }

        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Aguardar servidor iniciar
setTimeout(testar, 1000);
