/**
 * 🔍 TESTE DETALHADO - VERIFICAR SE IP É REALMENTE NECESSÁRIO
 * 
 * Vamos testar diferentes cenários para confirmar se o problema
 * é realmente de IP ou se há outras soluções
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 TESTE DETALHADO - VERIFICAR NECESSIDADE DE IP');
console.log('===============================================');

async function testarNecessidadeIP() {
    try {
        // 1. Verificar IP atual do servidor
        console.log('\n🌐 1. VERIFICAÇÃO DE IP DO SERVIDOR:');
        const ipAtual = await verificarIPAtual();
        
        // 2. Buscar chaves do banco
        console.log('\n📊 2. BUSCANDO CHAVES PARA TESTE:');
        const chaves = await pool.query(`
            SELECT 
                u.name,
                uak.api_key,
                uak.secret_key,
                uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY uak.environment
        `);
        
        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave encontrada para testar');
            return;
        }
        
        console.log(`📋 ${chaves.rows.length} chave(s) encontrada(s) para teste:`);
        chaves.rows.forEach((chave, index) => {
            console.log(`   ${index + 1}. ${chave.name} (${chave.environment})`);
        });
        
        // 3. Testar diferentes endpoints para cada chave
        console.log('\n🧪 3. TESTANDO DIFERENTES ENDPOINTS:');
        console.log('===================================');
        
        for (const chave of chaves.rows) {
            console.log(`\n👤 TESTANDO: ${chave.name} (${chave.environment})`);
            console.log('─'.repeat(50));
            
            await testarEndpointsVariados(chave.api_key, chave.secret_key, chave.environment);
        }
        
        // 4. Testar sem autenticação (endpoints públicos)
        console.log('\n🌍 4. TESTANDO ENDPOINTS PÚBLICOS (SEM AUTENTICAÇÃO):');
        console.log('====================================================');
        
        await testarEndpointsPublicos();
        
        // 5. Análise de configurações da Bybit
        console.log('\n⚙️ 5. ANÁLISE DE CONFIGURAÇÕES BYBIT:');
        console.log('====================================');
        
        await analisarConfiguracoesBybit();
        
        // 6. Conclusões e recomendações
        console.log('\n📋 6. CONCLUSÕES:');
        console.log('=================');
        
        console.log('🔍 ANÁLISE REALIZADA:');
        console.log('   • Testamos endpoints públicos e privados');
        console.log('   • Verificamos diferentes tipos de autenticação');
        console.log('   • Analisamos configurações da Bybit');
        console.log('   • Comparamos testnet vs mainnet');
        
        console.log('\n💡 ALTERNATIVAS AO IP FIXO:');
        console.log('===========================');
        
        console.log('1. 🔓 REMOVER RESTRIÇÃO DE IP:');
        console.log('   • Acessar Bybit → API Management');
        console.log('   • Editar cada API Key');
        console.log('   • IP Access: "Unrestricted" ou "No IP restriction"');
        console.log('   • Vantagem: Funciona de qualquer IP');
        console.log('   • Desvantagem: Menos seguro');
        
        console.log('\n2. 🔄 RENOVAR API KEYS:');
        console.log('   • Excluir chaves atuais');
        console.log('   • Criar novas sem restrição de IP');
        console.log('   • Atualizar no sistema');
        
        console.log('\n3. 🧪 USAR APENAS TESTNET:');
        console.log('   • Testnet geralmente tem menos restrições');
        console.log('   • Adequado para desenvolvimento e testes');
        console.log('   • Sem riscos financeiros reais');
        
        console.log('\n4. 🌐 CONFIGURAR IP (MAIS SEGURO):');
        console.log('   • Adicionar IP atual: ' + ipAtual);
        console.log('   • Máxima segurança');
        console.log('   • Recomendado para produção');
        
        console.log('\n🎯 RECOMENDAÇÃO FINAL:');
        console.log('======================');
        
        console.log('Para DESENVOLVIMENTO/TESTE:');
        console.log('   ✅ Remover restrição de IP (mais rápido)');
        console.log('   ✅ Usar testnet quando possível');
        
        console.log('\nPara PRODUÇÃO:');
        console.log('   ✅ Configurar IP fixo (mais seguro)');
        console.log('   ✅ Monitorar mudanças de IP');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarEndpointsVariados(apiKey, secretKey, environment) {
    const baseUrl = environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    const endpoints = [
        {
            nome: 'Server Time (Público)',
            url: '/v5/market/time',
            needsAuth: false
        },
        {
            nome: 'Market Info (Público)', 
            url: '/v5/market/instruments-info?category=spot&symbol=BTCUSDT',
            needsAuth: false
        },
        {
            nome: 'Account Info (Privado)',
            url: '/v5/account/info',
            needsAuth: true
        },
        {
            nome: 'Wallet Balance (Privado)',
            url: '/v5/account/wallet-balance?accountType=UNIFIED',
            needsAuth: true
        }
    ];
    
    for (const endpoint of endpoints) {
        try {
            let headers = {
                'Content-Type': 'application/json'
            };
            
            if (endpoint.needsAuth) {
                const timestamp = Date.now().toString();
                const recvWindow = '5000';
                const message = timestamp + apiKey + recvWindow;
                const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
                
                headers = {
                    ...headers,
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-SIGN-TYPE': '2',
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow
                };
            }
            
            const response = await fetch(`${baseUrl}${endpoint.url}`, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            if (data.retCode === 0) {
                console.log(`   ✅ ${endpoint.nome}: OK`);
            } else {
                console.log(`   ❌ ${endpoint.nome}: ${data.retCode} - ${data.retMsg}`);
                
                // Analisar códigos de erro específicos
                if (data.retCode === 10006) {
                    console.log('      🚨 CONFIRMADO: Problema de IP!');
                } else if (data.retCode === 10003) {
                    console.log('      🔑 Problema: API Key inválida ou expirada');
                } else if (data.retCode === 10004) {
                    console.log('      🔐 Problema: Assinatura inválida');
                }
            }
            
        } catch (error) {
            console.log(`   ❌ ${endpoint.nome}: Erro de conexão - ${error.message}`);
        }
    }
}

async function testarEndpointsPublicos() {
    const endpoints = [
        'https://api.bybit.com/v5/market/time',
        'https://api-testnet.bybit.com/v5/market/time',
        'https://api.bybit.com/v5/market/instruments-info?category=spot&symbol=BTCUSDT'
    ];
    
    for (const url of endpoints) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.retCode === 0) {
                console.log(`   ✅ ${url}: OK (Sem restrição de IP)`);
            } else {
                console.log(`   ❌ ${url}: ${data.retMsg}`);
            }
        } catch (error) {
            console.log(`   ❌ ${url}: ${error.message}`);
        }
    }
}

async function analisarConfiguracoesBybit() {
    console.log('📚 CONFIGURAÇÕES TÍPICAS DA BYBIT:');
    console.log('');
    console.log('🔒 RESTRIÇÕES DE IP:');
    console.log('   • Padrão: SEM restrição (qualquer IP)');
    console.log('   • Opcional: Restringir a IPs específicos');
    console.log('   • Configuração: API Management → Edit → IP Access');
    console.log('');
    console.log('🔑 PERMISSÕES DE API:');
    console.log('   • Read Only: Consultas de dados');
    console.log('   • Spot Trading: Negociação spot');
    console.log('   • Derivatives: Futuros e opções');
    console.log('   • Wallet: Transferências (não recomendado)');
    console.log('');
    console.log('⚠️ POSSÍVEIS CAUSAS DO ERRO 401:');
    console.log('   1. API Key desativada ou expirada');
    console.log('   2. Secret Key incorreta');
    console.log('   3. IP bloqueado (se configurado)');
    console.log('   4. Permissões insuficientes');
    console.log('   5. Formato de assinatura incorreto');
}

async function verificarIPAtual() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`   🌐 IP atual do servidor: ${data.ip}`);
        return data.ip;
    } catch (error) {
        console.log('   ❌ Não foi possível verificar IP');
        return 'Desconhecido';
    }
}

// Executar teste
testarNecessidadeIP().catch(console.error);
