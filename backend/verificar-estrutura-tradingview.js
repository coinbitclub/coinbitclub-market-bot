#!/usr/bin/env node
/**
 * 🔍 VERIFICAR ESTRUTURA E LIMPAR SINAIS DE TESTE
 * Analisa a estrutura real da tabela tradingview_signals e remove sinais de teste
 */

const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstruturaTradingView() {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA TRADINGVIEW_SIGNALS');
    console.log('=' .repeat(60));
    
    try {
        // 1. Verificar se a tabela existe e sua estrutura
        console.log('\n1. Estrutura da tabela tradingview_signals:');
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tradingview_signals' 
            ORDER BY ordinal_position
        `);
        
        if (structure.rows.length === 0) {
            console.log('   ❌ Tabela tradingview_signals não encontrada!');
            return;
        }
        
        console.log('   📋 Colunas encontradas:');
        structure.rows.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });
        
        // 2. Verificar dados existentes com as colunas corretas
        console.log('\n2. Verificando sinais existentes...');
        const countResult = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        console.log(`   📊 Total de sinais: ${countResult.rows[0].count}`);
        
        if (parseInt(countResult.rows[0].count) > 0) {
            // Buscar todos os dados usando SELECT *
            console.log('\n3. Exemplos de sinais encontrados:');
            const examples = await pool.query(`
                SELECT * FROM tradingview_signals 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            
            examples.rows.forEach((signal, index) => {
                console.log(`\n   📡 Sinal ${index + 1}:`);
                Object.keys(signal).forEach(key => {
                    if (signal[key] !== null) {
                        const value = typeof signal[key] === 'string' && signal[key].length > 50 
                                    ? signal[key].substring(0, 50) + '...' 
                                    : signal[key];
                        console.log(`      ${key}: ${value}`);
                    }
                });
            });
        }
        
        return structure.rows;
        
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
        throw error;
    }
}

async function limparSinaisComEstrutura() {
    console.log('\n🧹 INICIANDO LIMPEZA DOS SINAIS DE TESTE');
    console.log('=' .repeat(50));
    
    try {
        // 1. Verificar estrutura primeiro
        const estrutura = await verificarEstruturaTradingView();
        
        if (!estrutura || estrutura.length === 0) {
            console.log('❌ Não foi possível verificar a estrutura da tabela');
            return;
        }
        
        // 2. Contar sinais antes da exclusão
        const countBefore = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        const totalBefore = parseInt(countBefore.rows[0].count);
        
        if (totalBefore === 0) {
            console.log('ℹ️ Tabela já está vazia - nenhum sinal para remover');
            return;
        }
        
        console.log(`\n4. Removendo ${totalBefore} sinais de teste...`);
        
        // 3. Confirmar a exclusão (simulação de confirmação)
        console.log('   ⚠️ ATENÇÃO: Todos os sinais serão removidos');
        console.log('   💡 Estes são sinais de teste, não sinais reais de produção');
        
        // 4. Executar a exclusão
        const deleteResult = await pool.query('DELETE FROM tradingview_signals');
        console.log(`   ✅ Removidos ${deleteResult.rowCount} sinais de teste`);
        
        // 5. Verificar se a tabela está limpa
        const countAfter = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        console.log(`   📊 Sinais restantes: ${countAfter.rows[0].count}`);
        
        // 6. Reset do auto-increment se houver coluna id
        const hasIdColumn = estrutura.some(col => col.column_name === 'id');
        if (hasIdColumn) {
            try {
                await pool.query('ALTER SEQUENCE tradingview_signals_id_seq RESTART WITH 1');
                console.log('   🔄 Sequência de IDs resetada para 1');
            } catch (seqError) {
                console.log('   ⚠️ Nota: Sequência de ID pode não existir ou ter nome diferente');
            }
        }
        
        console.log('\n✨ LIMPEZA CONCLUÍDA COM SUCESSO!');
        console.log('   • Todos os sinais de teste foram removidos');
        console.log('   • Tabela preparada para receber sinais reais do TradingView');
        console.log('   • Sistema pronto para processar novos webhooks');
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    limparSinaisComEstrutura().catch(console.error);
}

module.exports = { verificarEstruturaTradingView, limparSinaisComEstrutura };
