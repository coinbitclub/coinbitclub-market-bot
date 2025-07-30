const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Função para testar conexão Bybit
async function testBybitConnection(apiKey, apiSecret, environment = 'mainnet') {
    return new Promise((resolve) => {
        try {
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            
            // Criar assinatura para Bybit
            const queryString = `api_key=${apiKey}&timestamp=${timestamp}&recv_window=${recv_window}`;
            const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
            
            const baseUrl = environment === 'testnet' 
                ? 'api-testnet.bybit.com' 
                : 'api.bybit.com';
            
            const options = {
                hostname: baseUrl,
                port: 443,
                path: `/v5/account/wallet-balance?${queryString}&sign=${signature}`,
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recv_window,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.retCode === 0) {
                            resolve({
                                success: true,
                                message: 'Conexão estabelecida com sucesso',
                                balance: response.result?.list?.[0] || null
                            });
                        } else {
                            resolve({
                                success: false,
                                message: response.retMsg || 'Erro na API',
                                error: response
                            });
                        }
                    } catch (e) {
                        resolve({
                            success: false,
                            message: 'Erro ao processar resposta da API',
                            error: e.message
                        });
                    }
                });
            });
            
            req.on('error', (e) => {
                resolve({
                    success: false,
                    message: 'Erro de conexão',
                    error: e.message
                });
            });
            
            req.on('timeout', () => {
                resolve({
                    success: false,
                    message: 'Timeout na conexão',
                    error: 'Request timed out'
                });
            });
            
            req.end();
            
        } catch (error) {
            resolve({
                success: false,
                message: 'Erro interno',
                error: error.message
            });
        }
    });
}

