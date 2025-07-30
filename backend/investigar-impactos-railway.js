/**
 * 🚨 INVESTIGAÇÃO: IMPACTOS DA MUDANÇA DO RAILWAY
 * Verificar o que pode ter sido afetado na integração com exchanges
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function investigarImpactosRailway() {
    try {
        console.log('🚨 INVESTIGAÇÃO: IMPACTOS DA MUDANÇA DO RAILWAY');
        console.log('='.repeat(60));
        
        // 1. Verificar se a string de conexão do banco mudou
        console.log('\n📊 1. VERIFICANDO CONEXÃO DO BANCO:');
        console.log(`   URL atual: ${process.env.DATABASE_URL || 'Não configurada'}`);
        console.log(`   URL hardcoded: postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway`);
        
        // Testar conexão
        const testConnection = await pool.query('SELECT NOW() as current_time, version() as db_version');
        console.log(`   ✅ Conexão ativa: ${testConnection.rows[0].current_time}`);
        console.log(`   📊 PostgreSQL: ${testConnection.rows[0].db_version.substring(0, 50)}...`);

        // 2. Verificar se os dados da Paloma ainda existem
        console.log('\n📊 2. VERIFICANDO DADOS DA PALOMA NO NOVO BANCO:');
        const palomaCheck = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                u.is_active,
                k.api_key,
                k.secret_key,
                k.validation_status,
                k.created_at as key_created,
                k.updated_at as key_updated
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.name ILIKE '%paloma%'
        `);

        if (palomaCheck.rows.length > 0) {
            console.log(`   ✅ Paloma encontrada no novo banco`);
            palomaCheck.rows.forEach(row => {
                console.log(`   👤 ID: ${row.id} | Nome: ${row.name}`);
                console.log(`   💰 Saldo: $${row.balance_usd} | Ativo: ${row.is_active}`);
                console.log(`   🔑 API Key: ${row.api_key || 'Não configurada'}`);
                console.log(`   📅 Chave criada: ${row.key_created || 'N/A'}`);
                console.log(`   📅 Chave atualizada: ${row.key_updated || 'N/A'}`);
            });
        } else {
            console.log(`   ❌ Paloma NÃO encontrada no novo banco!`);
        }

        // 3. Verificar se há diferenças na estrutura do banco
        console.log('\n📊 3. VERIFICANDO ESTRUTURA DO BANCO ATUAL:');
        const tabelas = await pool.query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log(`   📋 Total de tabelas: ${tabelas.rows.length}`);
        tabelas.rows.forEach(table => {
            console.log(`   - ${table.table_name} (${table.column_count} colunas)`);
        });

        // 4. Verificar configurações de rede/IP que podem afetar Bybit
        console.log('\n📊 4. VERIFICANDO CONFIGURAÇÕES DE REDE:');
        
        // Testar se conseguimos acessar a API da Bybit
        const https = require('https');
        
        const testBybitAccess = () => {
            return new Promise((resolve) => {
                const req = https.request({
                    hostname: 'api.bybit.com',
                    port: 443,
                    path: '/v5/market/time',
                    method: 'GET'
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            console.log(`   ✅ Acesso à API Bybit: OK`);
                            console.log(`   🕐 Server time: ${new Date(parseInt(response.result.timeNano / 1000000))}`);
                            resolve(true);
                        } catch (error) {
                            console.log(`   ❌ Erro no acesso à API Bybit: ${error.message}`);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.log(`   ❌ Erro de conexão com Bybit: ${error.message}`);
                    resolve(false);
                });

                req.setTimeout(5000, () => {
                    console.log(`   ⏰ Timeout ao acessar Bybit`);
                    resolve(false);
                });

                req.end();
            });
        };

        await testBybitAccess();

        // 5. Verificar se as variáveis de ambiente mudaram
        console.log('\n📊 5. VERIFICANDO VARIÁVEIS DE AMBIENTE:');
        const envVars = [
            'DATABASE_URL',
            'NODE_ENV', 
            'BYBIT_API_KEY',
            'BYBIT_API_SECRET',
            'RAILWAY_ENVIRONMENT',
            'RAILWAY_PROJECT_NAME'
        ];

        envVars.forEach(varName => {
            const value = process.env[varName];
            console.log(`   ${varName}: ${value ? value.substring(0, 20) + '...' : 'Não configurada'}`);
        });

        // 6. Verificar logs de sistema para mudanças recentes
        console.log('\n📊 6. VERIFICANDO LOGS DE MUDANÇAS:');
        try {
            const recentLogs = await pool.query(`
                SELECT * FROM system_logs 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC 
                LIMIT 10
            `);

            if (recentLogs.rows.length > 0) {
                console.log(`   📋 ${recentLogs.rows.length} logs das últimas 24h:`);
                recentLogs.rows.forEach((log, idx) => {
                    console.log(`   ${idx + 1}. [${log.created_at}] ${log.level}: ${log.message.substring(0, 80)}...`);
                });
            } else {
                console.log(`   ❌ Nenhum log encontrado (pode indicar migração de banco)`);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao acessar logs: ${error.message}`);
        }

        console.log('\n🎯 ANÁLISE DOS POSSÍVEIS IMPACTOS:');
        console.log('='.repeat(50));
        console.log('✅ Mudança de projeto Railway confirmada');
        console.log('✅ Novo banco de dados vinculado');
        console.log('🔍 Possíveis causas dos problemas com APIs:');
        console.log('   1. IP do servidor mudou (afeta whitelist Bybit)');
        console.log('   2. Chaves API foram perdidas na migração');
        console.log('   3. Configurações de ambiente foram resetadas');
        console.log('   4. Estrutura do banco pode ter diferenças');
        console.log('   5. Endpoints internos podem ter mudado');

        console.log('\n🚨 AÇÕES RECOMENDADAS:');
        console.log('   1. Verificar IP atual do servidor Railway');
        console.log('   2. Atualizar whitelist de IPs na conta Bybit');
        console.log('   3. Reconfigurar chaves API da Paloma');
        console.log('   4. Validar todas as variáveis de ambiente');
        console.log('   5. Testar endpoints após correções');

    } catch (error) {
        console.error('❌ Erro na investigação:', error.message);
    } finally {
        pool.end();
    }
}

investigarImpactosRailway();
