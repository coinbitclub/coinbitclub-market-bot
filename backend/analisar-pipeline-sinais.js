#!/usr/bin/env node
/**
 * 🔍 ANALISAR PIPELINE DE PROCESSAMENTO DOS SINAIS TRADINGVIEW
 * Investigar onde os sinais deveriam ser convertidos em operações
 */

const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
});

async function analisarPipelineProcessamento() {
    console.log('🔍 ANÁLISE COMPLETA DO PIPELINE DE PROCESSAMENTO');
    console.log('=' .repeat(70));
    
    try {
        // 1. Verificar endpoints de webhook ativos
        console.log('\n📡 1. ENDPOINTS DE WEBHOOK:');
        console.log('URL TradingView configurada:');
        console.log('   https://coinbitclub-market-bot.up.railway.app/webhook/signal?token=210406');
        console.log('   https://coinbitclub-market-bot.up.railway.app/webhook/dominance?token=210406');
        
        // 2. Verificar estrutura completa das tabelas
        console.log('\n📋 2. ESTRUTURA DAS TABELAS ENVOLVIDAS:');
        
        // Verificar tradingview_signals
        console.log('\n   🔹 TRADINGVIEW_SIGNALS:');
        const tvStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tradingview_signals' 
            ORDER BY ordinal_position
        `);
        
        tvStructure.rows.forEach(col => {
            console.log(`      ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
        // Verificar operations
        console.log('\n   🔹 OPERATIONS:');
        const operationsStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'operations' 
            ORDER BY ordinal_position
        `);
        
        operationsStructure.rows.forEach(col => {
            console.log(`      ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
        // 3. Verificar tabelas de processamento intermediário
        console.log('\n📊 3. TABELAS DE PROCESSAMENTO INTERMEDIÁRIO:');
        const intermediateTables = [
            'signal_processing_queue',
            'ai_analysis_real', 
            'signal_user_processing',
            'ai_trading_decisions',
            'trading_signals',
            'raw_webhook'
        ];
        
        for (const tableName of intermediateTables) {
            try {
                const count = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
                console.log(`   📋 ${tableName}: ${count.rows[0].count} registros`);
                
                // Verificar registros recentes
                try {
                    const recent = await pool.query(`
                        SELECT COUNT(*) FROM ${tableName} 
                        WHERE created_at > NOW() - INTERVAL '7 days'
                    `);
                    console.log(`      📅 Últimos 7 dias: ${recent.rows[0].count} registros`);
                } catch (recentError) {
                    console.log(`      📅 Últimos 7 dias: não verificável`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${tableName}: ${error.message}`);
            }
        }
        
        // 4. Analisar gap entre sinais e operações
        console.log('\n🔍 4. ANÁLISE DO GAP SINAL → OPERAÇÃO:');
        
        // Verificar se existem operações com signal_tv_id
        const operationsWithSignals = await pool.query(`
            SELECT 
                COUNT(*) as total_operations,
                COUNT(signal_tv_id) as operations_with_signal_id,
                COUNT(signal_id) as operations_with_signal,
                COUNT(CASE WHEN signal_tv_id IS NOT NULL THEN 1 END) as linked_to_tv_signals
            FROM operations
        `);
        
        const opsStats = operationsWithSignals.rows[0];
        console.log(`   📊 Total de operações: ${opsStats.total_operations}`);
        console.log(`   📊 Com signal_tv_id: ${opsStats.operations_with_signal_id}`);
        console.log(`   📊 Com signal_id: ${opsStats.operations_with_signal}`);
        console.log(`   📊 Linkadas a TV signals: ${opsStats.linked_to_tv_signals}`);
        
        // 5. Procurar funções/procedures de processamento
        console.log('\n⚙️ 5. FUNÇÕES DE PROCESSAMENTO NO BANCO:');
        const functions = await pool.query(`
            SELECT 
                routine_name,
                routine_type,
                routine_definition
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND (routine_name ILIKE '%signal%' OR routine_name ILIKE '%trading%' OR routine_name ILIKE '%operation%')
            ORDER BY routine_name
        `);
        
        if (functions.rows.length > 0) {
            console.log(`   ✅ ${functions.rows.length} funções encontradas:`);
            functions.rows.forEach(func => {
                console.log(`      🔧 ${func.routine_name} (${func.routine_type})`);
            });
        } else {
            console.log('   ⚠️ Nenhuma função de processamento encontrada');
        }
        
        // 6. Verificar triggers automáticos
        console.log('\n🎯 6. TRIGGERS AUTOMÁTICOS:');
        const triggers = await pool.query(`
            SELECT 
                trigger_name,
                event_manipulation,
                trigger_schema,
                event_object_table
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND (event_object_table LIKE '%signal%' OR event_object_table LIKE '%operation%')
            ORDER BY event_object_table, trigger_name
        `);
        
        if (triggers.rows.length > 0) {
            console.log(`   ✅ ${triggers.rows.length} triggers encontrados:`);
            triggers.rows.forEach(trigger => {
                console.log(`      ⚡ ${trigger.trigger_name} ON ${trigger.event_object_table} (${trigger.event_manipulation})`);
            });
        } else {
            console.log('   ⚠️ Nenhum trigger automático encontrado');
        }
        
        // 7. Verificar raw_webhooks recentes
        console.log('\n📦 7. RAW WEBHOOKS RECENTES:');
        try {
            const rawWebhooks = await pool.query(`
                SELECT 
                    id, source, status, created_at,
                    (payload->>'ticker') as ticker,
                    (payload->>'close_price') as price
                FROM raw_webhook 
                WHERE source ILIKE '%trading%' 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            
            if (rawWebhooks.rows.length > 0) {
                console.log(`   ✅ ${rawWebhooks.rows.length} webhooks TradingView recentes:`);
                rawWebhooks.rows.forEach((webhook, index) => {
                    console.log(`      ${index + 1}. ${webhook.source} - ${webhook.ticker || 'N/A'} - Status: ${webhook.status}`);
                    console.log(`         Criado: ${new Date(webhook.created_at).toLocaleString('pt-BR')}`);
                });
            } else {
                console.log('   ⚠️ Nenhum webhook TradingView encontrado em raw_webhook');
            }
        } catch (rawError) {
            console.log('   ❌ Erro ao verificar raw_webhook:', rawError.message);
        }
        
        // 8. Identificar onde deveria ocorrer o processamento
        console.log('\n🚨 8. DIAGNÓSTICO DO PROBLEMA:');
        console.log('');
        console.log('   ❌ LACUNAS IDENTIFICADAS:');
        console.log('      1. Sinais chegam na tabela tradingview_signals');
        console.log('      2. ❌ NÃO HÁ ligação automática signal → operation');
        console.log('      3. ❌ Operações têm signal_tv_id = NULL');
        console.log('      4. ❌ Falta processamento automático dos sinais');
        console.log('');
        console.log('   🔧 ONDE DEVERIA ACONTECER O PROCESSAMENTO:');
        console.log('      • Webhook recebe sinal → salva em tradingview_signals');
        console.log('      • ❌ FALTA: Trigger ou job que processa novos sinais');
        console.log('      • ❌ FALTA: Função que cria operações baseadas nos sinais');
        console.log('      • ❌ FALTA: Ligação signal_id → operations.signal_tv_id');
        
        console.log('\n💡 9. SOLUÇÃO NECESSÁRIA:');
        console.log('   ✅ Criar sistema de processamento automático que:');
        console.log('      1. Monitore novos sinais em tradingview_signals');
        console.log('      2. Analise condições de mercado');
        console.log('      3. Crie operações na tabela operations');
        console.log('      4. Faça link entre signal_id e operations.signal_tv_id');
        console.log('      5. Processe para usuários ativos');
        
    } catch (error) {
        console.error('❌ Erro durante análise:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    analisarPipelineProcessamento().catch(console.error);
}

module.exports = { analisarPipelineProcessamento };
