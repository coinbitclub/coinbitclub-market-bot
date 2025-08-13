/**
 * 🧪 TESTE RÁPIDO DAS APIS REAIS
 * 
 * Valida todas as APIs do .env antes de iniciar o sistema
 */

require('dotenv').config();
const axios = require('axios');

class TestadorAPIs {
    constructor() {
        console.log('🧪 TESTADOR DE APIS REAIS - PRODUÇÃO\n');
    }

    async testarCoinStatsFearGreed() {
        console.log('1️⃣ Testando CoinStats Fear & Greed...');
        
        try {
            const url = process.env.FEAR_GREED_URL || 'https://openapiv1.coinstats.app/insights/fear-and-greed';
            const headers = {
                'X-API-KEY': process.env.COINSTATS_API_KEY,
                'Accept': 'application/json'
            };

            console.log(`   🔗 URL: ${url}`);
            console.log(`   🔑 API Key: ${process.env.COINSTATS_API_KEY ? '[CONFIGURADA]' : '[FALTANDO]'}`);

            const response = await axios.get(url, { headers, timeout: 10000 });
            
            if (response.data && response.data.value !== undefined) {
                console.log(`   ✅ SUCESSO! Fear & Greed: ${response.data.value} (${response.data.classification || 'N/A'})`);
                return true;
            } else {
                console.log('   ❌ Estrutura de dados inválida:', response.data);
                return false;
            }
            
        } catch (error) {
            console.log(`   ❌ FALHA: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Status: ${error.response.status}`);
                console.log(`   📝 Dados: ${JSON.stringify(error.response.data)}`);
            }
            return false;
        }
    }

    async testarBinancePublic() {
        console.log('\n2️⃣ Testando Binance API Pública...');
        
        try {
            const url = 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT';
            console.log(`   🔗 URL: ${url}`);

            const response = await axios.get(url, { timeout: 10000 });
            
            if (response.data && response.data.lastPrice) {
                const price = parseFloat(response.data.lastPrice);
                const change = parseFloat(response.data.priceChangePercent);
                console.log(`   ✅ SUCESSO! BTC: $${price.toLocaleString()} (${change}%)`);
                return true;
            } else {
                console.log('   ❌ Estrutura de dados inválida:', response.data);
                return false;
            }
            
        } catch (error) {
            console.log(`   ❌ FALHA: ${error.message}`);
            return false;
        }
    }

    async testarOpenAI() {
        console.log('\n3️⃣ Testando OpenAI API...');
        
        try {
            const url = 'https://api.openai.com/v1/models';
            const headers = {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            };

            console.log(`   🔗 URL: ${url}`);
            console.log(`   🔑 API Key: ${process.env.OPENAI_API_KEY ? '[CONFIGURADA]' : '[FALTANDO]'}`);

            const response = await axios.get(url, { headers, timeout: 10000 });
            
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                const gpt4Models = response.data.data.filter(model => model.id.includes('gpt-4'));
                console.log(`   ✅ SUCESSO! Modelos GPT-4 disponíveis: ${gpt4Models.length}`);
                return true;
            } else {
                console.log('   ❌ Estrutura de dados inválida');
                return false;
            }
            
        } catch (error) {
            console.log(`   ❌ FALHA: ${error.message}`);
            if (error.response?.status === 401) {
                console.log('   🔑 ERRO: API Key inválida ou expirada');
            }
            return false;
        }
    }

    async testarBancoDados() {
        console.log('\n4️⃣ Testando PostgreSQL...');
        
        try {
            const { createRobustPool, testConnection } = require('./fixed-database-config');
            
            console.log(`   🔗 URL: ${process.env.DATABASE_URL ? '[CONFIGURADA]' : '[FALTANDO]'}`);
            
            const pool = createRobustPool();
            const conectado = await testConnection(pool);
            
            if (conectado) {
                console.log('   ✅ SUCESSO! PostgreSQL conectado');
                await pool.end();
                return true;
            } else {
                console.log('   ❌ FALHA na conexão');
                return false;
            }
            
        } catch (error) {
            console.log(`   ❌ FALHA: ${error.message}`);
            return false;
        }
    }

    async executarTestes() {
        console.log('🔍 VALIDANDO TODAS AS APIS DE PRODUÇÃO...\n');
        
        const resultados = {
            coinstats: await this.testarCoinStatsFearGreed(),
            binance: await this.testarBinancePublic(),
            openai: await this.testarOpenAI(),
            database: await this.testarBancoDados()
        };

        console.log('\n📊 RESUMO DOS TESTES:');
        console.log('========================');
        
        Object.entries(resultados).forEach(([api, sucesso]) => {
            const status = sucesso ? '✅' : '❌';
            const nome = api.toUpperCase();
            console.log(`${status} ${nome}: ${sucesso ? 'OK' : 'FALHA'}`);
        });

        const sucessos = Object.values(resultados).filter(r => r).length;
        const total = Object.keys(resultados).length;
        
        console.log('========================');
        console.log(`📈 Taxa de sucesso: ${sucessos}/${total} (${Math.round(sucessos/total*100)}%)`);

        if (sucessos === total) {
            console.log('🎉 TODOS OS TESTES PASSARAM!');
            console.log('✅ Sistema pronto para produção');
            return true;
        } else {
            console.log('⚠️ ALGUNS TESTES FALHARAM');
            console.log('❌ Verifique configurações antes de continuar');
            
            // Mostrar soluções específicas
            if (!resultados.coinstats) {
                console.log('\n🔧 COINSTATS: Verificar COINSTATS_API_KEY no .env');
            }
            if (!resultados.openai) {
                console.log('🔧 OPENAI: Verificar OPENAI_API_KEY no .env (opcional)');
            }
            if (!resultados.database) {
                console.log('🔧 DATABASE: Verificar DATABASE_URL no .env');
            }
            
            return false;
        }
    }
}

// Execução automática
if (require.main === module) {
    const testador = new TestadorAPIs();
    
    testador.executarTestes().then(sucesso => {
        if (sucesso) {
            console.log('\n🚀 Pronto para iniciar o sistema!');
            console.log('   Execute: node launcher-integrado.js');
        } else {
            console.log('\n❌ Corrija os problemas antes de continuar');
        }
        process.exit(sucesso ? 0 : 1);
    }).catch(error => {
        console.error('\n💥 Erro nos testes:', error.message);
        process.exit(1);
    });
}

module.exports = TestadorAPIs;
