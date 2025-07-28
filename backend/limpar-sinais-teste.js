#!/usr/bin/env node
/**
 * 🧹 LIMPAR SINAIS DE TESTE DO TRADINGVIEW
 * Remove todos os sinais de teste da tabela tradingview_signals
 */

const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
});

async function limparSinaisTeste() {
    console.log('🧹 LIMPANDO SINAIS DE TESTE DO TRADINGVIEW');
    console.log('=' .repeat(50));
    
    try {
        // 1. Verificar quantos sinais existem antes
        console.log('\n1. Verificando sinais existentes...');
        const countBefore = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        console.log(`   📊 Total de sinais antes: ${countBefore.rows[0].count}`);
        
        if (countBefore.rows[0].count > 0) {
            // Mostrar alguns exemplos dos sinais
            const examples = await pool.query(`
                SELECT id, symbol, action, message, created_at 
                FROM tradingview_signals 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            
            console.log('\n   📝 Exemplos de sinais encontrados:');
            examples.rows.forEach((signal, index) => {
                console.log(`   ${index + 1}. ID: ${signal.id} | ${signal.symbol} | ${signal.action} | ${signal.created_at}`);
                console.log(`      Mensagem: ${signal.message?.substring(0, 50)}...`);
            });
        }
        
        // 2. Deletar todos os sinais de teste
        console.log('\n2. Removendo sinais de teste...');
        const deleteResult = await pool.query('DELETE FROM tradingview_signals');
        console.log(`   ✅ Removidos ${deleteResult.rowCount} sinais de teste`);
        
        // 3. Verificar se a tabela está limpa
        console.log('\n3. Verificando limpeza...');
        const countAfter = await pool.query('SELECT COUNT(*) FROM tradingview_signals');
        console.log(`   📊 Total de sinais após limpeza: ${countAfter.rows[0].count}`);
        
        // 4. Reset do auto-increment (se necessário)
        console.log('\n4. Resetando sequência de IDs...');
        await pool.query('ALTER SEQUENCE tradingview_signals_id_seq RESTART WITH 1');
        console.log('   ✅ Sequência de IDs resetada para 1');
        
        console.log('\n✨ LIMPEZA CONCLUÍDA COM SUCESSO!');
        console.log('   • Todos os sinais de teste foram removidos');
        console.log('   • Tabela preparada para receber sinais reais');
        console.log('   • IDs resetados para começar do 1');
        
    } catch (error) {
        console.error('❌ Erro ao limpar sinais de teste:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    limparSinaisTeste().catch(console.error);
}

module.exports = { limparSinaisTeste };
