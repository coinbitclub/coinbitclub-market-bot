/**
 * 🔍 DIAGNÓSTICO DO PIPELINE DE TRADING
 * Identificar gargalos no processo de abertura de operações
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function diagnosticarPipeline() {
    try {
        console.log('🔍 DIAGNÓSTICO DO PIPELINE DE TRADING');
        console.log('=====================================');

        // 1. Verificar sinais recebidos
        console.log('\n1️⃣ ANÁLISE DE SINAIS RECEBIDOS:');
        
        const totalSignals = await pool.query(`
            SELECT COUNT(*) as total FROM trading_signals
        `);
        console.log(`   📊 Total de sinais recebidos: ${totalSignals.rows[0].total}`);

        if (totalSignals.rows[0].total > 0) {
            const recentSignals = await pool.query(`
                SELECT symbol, action, price, strategy, processing_status, 
                       processed, received_at, processed_at
                FROM trading_signals 
                ORDER BY received_at DESC 
                LIMIT 10
            `);

            console.log('   📋 Últimos 10 sinais:');
            recentSignals.rows.forEach((signal, i) => {
                console.log(`   ${i+1}. ${signal.symbol} ${signal.action} - ${new Date(signal.received_at).toLocaleString()}`);
                console.log(`      Status: ${signal.processing_status} | Processado: ${signal.processed}`);
            });

            // Estatísticas de processamento
            const processStats = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE processed = true) as processados,
                    COUNT(*) FILTER (WHERE processing_status = 'success') as sucessos,
                    COUNT(*) FILTER (WHERE processing_status = 'error') as erros,
                    COUNT(*) FILTER (WHERE processing_status = 'pending') as pendentes
                FROM trading_signals
            `);

            const stats = processStats.rows[0];
            console.log('\n   📊 Estatísticas de processamento:');
            console.log(`      ✅ Processados: ${stats.processados}/${stats.total}`);
            console.log(`      🎯 Sucessos: ${stats.sucessos}`);
            console.log(`      ❌ Erros: ${stats.erros}`);
            console.log(`      ⏳ Pendentes: ${stats.pendentes}`);
        } else {
            console.log('   ⚠️ NENHUM SINAL RECEBIDO! Este é o problema principal.');
        }

        // 2. Verificar usuários ativos
        console.log('\n2️⃣ ANÁLISE DE USUÁRIOS ATIVOS:');
        
        const activeUsers = await pool.query(`
            SELECT COUNT(*) as total FROM users WHERE is_active = true
        `);
        console.log(`   👥 Usuários ativos: ${activeUsers.rows[0].total}`);

        if (activeUsers.rows[0].total > 0) {
            const usersWithKeys = await pool.query(`
                SELECT 
                    u.id, u.name, u.email, u.is_active,
                    k.api_key, k.is_active as key_active, k.last_validated,
                    k.exchange, k.validation_status
                FROM users u
                LEFT JOIN user_api_keys k ON u.id = k.user_id
                WHERE u.is_active = true
                LIMIT 5
            `);

            console.log('   📋 Usuários com chaves API:');
            usersWithKeys.rows.forEach((user, i) => {
                console.log(`   ${i+1}. ${user.name || user.email}`);
                console.log(`      API Key: ${user.api_key ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
                console.log(`      Exchange: ${user.exchange || 'N/A'}`);
                console.log(`      Key Ativa: ${user.key_active || 'false'}`);
                console.log(`      Status: ${user.validation_status || 'Não validada'}`);
                console.log(`      Última validação: ${user.last_validated || 'Nunca'}`);
            });
        }

        // 3. Verificar sistema de orquestração
        console.log('\n3️⃣ ANÁLISE DO SISTEMA DE ORQUESTRAÇÃO:');
        
        // Verificar se existe tabela de status do sistema
        const systemTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%system%'
        `);

        console.log('   📋 Tabelas do sistema encontradas:');
        systemTables.rows.forEach(table => {
            console.log(`      - ${table.table_name}`);
        });

        // 4. Verificar operações reais (não simuladas)
        console.log('\n4️⃣ ANÁLISE DE OPERAÇÕES REAIS:');
        
        const realOperations = await pool.query(`
            SELECT COUNT(*) as total 
            FROM live_operations 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            AND exchange != 'SIMULACAO'
        `);
        console.log(`   📊 Operações reais nas últimas 24h: ${realOperations.rows[0].total}`);

        // Verificar operações por exchange
        const operationsByExchange = await pool.query(`
            SELECT exchange, COUNT(*) as total
            FROM live_operations
            GROUP BY exchange
        `);

        console.log('   📋 Operações por exchange:');
        operationsByExchange.rows.forEach(row => {
            console.log(`      ${row.exchange}: ${row.total} operações`);
        });

        // 5. Verificar logs de erro
        console.log('\n5️⃣ ANÁLISE DE LOGS DE ERRO:');
        
        const errorLogs = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%log%' OR table_name LIKE '%error%')
        `);

        if (errorLogs.rows.length > 0) {
            console.log('   📋 Tabelas de logs encontradas:');
            errorLogs.rows.forEach(table => {
                console.log(`      - ${table.table_name}`);
            });
        } else {
            console.log('   ⚠️ Nenhuma tabela de logs encontrada');
        }

        // 6. Verificar webhook endpoint
        console.log('\n6️⃣ ANÁLISE DO WEBHOOK:');
        console.log('   🌐 Endpoint configurado: POST /webhook/tradingview');
        console.log('   📡 URL: http://localhost:3000/webhook/tradingview');
        
        // 7. Identificar possíveis gargalos
        console.log('\n🎯 DIAGNÓSTICO DE GARGALOS:');
        
        const gargalos = [];
        
        if (totalSignals.rows[0].total === 0) {
            gargalos.push('❌ CRÍTICO: Nenhum sinal sendo recebido no webhook');
        }
        
        if (activeUsers.rows[0].total === 0) {
            gargalos.push('❌ CRÍTICO: Nenhum usuário ativo');
        }
        
        const usersWithValidKeys = await pool.query(`
            SELECT COUNT(*) as total 
            FROM users u
            JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true AND k.is_active = true
            AND k.validation_status = 'valid'
        `);
        
        if (usersWithValidKeys.rows[0].total === 0) {
            gargalos.push('❌ CRÍTICO: Nenhum usuário com chaves API válidas');
        }

        if (gargalos.length > 0) {
            console.log('\n🚨 GARGALOS IDENTIFICADOS:');
            gargalos.forEach((gargalo, i) => {
                console.log(`   ${i+1}. ${gargalo}`);
            });
        } else {
            console.log('   ✅ Nenhum gargalo crítico identificado');
        }

        // 8. Recomendações
        console.log('\n💡 RECOMENDAÇÕES:');
        
        if (totalSignals.rows[0].total === 0) {
            console.log('   1. Configurar TradingView para enviar sinais para o webhook');
            console.log('   2. Testar webhook manualmente com curl');
            console.log('   3. Verificar se o servidor está acessível externamente');
        }
        
        if (activeUsers.rows[0].total === 0) {
            console.log('   1. Ativar pelo menos um usuário no sistema');
            console.log('   2. Configurar chaves API da Bybit para o usuário');
        }
        
        console.log('   📋 Para testar webhook manualmente:');
        console.log('   curl -X POST http://localhost:3000/webhook/tradingview \\');
        console.log('        -H "Content-Type: application/json" \\');
        console.log('        -d \'{"symbol":"BTCUSDT","action":"buy","price":60000}\'');

    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar diagnóstico
diagnosticarPipeline();
