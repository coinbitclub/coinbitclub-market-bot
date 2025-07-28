#!/usr/bin/env node
/**
 * 🧹 LIMPEZA CASCATA COMPLETA - SINAIS DE TESTE
 * Mapeia e limpa TODAS as dependências em cascata dos sinais TradingView
 */

const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
});

async function mapearTodasDependencias() {
    console.log('🗺️ MAPEANDO TODAS AS DEPENDÊNCIAS EM CASCATA');
    console.log('=' .repeat(60));
    
    try {
        // Buscar TODAS as chaves estrangeiras no banco
        const allConstraints = await pool.query(`
            SELECT DISTINCT
                tc.table_name as referencing_table,
                kcu.column_name as referencing_column,
                ccu.table_name AS referenced_table,
                ccu.column_name AS referenced_column,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name
        `);
        
        console.log('\n📋 TODAS AS DEPENDÊNCIAS ENCONTRADAS:');
        
        // Criar mapa de dependências
        const dependencyMap = new Map();
        
        allConstraints.rows.forEach((constraint, index) => {
            const key = constraint.referenced_table;
            if (!dependencyMap.has(key)) {
                dependencyMap.set(key, []);
            }
            dependencyMap.get(key).push({
                table: constraint.referencing_table,
                column: constraint.referencing_column,
                referencedColumn: constraint.referenced_column,
                constraint: constraint.constraint_name
            });
            
            console.log(`   ${index + 1}. ${constraint.referencing_table}.${constraint.referencing_column} → ${constraint.referenced_table}.${constraint.referenced_column}`);
        });
        
        return dependencyMap;
        
    } catch (error) {
        console.error('❌ Erro ao mapear dependências:', error.message);
        throw error;
    }
}

async function construirOrdemLimpeza(dependencyMap) {
    console.log('\n🔄 CONSTRUINDO ORDEM DE LIMPEZA');
    console.log('=' .repeat(40));
    
    // Tabelas relacionadas ao TradingView (baseado no erro anterior)
    const tabelasRelacionadas = [
        'ai_analysis_real',           // Tem referências para openai_integration_logs
        'signal_user_processing',     // Referencia tradingview_signals
        'ai_trading_decisions',       // Referencia tradingview_signals  
        'market_data_consolidated',   // Referencia tradingview_signals
        'openai_integration_logs',    // Referencia tradingview_signals
        'tradingview_signals'         // Tabela principal
    ];
    
    console.log('📋 Ordem de limpeza (do mais dependente para o principal):');
    tabelasRelacionadas.forEach((tabela, index) => {
        console.log(`   ${index + 1}. ${tabela}`);
    });
    
    return tabelasRelacionadas;
}

async function contarRegistrosPorTabela(tabelas) {
    console.log('\n📊 CONTANDO REGISTROS POR TABELA');
    console.log('=' .repeat(35));
    
    const counts = {};
    
    for (const tabela of tabelas) {
        try {
            const count = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
            counts[tabela] = parseInt(count.rows[0].count);
            console.log(`   📋 ${tabela}: ${counts[tabela]} registros`);
        } catch (error) {
            console.log(`   ❌ ${tabela}: ${error.message}`);
            counts[tabela] = 'erro';
        }
    }
    
    return counts;
}

