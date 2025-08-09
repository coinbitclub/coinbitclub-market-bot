/**
 * ⚡ HEALTH CHECK RÁPIDO - SISTEMA COMPLETO
 * 
 * Verificação rápida de todos os componentes críticos
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

const EXPECTED_IP = '132.255.160.140';

console.log('⚡ HEALTH CHECK RÁPIDO - SISTEMA COMPLETO');
console.log('========================================');

async function quickHealthCheck() {
    const startTime = Date.now();
    let issues = 0;
    let warnings = 0;

    try {
        // 1. Verificar IP
        console.log('\n🌐 1. VERIFICAÇÃO DE IP:');
        const currentIP = await checkIP();
        if (currentIP !== EXPECTED_IP) {
            issues++;
            console.log(`❌ IP mudou: ${currentIP} (esperado: ${EXPECTED_IP})`);
        } else {
            console.log(`✅ IP correto: ${currentIP}`);
        }

        // 2. Verificar banco de dados
        console.log('\n💾 2. VERIFICAÇÃO DO BANCO:');
        const dbOk = await checkDatabase();
        if (dbOk) {
            console.log('✅ Banco de dados: Conectado');
        } else {
            issues++;
            console.log('❌ Banco de dados: Falha na conexão');
        }

        // 3. Verificar exchanges
        console.log('\n🏦 3. VERIFICAÇÃO DAS EXCHANGES:');
        const exchangeResults = await checkExchanges();
        
        if (exchangeResults.binance.ok) {
            console.log('✅ Binance: OK');
        } else {
            warnings++;
            console.log(`⚠️ Binance: ${exchangeResults.binance.error}`);
        }

        if (exchangeResults.bybit.ok) {
            console.log('✅ Bybit: OK');
        } else {
            issues++;
            console.log(`❌ Bybit: ${exchangeResults.bybit.error}`);
        }

        // 4. Verificar chaves API
        console.log('\n🔑 4. VERIFICAÇÃO DAS CHAVES API:');
        const keysStatus = await checkAPIKeys();
        
        for (const [exchange, stats] of Object.entries(keysStatus)) {
            const validPercent = stats.total > 0 ? (stats.valid / stats.total * 100).toFixed(1) : 0;
            if (validPercent >= 80) {
                console.log(`✅ ${exchange.toUpperCase()}: ${stats.valid}/${stats.total} válidas (${validPercent}%)`);
            } else if (validPercent >= 50) {
                warnings++;
                console.log(`⚠️ ${exchange.toUpperCase()}: ${stats.valid}/${stats.total} válidas (${validPercent}%)`);
            } else {
                issues++;
                console.log(`❌ ${exchange.toUpperCase()}: ${stats.valid}/${stats.total} válidas (${validPercent}%)`);
            }
        }

        // 5. Verificar usuários ativos
        console.log('\n👥 5. VERIFICAÇÃO DOS USUÁRIOS:');
        const userStats = await checkUsers();
        console.log(`📊 Usuários ativos: ${userStats.active}`);
        console.log(`📊 Usuários VIP: ${userStats.vip}`);
        console.log(`📊 Total de usuários: ${userStats.total}`);

        // 6. Relatório final
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n📊 RELATÓRIO FINAL:');
        console.log('==================');
        console.log(`⏱️ Tempo de execução: ${duration}ms`);
        console.log(`🔴 Problemas críticos: ${issues}`);
        console.log(`🟡 Avisos: ${warnings}`);
        
        if (issues === 0 && warnings === 0) {
            console.log('✅ SISTEMA TOTALMENTE OPERACIONAL');
            console.log('🚀 Todos os componentes funcionando perfeitamente');
        } else if (issues === 0) {
            console.log('🟡 SISTEMA OPERACIONAL COM AVISOS');
            console.log('⚠️ Algumas funcionalidades podem estar limitadas');
        } else {
            console.log('🔴 SISTEMA COM PROBLEMAS CRÍTICOS');
            console.log('🚨 Intervenção necessária');
        }

        // 7. Recomendações
        console.log('\n💡 RECOMENDAÇÕES:');
        if (currentIP !== EXPECTED_IP) {
            console.log('🔧 Atualizar IP nas configurações das exchanges');
        }
        if (warnings > 0) {
            console.log('🔧 Verificar chaves API com problemas');
        }
        if (issues > 0) {
            console.log('🚨 Executar diagnóstico detalhado');
        }

        return { issues, warnings, duration };

    } catch (error) {
        console.error('❌ Erro no health check:', error.message);
        return { issues: 999, warnings: 0, duration: Date.now() - startTime };
    } finally {
        await pool.end();
    }
}

async function checkIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json', { timeout: 5000 });
        const data = await response.json();
        return data.ip;
    } catch (error) {
        throw new Error(`Falha ao verificar IP: ${error.message}`);
    }
}

async function checkDatabase() {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        return result.rows.length > 0;
    } catch (error) {
        return false;
    }
}

async function checkExchanges() {
    const results = {
        binance: { ok: false, error: null },
        bybit: { ok: false, error: null }
    };

    // Teste Binance
    try {
        const binanceResponse = await fetch('https://api.binance.com/api/v3/ping', { timeout: 5000 });
        results.binance.ok = binanceResponse.ok;
        if (!binanceResponse.ok) {
            results.binance.error = `HTTP ${binanceResponse.status}`;
        }
    } catch (error) {
        results.binance.error = error.message;
    }

    // Teste Bybit
    try {
        const bybitResponse = await fetch('https://api.bybit.com/v5/market/time', { timeout: 5000 });
        if (bybitResponse.ok) {
            const data = await bybitResponse.json();
            results.bybit.ok = data.retCode === 0;
            if (data.retCode !== 0) {
                results.bybit.error = data.retMsg;
            }
        } else {
            results.bybit.error = `HTTP ${bybitResponse.status}`;
        }
    } catch (error) {
        results.bybit.error = error.message;
    }

    return results;
}

async function checkAPIKeys() {
    try {
        const result = await pool.query(`
            SELECT 
                exchange,
                COUNT(*) as total,
                COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid,
                COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending
            FROM user_api_keys
            WHERE is_active = true
            GROUP BY exchange
        `);

        const status = {};
        for (const row of result.rows) {
            status[row.exchange] = {
                total: parseInt(row.total),
                valid: parseInt(row.valid),
                pending: parseInt(row.pending)
            };
        }

        return status;
    } catch (error) {
        console.log('⚠️ Erro ao verificar chaves API:', error.message);
        return {};
    }
}

async function checkUsers() {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active,
                COUNT(CASE WHEN vip_status = true THEN 1 END) as vip
            FROM users
        `);

        return {
            total: parseInt(result.rows[0].total),
            active: parseInt(result.rows[0].active),
            vip: parseInt(result.rows[0].vip)
        };
    } catch (error) {
        console.log('⚠️ Erro ao verificar usuários:', error.message);
        return { total: 0, active: 0, vip: 0 };
    }
}

// Executar health check
quickHealthCheck().then(result => {
    const exitCode = result.issues > 0 ? 1 : 0;
    process.exit(exitCode);
}).catch(error => {
    console.error('💥 Falha crítica no health check:', error);
    process.exit(2);
});
