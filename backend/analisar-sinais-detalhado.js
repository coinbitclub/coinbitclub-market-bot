/**
 * 🔬 ANÁLISE DETALHADA DOS SINAIS
 * Investigar por que os sinais não estão gerando operações
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function analisarSinais() {
    try {
        console.log('🔬 ANÁLISE DETALHADA DOS SINAIS');
        console.log('===============================');

        // 1. Verificar estrutura da tabela de sinais
        console.log('\n1️⃣ ESTRUTURA DA TABELA TRADING_SIGNALS:');
        
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals' 
            ORDER BY ordinal_position
        `);
        
        structure.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // 2. Analisar sinais detalhadamente
        console.log('\n2️⃣ ANÁLISE DETALHADA DOS SINAIS:');
        
        const signals = await pool.query(`
            SELECT id, symbol, action, price, strategy, timeframe,
                   signal_data, received_at, processed, processing_status,
                   processed_at, rejection_reason, validation_passed
            FROM trading_signals 
            ORDER BY received_at DESC
        `);

        signals.rows.forEach((signal, i) => {
            console.log(`\n📊 SINAL ${i+1}:`);
            console.log(`   ID: ${signal.id}`);
            console.log(`   Símbolo: ${signal.symbol}`);
            console.log(`   Ação: ${signal.action}`);
            console.log(`   Preço: ${signal.price}`);
            console.log(`   Estratégia: ${signal.strategy}`);
            console.log(`   Timeframe: ${signal.timeframe}`);
            console.log(`   Recebido em: ${signal.received_at}`);
            console.log(`   Processado: ${signal.processed}`);
            console.log(`   Status: ${signal.processing_status}`);
            console.log(`   Processado em: ${signal.processed_at || 'Não processado'}`);
            console.log(`   Validação passou: ${signal.validation_passed}`);
            console.log(`   Motivo rejeição: ${signal.rejection_reason || 'Nenhum'}`);
            if (signal.signal_data) {
                console.log(`   Dados completos: ${JSON.stringify(signal.signal_data, null, 2)}`);
            }
        });

        // 3. Verificar se existe processador de sinais ativo
        console.log('\n3️⃣ VERIFICAR PROCESSAMENTO DE SINAIS:');
        
        // Verificar logs relacionados a processamento
        const processingLogs = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%signal%' OR table_name LIKE '%process%')
            ORDER BY table_name
        `);

        console.log('   📋 Tabelas relacionadas a processamento:');
        processingLogs.rows.forEach(table => {
            console.log(`      - ${table.table_name}`);
        });

        // 4. Verificar se há sistema de automação ativo
        console.log('\n4️⃣ VERIFICAR SISTEMA DE AUTOMAÇÃO:');
        
        const automationTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%auto%' OR table_name LIKE '%robot%' OR table_name LIKE '%bot%')
            ORDER BY table_name
        `);

        console.log('   📋 Tabelas de automação:');
        automationTables.rows.forEach(table => {
            console.log(`      - ${table.table_name}`);
        });

        // 5. Verificar configurações do sistema
        console.log('\n5️⃣ VERIFICAR CONFIGURAÇÕES DO SISTEMA:');
        
        try {
            const systemConfig = await pool.query(`
                SELECT key, value, description 
                FROM system_config 
                WHERE key LIKE '%trading%' OR key LIKE '%auto%' OR key LIKE '%signal%'
            `);

            if (systemConfig.rows.length > 0) {
                console.log('   📋 Configurações relevantes:');
                systemConfig.rows.forEach(config => {
                    console.log(`      ${config.key}: ${config.value} (${config.description || 'N/A'})`);
                });
            } else {
                console.log('   ⚠️ Nenhuma configuração de trading encontrada');
            }
        } catch (error) {
            console.log('   ⚠️ Tabela system_config não acessível:', error.message);
        }

        // 6. Verificar logs de sistema recentes
        console.log('\n6️⃣ LOGS DE SISTEMA RECENTES:');
        
        try {
            const recentLogs = await pool.query(`
                SELECT level, message, timestamp, module
                FROM system_logs 
                WHERE timestamp > NOW() - INTERVAL '2 hours'
                AND (message ILIKE '%signal%' OR message ILIKE '%trading%' OR message ILIKE '%order%')
                ORDER BY timestamp DESC
                LIMIT 10
            `);

            if (recentLogs.rows.length > 0) {
                console.log('   📋 Logs relevantes das últimas 2 horas:');
                recentLogs.rows.forEach(log => {
                    console.log(`      [${log.timestamp}] ${log.level}: ${log.message} (${log.module || 'N/A'})`);
                });
            } else {
                console.log('   ⚠️ Nenhum log relevante encontrado nas últimas 2 horas');
            }
        } catch (error) {
            console.log('   ⚠️ Não foi possível acessar logs:', error.message);
        }

        // 7. Análise final
        console.log('\n🎯 ANÁLISE FINAL:');
        
        if (signals.rows.length === 0) {
            console.log('   ❌ Nenhum sinal recebido - Problema no webhook');
        } else {
            const processedSignals = signals.rows.filter(s => s.processed);
            const pendingSignals = signals.rows.filter(s => !s.processed);
            
            console.log(`   📊 Total de sinais: ${signals.rows.length}`);
            console.log(`   ✅ Processados: ${processedSignals.length}`);
            console.log(`   ⏳ Pendentes: ${pendingSignals.length}`);
            
            if (pendingSignals.length > 0) {
                console.log('\n   🚨 PROBLEMAS IDENTIFICADOS:');
                console.log('   - Há sinais pendentes que não estão sendo processados');
                console.log('   - O sistema de processamento de sinais pode estar inativo');
                console.log('   - Pode haver erro na validação ou execução das ordens');
            }
            
            if (processedSignals.length > 0 && processedSignals.every(s => s.processing_status !== 'success')) {
                console.log('\n   🚨 SINAIS PROCESSADOS MAS SEM SUCESSO:');
                console.log('   - Os sinais estão sendo recebidos e processados');
                console.log('   - Mas não estão resultando em ordens executadas');
                console.log('   - Verificar validação de API keys ou configurações da exchange');
            }
        }

        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('   1. Verificar se existe um processo de background processando sinais');
        console.log('   2. Testar manualmente o webhook com um sinal');
        console.log('   3. Verificar se as chaves API estão funcionando na Bybit');
        console.log('   4. Verificar se há saldo suficiente para as operações');

    } catch (error) {
        console.error('❌ Erro na análise:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar análise
analisarSinais();
