/**
 * 🔍 DIAGNÓSTICO COINSTATS API
 * 
 * Teste detalhado para identificar problema de conexão
 */

require('dotenv').config();
const axios = require('axios');

class DiagnosticoCoinStats {
    constructor() {
        console.log('🔍 DIAGNÓSTICO DETALHADO - COINSTATS API\n');
        
        this.apiKey = process.env.COINSTATS_API_KEY;
        this.fearGreedUrl = process.env.FEAR_GREED_URL;
        
        console.log('📋 CONFIGURAÇÕES DETECTADAS:');
        console.log(`   🔑 API Key: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : '[FALTANDO]'}`);
        console.log(`   🔗 URL: ${this.fearGreedUrl}`);
        console.log('');
    }

    async testarURLDireta() {
        console.log('1️⃣ TESTE: URL direta sem autenticação...');
        
        try {
            const response = await axios.get(this.fearGreedUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Dados: ${JSON.stringify(response.data, null, 2)}`);
            return true;
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Status: ${error.response.status}`);
                console.log(`   📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            return false;
        }
    }

    async testarComAPIKey() {
        console.log('\n2️⃣ TESTE: URL com API Key...');
        
        try {
            const response = await axios.get(this.fearGreedUrl, {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'CoinBitClub-Enterprise/2.0'
                },
                timeout: 15000
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Dados: ${JSON.stringify(response.data, null, 2)}`);
            return true;
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Status: ${error.response.status}`);
                console.log(`   📝 Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
                console.log(`   📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            return false;
        }
    }

    async testarURLsAlternativas() {
        console.log('\n3️⃣ TESTE: URLs alternativas da CoinStats...');
        
        const urlsAlternativas = [
            'https://api.coinstats.app/public/v1/fear-greed',
            'https://openapiv1.coinstats.app/fear-greed',
            'https://api.coinstats.app/public/v1/coins/bitcoin?currency=USD',
            'https://openapiv1.coinstats.app/coins/bitcoin'
        ];

        for (const url of urlsAlternativas) {
            console.log(`\n   🔗 Testando: ${url}`);
            
            try {
                const response = await axios.get(url, {
                    headers: {
                        'X-API-KEY': this.apiKey,
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log(`   ✅ Status: ${response.status}`);
                console.log(`   📊 Estrutura: ${Object.keys(response.data).join(', ')}`);
                
                if (response.data.value !== undefined) {
                    console.log(`   🎯 Fear & Greed encontrado: ${response.data.value}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Falha: ${error.response?.status || error.message}`);
            }
        }
    }

    async testarAPIPublicaCoinStats() {
        console.log('\n4️⃣ TESTE: API pública CoinStats (Bitcoin)...');
        
        try {
            const response = await axios.get('https://api.coinstats.app/public/v1/coins/bitcoin', {
                timeout: 10000
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Bitcoin Price: $${response.data.coin?.price}`);
            console.log(`   📈 24h Change: ${response.data.coin?.priceChange1d}%`);
            
            return true;
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return false;
        }
    }

    async testarFearGreedAlternativo() {
        console.log('\n5️⃣ TESTE: Alternative.me (backup)...');
        
        try {
            const response = await axios.get('https://api.alternative.me/fng/', {
                timeout: 10000
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Fear & Greed: ${response.data.data[0]?.value} (${response.data.data[0]?.value_classification})`);
            
            return true;
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return false;
        }
    }

    async analisarAPIKey() {
        console.log('\n6️⃣ ANÁLISE: API Key CoinStats...');
        
        // Verificar formato da API Key
        console.log(`   📏 Tamanho: ${this.apiKey?.length || 0} caracteres`);
        console.log(`   🔤 Formato: ${this.apiKey ? 'Base64-like' : 'FALTANDO'}`);
        
        // Testar endpoint de validação
        try {
            const response = await axios.get('https://openapiv1.coinstats.app/coins', {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Accept': 'application/json'
                },
                params: { limit: 1 },
                timeout: 10000
            });
            
            console.log(`   ✅ API Key VÁLIDA (Status: ${response.status})`);
            return true;
            
        } catch (error) {
            console.log(`   ❌ API Key pode estar INVÁLIDA ou EXPIRADA`);
            console.log(`   📄 Status: ${error.response?.status}`);
            console.log(`   📝 Erro: ${error.response?.data?.message || error.message}`);
            return false;
        }
    }

    async executarDiagnostico() {
        console.log('🔍 EXECUTANDO DIAGNÓSTICO COMPLETO...\n');
        
        const resultados = {
            urlDireta: await this.testarURLDireta(),
            comAPIKey: await this.testarComAPIKey(),
            apiKeyValida: await this.analisarAPIKey(),
            apiPublica: await this.testarAPIPublicaCoinStats(),
            alternativo: await this.testarFearGreedAlternativo()
        };

        await this.testarURLsAlternativas();

        console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
        console.log('==========================');
        Object.entries(resultados).forEach(([teste, sucesso]) => {
            const status = sucesso ? '✅' : '❌';
            console.log(`${status} ${teste.toUpperCase()}: ${sucesso ? 'OK' : 'FALHA'}`);
        });

        console.log('\n🔧 RECOMENDAÇÕES:');
        
        if (!resultados.apiKeyValida) {
            console.log('❌ PROBLEMA PRINCIPAL: API Key inválida ou expirada');
            console.log('   🔧 SOLUÇÃO: Renovar API Key na CoinStats');
            console.log('   📧 CONTATO: https://coinstats.app/api');
        }
        
        if (!resultados.comAPIKey && resultados.urlDireta) {
            console.log('⚠️ URL funciona sem API Key - pode usar endpoint público');
        }
        
        if (resultados.alternativo) {
            console.log('✅ Alternative.me funciona - pode ser usado como backup');
        }
        
        if (resultados.apiPublica) {
            console.log('✅ API pública CoinStats funciona - pode obter preços Bitcoin');
        }

        return resultados;
    }
}

// Execução automática
if (require.main === module) {
    const diagnostico = new DiagnosticoCoinStats();
    
    diagnostico.executarDiagnostico().then(resultados => {
        const sucessos = Object.values(resultados).filter(r => r).length;
        const total = Object.keys(resultados).length;
        
        console.log(`\n📈 Taxa de sucesso: ${sucessos}/${total} (${Math.round(sucessos/total*100)}%)`);
        
        if (sucessos === 0) {
            console.log('\n🚨 CRÍTICO: Nenhuma API funcionando');
            process.exit(1);
        } else if (sucessos < total) {
            console.log('\n⚠️ PARCIAL: Algumas APIs com problemas');
            process.exit(0);
        } else {
            console.log('\n🎉 PERFEITO: Todas as APIs funcionando');
            process.exit(0);
        }
    }).catch(error => {
        console.error('\n💥 Erro no diagnóstico:', error.message);
        process.exit(1);
    });
}

module.exports = DiagnosticoCoinStats;
