#!/usr/bin/env node
/**
 * 🧹 LIMPEZA COMPLETA DE SINAIS DE TESTE
 * Remove sinais de teste considerando todas as dependências de chaves estrangeiras
 */

const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarDependencias() {
    console.log('🔍 VERIFICANDO DEPENDÊNCIAS DE CHAVES ESTRANGEIRAS');
    console.log('=' .repeat(60));
    
    try {
        // Verificar tabelas que referenciam tradingview_signals
        const dependencies = await pool.query(`
            SELECT 
                tc.table_name, 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'tradingview_signals'
        `);
        
        console.log('\n📋 Tabelas que dependem de tradingview_signals:');
        if (dependencies.rows.length === 0) {
            console.log('   ✅ Nenhuma dependência encontrada');
        } else {
            dependencies.rows.forEach((dep, index) => {
                console.log(`   ${index + 1}. ${dep.table_name}.${dep.column_name} → tradingview_signals.${dep.foreign_column_name}`);
                console.log(`      Constraint: ${dep.constraint_name}`);
            });
        }
        
        return dependencies.rows;
        
    } catch (error) {
        console.error('❌ Erro ao verificar dependências:', error.message);
        throw error;
    }
}

async function contarRegistrosRelacionados() {
    console.log('\n📊 CONTANDO REGISTROS RELACIONADOS');
    console.log('=' .repeat(40));
    
    try {
        const tables = ['openai_integration_logs', 'operations', 'user_balances'];
        const counts = {};
        
        for (const table of tables) {
            try {
                // Verificar se a tabela existe
                const tableExists = await pool.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    )
                `, [table]);
                
                if (tableExists.rows[0].exists) {
                    const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                    counts[table] = parseInt(count.rows[0].count);
                    console.log(`   📋 ${table}: ${counts[table]} registros`);
                } else {
                    console.log(`   ⚠️ ${table}: Tabela não existe`);
                    counts[table] = 0;
                }
            } catch (error) {
                console.log(`   ❌ ${table}: Erro ao contar - ${error.message}`);
                counts[table] = 'erro';
            }
        }
        
        return counts;
        
    } catch (error) {
        console.error('❌ Erro ao contar registros:', error.message);
        throw error;
    }
}

async function limparSinaisComDependencias() {
    console.log('\n🧹 LIMPEZA SEGURA COM DEPENDÊNCIAS');
    console.log('=' .repeat(45));
    
    try {
        // 1. Verificar dependências
        const dependencies = await verificarDependencias();
        
        // 2. Contar registros relacionados
        const counts = await contarRegistrosRelacionados();
        
        // 3. Contar sinais tradingview
        const signalCount = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        console.log(`\n📡 Sinais TradingView para limpar: ${signalCount.rows[0].count}`);
        
        if (parseInt(signalCount.rows[0].count) === 0) {
            console.log('✅ Tabela tradingview_signals já está vazia');
            return;
        }
        
        // 4. Limpar tabelas dependentes primeiro
        console.log('\n🔄 Limpando tabelas dependentes...');
        
        // Limpar openai_integration_logs que referenciam sinais
        if (counts.openai_integration_logs > 0) {
            console.log('   🧹 Limpando openai_integration_logs...');
            const deleteOpenAI = await pool.query(`
                DELETE FROM openai_integration_logs 
                WHERE signal_id IN (SELECT id FROM tradingview_signals)
            `);
            console.log(`   ✅ Removidos ${deleteOpenAI.rowCount} logs do OpenAI`);
        }
        
        // Limpar operations que podem referenciar sinais
        try {
            console.log('   🧹 Verificando operations com signal_tv_id...');
            const deleteOps = await pool.query(`
                UPDATE operations 
                SET signal_tv_id = NULL 
                WHERE signal_tv_id IN (SELECT id FROM tradingview_signals)
            `);
            console.log(`   ✅ Atualizadas ${deleteOps.rowCount} operações (signal_tv_id = NULL)`);
        } catch (error) {
            console.log(`   ⚠️ Operations: ${error.message}`);
        }
        
        // 5. Agora limpar tradingview_signals
        console.log('\n🎯 Limpando tradingview_signals...');
        const deleteSignals = await pool.query('DELETE FROM tradingview_signals');
        console.log(`   ✅ Removidos ${deleteSignals.rowCount} sinais de teste`);
        
        // 6. Reset das sequências
        console.log('\n🔄 Resetando sequências...');
        try {
            await pool.query('ALTER SEQUENCE tradingview_signals_id_seq RESTART WITH 1');
            console.log('   ✅ Sequência tradingview_signals resetada');
        } catch (error) {
            console.log('   ⚠️ Sequência tradingview_signals: pode não existir');
        }
        
        try {
            await pool.query('ALTER SEQUENCE openai_integration_logs_id_seq RESTART WITH 1');
            console.log('   ✅ Sequência openai_integration_logs resetada');
        } catch (error) {
            console.log('   ⚠️ Sequência openai_integration_logs: pode não existir');
        }
        
        // 7. Verificação final
        console.log('\n✅ VERIFICAÇÃO FINAL:');
        const finalCount = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        console.log(`   📊 Sinais restantes: ${finalCount.rows[0].count}`);
        
        const finalLogsCount = await pool.query('SELECT COUNT(*) FROM openai_integration_logs');
        console.log(`   📊 Logs OpenAI restantes: ${finalLogsCount.rows[0].count}`);
        
        console.log('\n✨ LIMPEZA COMPLETA CONCLUÍDA!');
        console.log('   • Todos os sinais de teste foram removidos');
        console.log('   • Dependências foram limpas adequadamente');
        console.log('   • Tabelas preparadas para sinais reais');
        console.log('   • Sistema pronto para processar webhooks do TradingView');
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza completa:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    limparSinaisComDependencias()
        .catch(console.error)
        .finally(() => pool.end());
}

module.exports = { 
    verificarDependencias, 
    contarRegistrosRelacionados, 
    limparSinaisComDependencias 
};