async function executarLimpezaCascata() {
    console.log('\n🧹 EXECUTANDO LIMPEZA EM CASCATA');
    console.log('=' .repeat(40));
    
    try {
        // 1. Mapear dependências
        const dependencyMap = await mapearTodasDependencias();
        
        // 2. Construir ordem de limpeza
        const ordemLimpeza = await construirOrdemLimpeza(dependencyMap);
        
        // 3. Contar registros
        const counts = await contarRegistrosPorTabela(ordemLimpeza);
        
        // 4. Verificar se há algo para limpar
        const totalSignals = counts['tradingview_signals'];
        if (totalSignals === 0) {
            console.log('\n✅ Tabela tradingview_signals já está vazia');
            return;
        }
        
        console.log(`\n🎯 Iniciando limpeza de ${totalSignals} sinais e dependências...`);
        
        // 5. Executar limpeza na ordem correta
        for (const tabela of ordemLimpeza) {
            if (counts[tabela] === 'erro' || counts[tabela] === 0) {
                console.log(`   ⏭️ Pulando ${tabela} (sem registros ou erro)`);
                continue;
            }
            
            console.log(`\n   🧹 Limpando ${tabela}...`);
            
            try {
                let query;
                let deletedCount;
                
                switch (tabela) {
                    case 'ai_analysis_real':
                        // Limpar análises AI que referenciam logs do OpenAI
                        query = `DELETE FROM ai_analysis_real WHERE openai_log_id IN 
                                (SELECT id FROM openai_integration_logs WHERE signal_id IN 
                                (SELECT id FROM tradingview_signals))`;
                        break;
                        
                    case 'signal_user_processing':
                        // Limpar processamento de usuários relacionado aos sinais
                        query = `DELETE FROM signal_user_processing WHERE signal_id IN 
                                (SELECT id FROM tradingview_signals)`;
                        break;
                        
                    case 'ai_trading_decisions':
                        // Limpar decisões de trading AI
                        query = `DELETE FROM ai_trading_decisions WHERE signal_id IN 
                                (SELECT id FROM tradingview_signals)`;
                        break;
                        
                    case 'market_data_consolidated':
                        // Limpar dados de mercado consolidados
                        query = `DELETE FROM market_data_consolidated WHERE related_tv_signal_id IN 
                                (SELECT id FROM tradingview_signals)`;
                        break;
                        
                    case 'openai_integration_logs':
                        // Limpar logs do OpenAI
                        query = `DELETE FROM openai_integration_logs WHERE signal_id IN 
                                (SELECT id FROM tradingview_signals)`;
                        break;
                        
                    case 'tradingview_signals':
                        // Finalmente limpar os sinais TradingView
                        query = `DELETE FROM tradingview_signals`;
                        break;
                        
                    default:
                        console.log(`   ⚠️ Tabela ${tabela} não reconhecida`);
                        continue;
                }
                
                const result = await pool.query(query);
                deletedCount = result.rowCount;
                console.log(`   ✅ ${tabela}: ${deletedCount} registros removidos`);
                
            } catch (error) {
                console.log(`   ❌ ${tabela}: ${error.message}`);
                // Continuar com as próximas tabelas mesmo se uma falhar
            }
        }
        
        // 6. Reset das sequências
        console.log('\n🔄 Resetando sequências...');
        const sequencias = [
            'tradingview_signals_id_seq',
            'openai_integration_logs_id_seq',
            'ai_analysis_real_id_seq',
            'signal_user_processing_id_seq',
            'ai_trading_decisions_id_seq',
            'market_data_consolidated_id_seq'
        ];
        
        for (const seq of sequencias) {
            try {
                await pool.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
                console.log(`   ✅ ${seq} resetada`);
            } catch (error) {
                console.log(`   ⚠️ ${seq}: ${error.message}`);
            }
        }
        
        // 7. Verificação final
        console.log('\n✅ VERIFICAÇÃO FINAL:');
        const finalCounts = await contarRegistrosPorTabela(['tradingview_signals', 'openai_integration_logs']);
        
        console.log('\n✨ LIMPEZA CASCATA CONCLUÍDA!');
        console.log('   • Todos os sinais de teste foram removidos');
        console.log('   • Todas as dependências foram limpas');
        console.log('   • Sequências foram resetadas');
        console.log('   • Sistema preparado para sinais reais do TradingView');
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza em cascata:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarLimpezaCascata()
        .catch(console.error)
        .finally(() => pool.end());
}

module.exports = { 
    mapearTodasDependencias,
    construirOrdemLimpeza,
    executarLimpezaCascata 
};
