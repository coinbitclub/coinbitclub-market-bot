/**
 * 🔍 VERIFICADOR DE SINAIS NO BANCO DE DADOS
 * 
 * Script para verificar se os sinais do TradingView estão sendo
 * salvos corretamente no banco de dados
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 VERIFICANDO SINAIS NO BANCO DE DADOS');
console.log('======================================');

async function verificarSinais() {
    try {
        // 1. Verificar quantos sinais existem
        console.log('\n📊 1. ESTATÍSTICAS GERAIS:');
        const totalQuery = await pool.query('SELECT COUNT(*) as total FROM signals');
        const total = totalQuery.rows[0].total;
        console.log(`📋 Total de sinais: ${total}`);

        if (total === '0') {
            console.log('❌ Nenhum sinal encontrado no banco!');
            console.log('💡 Possíveis causas:');
            console.log('   • Webhooks não estão sendo recebidos');
            console.log('   • Problema de conexão com banco');
            console.log('   • Tabela signals não existe');
            return;
        }

        // 2. Mostrar os últimos 10 sinais
        console.log('\n📋 2. ÚLTIMOS 10 SINAIS:');
        const recentsQuery = await pool.query(`
            SELECT 
                id,
                symbol,
                action,
                price,
                quantity,
                strategy,
                timeframe,
                alert_message,
                created_at
            FROM signals 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        recentsQuery.rows.forEach((signal, index) => {
            console.log(`\n${index + 1}. 🆔 ID: ${signal.id}`);
            console.log(`   💰 Par: ${signal.symbol}`);
            console.log(`   📈 Ação: ${signal.action}`);
            console.log(`   💵 Preço: ${signal.price || 'N/A'}`);
            console.log(`   📦 Quantidade: ${signal.quantity || 'N/A'}`);
            console.log(`   🎯 Estratégia: ${signal.strategy || 'N/A'}`);
            console.log(`   ⏰ Timeframe: ${signal.timeframe || 'N/A'}`);
            console.log(`   📅 Criado: ${new Date(signal.created_at).toLocaleString('pt-BR')}`);
            if (signal.alert_message && signal.alert_message.length < 100) {
                console.log(`   📝 Mensagem: ${signal.alert_message}`);
            }
        });

        // 3. Estatísticas por símbolo
        console.log('\n📊 3. SINAIS POR SÍMBOLO:');
        const symbolsQuery = await pool.query(`
            SELECT 
                symbol,
                COUNT(*) as count,
                MAX(created_at) as ultimo_sinal
            FROM signals 
            GROUP BY symbol 
            ORDER BY count DESC, ultimo_sinal DESC
        `);

        symbolsQuery.rows.forEach(row => {
            console.log(`   ${row.symbol}: ${row.count} sinais (último: ${new Date(row.ultimo_sinal).toLocaleString('pt-BR')})`);
        });

        // 4. Estatísticas por ação
        console.log('\n📊 4. SINAIS POR AÇÃO:');
        const actionsQuery = await pool.query(`
            SELECT 
                action,
                COUNT(*) as count
            FROM signals 
            GROUP BY action 
            ORDER BY count DESC
        `);

        actionsQuery.rows.forEach(row => {
            console.log(`   ${row.action}: ${row.count} sinais`);
        });

        // 5. Sinais dos últimos 24h
        console.log('\n📊 5. SINAIS DAS ÚLTIMAS 24 HORAS:');
        const last24Query = await pool.query(`
            SELECT COUNT(*) as count
            FROM signals 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        `);

        const last24Count = last24Query.rows[0].count;
        console.log(`📅 Sinais nas últimas 24h: ${last24Count}`);

        // 6. Verificar se hoje recebeu sinais
        console.log('\n📊 6. SINAIS DE HOJE:');
        const todayQuery = await pool.query(`
            SELECT COUNT(*) as count
            FROM signals 
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        const todayCount = todayQuery.rows[0].count;
        console.log(`📅 Sinais de hoje: ${todayCount}`);

        if (todayCount > 0) {
            console.log('✅ Sistema recebendo sinais corretamente!');
        } else {
            console.log('⚠️ Nenhum sinal recebido hoje');
        }

        // 7. Status final
        console.log('\n🎯 7. STATUS DO SISTEMA:');
        console.log('========================');
        
        if (parseInt(total) > 0) {
            console.log('✅ Banco de dados: CONECTADO');
            console.log('✅ Tabela signals: EXISTENTE');
            console.log('✅ Dados: PRESENTES');
            
            if (parseInt(todayCount) > 0) {
                console.log('✅ Webhooks: FUNCIONANDO');
                console.log('🚀 SISTEMA TOTALMENTE OPERACIONAL!');
            } else {
                console.log('⚠️ Webhooks: SEM SINAIS HOJE');
                console.log('💡 Configure webhooks no TradingView para:');
                console.log('   URL: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal');
            }
        }

    } catch (error) {
        console.error('❌ Erro ao verificar sinais:', error.message);
        
        if (error.message.includes('relation "signals" does not exist')) {
            console.log('\n🔧 SOLUÇÃO: Tabela signals não existe');
            console.log('Execute: node setup-webhook-tables.js');
        } else if (error.message.includes('connect')) {
            console.log('\n🔧 SOLUÇÃO: Problema de conexão com banco');
            console.log('Verifique a variável DATABASE_URL');
        }
    } finally {
        await pool.end();
    }
}

// Executar verificação
verificarSinais().catch(console.error);