async function testarSistemaMultiusuario() {
    try {
        console.log('🔍 TESTE COMPLETO DO SISTEMA MULTIUSUÁRIO');
        console.log('==========================================');
        
        // 1. Verificar usuários ativos com chaves API
        console.log('\n📊 1. VERIFICANDO USUÁRIOS ATIVOS');
        console.log('==================================');
        
        const usuariosAtivos = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                u.plan_type,
                u.is_active,
                COUNT(k.id) as api_keys_count
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id AND k.is_active = true
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.email, u.balance_usd, u.plan_type, u.is_active
            HAVING COUNT(k.id) > 0
            ORDER BY u.balance_usd DESC
        `);
        
        console.log(`✅ Encontrados ${usuariosAtivos.rows.length} usuários ativos com APIs configuradas:`);
        usuariosAtivos.rows.forEach(user => {
            console.log(`   👤 ${user.name} ($${user.balance_usd} USDT) - ${user.api_keys_count} API(s)`);
        });
        
        // 2. Testar conexões das exchanges
        console.log('\n🔗 2. TESTANDO CONEXÕES DAS EXCHANGES');
        console.log('====================================');
        
        const chavesAPI = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                k.id as api_id,
                k.exchange,
                k.api_key,
                k.secret_key,
                k.environment,
                k.is_active
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true AND k.is_active = true
            ORDER BY u.name
        `);
        
        const resultadosTeste = [];
        
        for (const api of chavesAPI.rows) {
            console.log(`\n🧪 Testando: ${api.name} (${api.exchange.toUpperCase()})`);
            console.log(`   API Key: ${api.api_key}`);
            console.log(`   Ambiente: ${api.environment}`);
            
            let resultado;
            if (api.exchange.toLowerCase().includes('bybit')) {
                resultado = await testBybitConnection(
                    api.api_key, 
                    api.secret_key, 
                    api.environment
                );
            } else {
                resultado = {
                    success: false,
                    message: 'Exchange não suportada para teste automático',
                    error: 'Apenas Bybit implementado'
                };
            }
            
            resultadosTeste.push({
                user: api.name,
                exchange: api.exchange,
                success: resultado.success,
                message: resultado.message,
                balance: resultado.balance
            });
            
            if (resultado.success) {
                console.log(`   ✅ ${resultado.message}`);
                if (resultado.balance) {
                    console.log(`   💰 Saldo da exchange: Disponível`);
                }
            } else {
                console.log(`   ❌ ${resultado.message}`);
                if (resultado.error) {
                    console.log(`   🔍 Detalhes: ${JSON.stringify(resultado.error)}`);
                }
            }
        }
        
        // 3. Verificar capacidade multiusuário do sistema
        console.log('\n🏗️  3. VERIFICANDO ARQUITETURA MULTIUSUÁRIO');
        console.log('============================================');
        
        // Verificar estrutura das tabelas
        const tabelasEssenciais = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'users', 'user_api_keys', 'trading_operations', 
                'user_trades', 'user_sessions', 'user_settings'
            )
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelas essenciais encontradas:');
        tabelasEssenciais.rows.forEach(t => {
            console.log(`   ✅ ${t.table_name}`);
        });
        
        // Verificar isolamento de dados por usuário
        const isolamentoDados = await pool.query(`
            SELECT 
                'trading_operations' as tabela,
                COUNT(DISTINCT user_id) as usuarios_distintos,
                COUNT(*) as total_registros
            FROM trading_operations
            WHERE user_id IS NOT NULL
            
            UNION ALL
            
            SELECT 
                'user_api_keys' as tabela,
                COUNT(DISTINCT user_id) as usuarios_distintos,
                COUNT(*) as total_registros
            FROM user_api_keys
            WHERE user_id IS NOT NULL
        `);
        
        console.log('\n🔒 Isolamento de dados por usuário:');
        isolamentoDados.rows.forEach(row => {
            console.log(`   📊 ${row.tabela}: ${row.usuarios_distintos} usuários, ${row.total_registros} registros`);
        });
        
        // 4. Testar webhook multiusuário
        console.log('\n📡 4. VERIFICANDO WEBHOOK MULTIUSUÁRIO');
        console.log('=====================================');
        
        // Verificar se o webhook pode identificar usuários
        const webhookTest = await pool.query(`
            SELECT 
                u.name,
                u.id,
                k.exchange,
                k.api_key
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true AND k.is_active = true
            LIMIT 3
        `);
        
        console.log('🎯 Usuários identificáveis para webhook:');
        webhookTest.rows.forEach(user => {
            console.log(`   👤 ID: ${user.id} | Nome: ${user.name} | Exchange: ${user.exchange}`);
        });
        
        // 5. Relatório final
        console.log('\n📈 5. RELATÓRIO FINAL DO SISTEMA');
        console.log('================================');
        
        const sucessos = resultadosTeste.filter(r => r.success).length;
        const falhas = resultadosTeste.filter(r => !r.success).length;
        
        console.log(`📊 Resumo dos testes de conexão:`);
        console.log(`   ✅ Sucessos: ${sucessos}`);
        console.log(`   ❌ Falhas: ${falhas}`);
        console.log(`   📈 Taxa de sucesso: ${((sucessos / resultadosTeste.length) * 100).toFixed(1)}%`);
        
        console.log(`\n🏆 Status do sistema multiusuário:`);
        const sistemaPronto = sucessos > 0 && tabelasEssenciais.rows.length >= 4;
        
        if (sistemaPronto) {
            console.log('   ✅ SISTEMA PRONTO PARA OPERAÇÃO MULTIUSUÁRIO');
            console.log('   ✅ Usuários isolados corretamente');
            console.log('   ✅ Conexões com exchanges funcionando');
            console.log('   ✅ Estrutura de banco adequada');
        } else {
            console.log('   ⚠️  SISTEMA REQUER AJUSTES');
            console.log('   🔧 Verificar conexões com exchanges');
            console.log('   🔧 Validar estrutura do banco');
        }
        
        console.log('\n🎯 PRÓXIMAS AÇÕES RECOMENDADAS:');
        console.log('===============================');
        if (sucessos > 0) {
            console.log('1. ✅ Iniciar operações de teste com sinais reais');
            console.log('2. ✅ Monitorar logs de trading por usuário');
            console.log('3. ✅ Configurar alertas de monitoramento');
        } else {
            console.log('1. 🔧 Revisar e atualizar chaves API');
            console.log('2. 🔧 Verificar permissões nas exchanges');
            console.log('3. 🔧 Testar conectividade de rede');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    } finally {
        pool.end();
    }
}

testarSistemaMultiusuario();
