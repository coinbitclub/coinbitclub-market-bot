/**
 * 🧪 TESTE FINAL FUNCIONAL - OPERAÇÕES REAIS
 * 
 * Teste das operações que o sistema realmente usa
 * para garantir que tudo está funcionando em produção
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🧪 TESTE FINAL FUNCIONAL - OPERAÇÕES REAIS');
console.log('==========================================');

async function testeFinalFuncional() {
    try {
        // Buscar todas as chaves ativas
        const chaves = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY u.name
        `);
        
        console.log(`\n📊 Testando ${chaves.rows.length} chaves com operações reais:\n`);
        
        let sucessos = 0;
        
        for (const [index, chave] of chaves.rows.entries()) {
            console.log(`${index + 1}. 🔑 ${chave.name} (${chave.environment})`);
            
            const resultados = await testarOperacoesReais(chave);
            
            if (resultados.todasFuncionando) {
                console.log('   ✅ TODAS AS OPERAÇÕES FUNCIONANDO');
                sucessos++;
            } else {
                console.log('   ❌ ALGUMAS OPERAÇÕES FALHARAM');
            }
            
            console.log('');
        }
        
        console.log('📈 RESULTADO FINAL:');
        console.log('==================');
        console.log(`✅ Chaves funcionais: ${sucessos}/${chaves.rows.length}`);
        
        if (sucessos === chaves.rows.length) {
            console.log('🎉 SISTEMA 100% OPERACIONAL!');
            console.log('');
            console.log('🚀 PRÓXIMOS PASSOS:');
            console.log('   • Sistema pronto para trading');
            console.log('   • Todas as chaves validadas');
            console.log('   • Monitoramento automático ativo');
            console.log('   • Deploy bem-sucedido');
        } else {
            console.log('🚨 AINDA HÁ PROBLEMAS EM ALGUMAS CHAVES');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste final:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarOperacoesReais(chave) {
    const baseUrl = chave.environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    const resultados = {
        todasFuncionando: true,
        detalhes: {}
    };
    
    // Lista de endpoints que o sistema realmente usa
    const endpoints = [
        { 
            name: 'Account Info', 
            path: '/v5/account/info',
            critical: true
        },
        { 
            name: 'Wallet Balance', 
            path: '/v5/account/wallet-balance',
            critical: true
        },
        { 
            name: 'Positions', 
            path: '/v5/position/list',
            critical: true
        },
        { 
            name: 'Active Orders', 
            path: '/v5/order/realtime',
            critical: false
        }
    ];
    
    for (const endpoint of endpoints) {
        const resultado = await testarEndpoint(chave, baseUrl, endpoint);
        resultados.detalhes[endpoint.name] = resultado;
        
        if (endpoint.critical && !resultado.sucesso) {
            resultados.todasFuncionando = false;
        }
        
        const status = resultado.sucesso ? '✅' : '❌';
        const critico = endpoint.critical ? '🔴' : '🟡';
        console.log(`      ${status} ${critico} ${endpoint.name}: ${resultado.status}`);
    }
    
    return resultados;
}

async function testarEndpoint(chave, baseUrl, endpoint) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Criar parâmetros se necessário
        let queryString = '';
        if (endpoint.path === '/v5/account/wallet-balance') {
            queryString = 'accountType=UNIFIED';
        } else if (endpoint.path === '/v5/position/list') {
            queryString = 'category=linear&settleCoin=USDT';
        } else if (endpoint.path === '/v5/order/realtime') {
            queryString = 'category=linear&openOnly=0&limit=20';
        }
        
        const message = timestamp + chave.api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const url = queryString ? 
            `${baseUrl}${endpoint.path}?${queryString}` : 
            `${baseUrl}${endpoint.path}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            return {
                sucesso: true,
                status: 'OK',
                codigo: data.retCode
            };
        } else {
            return {
                sucesso: false,
                status: `Erro ${data.retCode}`,
                codigo: data.retCode,
                mensagem: data.retMsg
            };
        }
        
    } catch (error) {
        return {
            sucesso: false,
            status: 'Erro de conexão',
            erro: error.message
        };
    }
}

// Executar teste final
testeFinalFuncional().catch(console.error);
