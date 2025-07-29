/**
 * 🧪 TESTE SIMPLES DE ROTAS
 * Verificação básica das rotas
 */

const axios = require('axios');

async function testarRotas() {
    const baseUrl = 'http://localhost:3000';

    console.log('🧪 TESTE SIMPLES DE ROTAS');
    console.log('========================');

    try {
        // Testar health check
        console.log('\n1. Testando Health Check...');
        const health = await axios.get(`${baseUrl}/health`);
        console.log(`✅ Health: ${health.status} - ${health.data.status}`);

        // Testar API health
        console.log('\n2. Testando API Health...');
        const apiHealth = await axios.get(`${baseUrl}/api/health`);
        console.log(`✅ API Health: ${apiHealth.status} - ${apiHealth.data.status}`);

        // Listar todas as rotas disponíveis
        console.log('\n3. Rotas disponíveis:');
        console.log('GET /health - Health check');
        console.log('GET /api/health - API health');
        
        // Testar rotas específicas uma por vez
        const rotasParaTestar = [
            '/api/gestores/chaves/parametrizacoes/padrao',
            '/api/gestores/usuarios/configuracoes',
            '/api/gestores/afiliados/configuracoes',
            '/api/gestores/afiliados/tipos'
        ];

        console.log('\n4. Testando rotas dos gestores...');
        for (const rota of rotasParaTestar) {
            try {
                const response = await axios.get(`${baseUrl}${rota}`);
                console.log(`✅ ${rota}: ${response.status}`);
            } catch (error) {
                console.log(`❌ ${rota}: ${error.response?.status || 'ERRO'} - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Executar teste após delay
setTimeout(testarRotas, 1000);
