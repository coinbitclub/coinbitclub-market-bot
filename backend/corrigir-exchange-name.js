/**
 * 🔧 CORRIGIR EXCHANGE_NAME INCORRETO
 * Problema: exchange_name está 'binance' mas deveria ser 'bybit'
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirExchangeName() {
    console.log('🔧 CORRIGINDO EXCHANGE_NAME INCORRETO');
    console.log('='.repeat(40));
    
    try {
        // 1. Verificar registros com problema
        console.log('🔍 VERIFICANDO REGISTROS COM PROBLEMA:');
        const problematicos = await pool.query(`
            SELECT id, user_id, exchange, exchange_name, api_key
            FROM user_api_keys
            WHERE (exchange LIKE '%bybit%' AND exchange_name != 'bybit')
               OR (exchange = 'bybit' AND exchange_name != 'bybit')
        `);
        
        console.log(`📊 Encontrados ${problematicos.rows.length} registros com exchange_name incorreto:`);
        problematicos.rows.forEach(row => {
            console.log(`   ID ${row.id}: exchange='${row.exchange}' mas exchange_name='${row.exchange_name}' ❌`);
        });
        
        if (problematicos.rows.length === 0) {
            console.log('✅ Nenhum problema encontrado com exchange_name');
            return;
        }
        
        // 2. Corrigir exchange_name para 'bybit'
        console.log('\n🔧 CORRIGINDO EXCHANGE_NAME:');
        const correcao = await pool.query(`
            UPDATE user_api_keys 
            SET exchange_name = 'bybit',
                updated_at = NOW()
            WHERE (exchange LIKE '%bybit%' AND exchange_name != 'bybit')
               OR (exchange = 'bybit' AND exchange_name != 'bybit')
            RETURNING id, exchange, exchange_name
        `);
        
        console.log(`✅ ${correcao.rows.length} registros corrigidos:`);
        correcao.rows.forEach(row => {
            console.log(`   ID ${row.id}: exchange_name agora é '${row.exchange_name}' ✅`);
        });
        
        // 3. Verificar se há outros problemas similares
        console.log('\n🔍 VERIFICANDO OUTRAS INCONSISTÊNCIAS:');
        const verificacao = await pool.query(`
            SELECT exchange, exchange_name, COUNT(*) as count
            FROM user_api_keys
            GROUP BY exchange, exchange_name
            ORDER BY exchange
        `);
        
        console.log('📊 RESUMO POR EXCHANGE:');
        verificacao.rows.forEach(row => {
            const status = (row.exchange.includes('bybit') && row.exchange_name === 'bybit') ||
                          (row.exchange.includes('binance') && row.exchange_name === 'binance') ? '✅' : '❌';
            console.log(`   ${status} ${row.exchange} → ${row.exchange_name} (${row.count} registros)`);
        });
        
        // 4. Testar uma chave após correção
        console.log('\n🧪 TESTANDO CHAVE APÓS CORREÇÃO:');
        const testeChave = await pool.query(`
            SELECT uk.api_key, uk.secret_key, uk.exchange_name
            FROM user_api_keys uk
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            AND uk.api_key NOT LIKE 'API_KEY_%'
            LIMIT 1
        `);
        
        if (testeChave.rows.length > 0) {
            const chave = testeChave.rows[0];
            console.log(`🔑 Chave de teste: ${chave.api_key.substring(0, 8)}...`);
            console.log(`📋 Exchange name: ${chave.exchange_name}`);
            
            if (chave.exchange_name === 'bybit') {
                console.log('✅ Exchange name correto! Pode testar API agora.');
            } else {
                console.log('❌ Exchange name ainda incorreto.');
            }
        }
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('✅ 1. Exchange_name corrigido para "bybit"');
        console.log('✅ 2. Agora testar com: node teste-pos-correcao.js');
        console.log('✅ 3. Sistema deve reconhecer como Bybit corretamente');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

corrigirExchangeName();
