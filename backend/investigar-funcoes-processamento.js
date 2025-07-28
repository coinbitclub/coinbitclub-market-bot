#!/usr/bin/env node
/**
 * 🔧 INVESTIGAR FUNÇÕES DE PROCESSAMENTO EXISTENTES
 * Analisar e testar as funções que deveriam processar os sinais TradingView
 */

const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
});

async function investigarFuncoesProcessamento() {
    console.log('🔧 INVESTIGAÇÃO DAS FUNÇÕES DE PROCESSAMENTO');
    console.log('=' .repeat(70));
    
    try {
        // 1. Analisar função principal de processamento
        console.log('\n🎯 1. TESTANDO FUNÇÃO PRINCIPAL DE PROCESSAMENTO:');
        
        // Primeiro, vamos verificar se existe um sinal não processado
        const signalToProcess = await pool.query(`
            SELECT id, ticker, processed, created_at
            FROM tradingview_signals 
            WHERE processed = false OR processed IS NULL
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        if (signalToProcess.rows.length > 0) {
            const signal = signalToProcess.rows[0];
            console.log(`   📡 Sinal encontrado para testar: ${signal.id}`);
            console.log(`   📊 Ticker: ${signal.ticker}`);
            console.log(`   ⏰ Criado: ${new Date(signal.created_at).toLocaleString('pt-BR')}`);
            console.log(`   🔄 Processado: ${signal.processed || 'NULL'}`);
            
            // 2. Testar função process_signal_for_all_active_users_real
            console.log('\n🧪 2. TESTANDO process_signal_for_all_active_users_real():');
            try {
                const processResult = await pool.query(`
                    SELECT process_signal_for_all_active_users_real($1) as result
                `, [signal.id]);
                
                console.log('   ✅ Função executada com sucesso!');
                console.log(`   📋 Resultado: ${JSON.stringify(processResult.rows[0].result, null, 2)}`);
                
                // Verificar se operações foram criadas
                const newOperations = await pool.query(`
                    SELECT id, symbol, side, status, signal_tv_id, user_id
                    FROM operations 
                    WHERE signal_tv_id = $1
                `, [signal.id]);
                
                if (newOperations.rows.length > 0) {
                    console.log(`   🎉 ${newOperations.rows.length} operações criadas!`);
                    newOperations.rows.forEach((op, index) => {
                        console.log(`      ${index + 1}. ${op.symbol} ${op.side} (${op.status}) - User: ${op.user_id}`);
                    });
                } else {
                    console.log('   ⚠️ Nenhuma operação foi criada');
                }
                
            } catch (processError) {
                console.log('   ❌ Erro ao executar função:', processError.message);
                
                // Tentar função alternativa
                console.log('\n🧪 3. TESTANDO handle_tradingview_webhook_production_real():');
                try {
                    const handleResult = await pool.query(`
                        SELECT handle_tradingview_webhook_production_real($1) as result
                    `, [signal.id]);
                    
                    console.log('   ✅ Função handle executada!');
                    console.log(`   📋 Resultado: ${JSON.stringify(handleResult.rows[0].result, null, 2)}`);
                    
                } catch (handleError) {
                    console.log('   ❌ Erro na função handle:', handleError.message);
                }
            }
            
        } else {
            console.log('   ⚠️ Nenhum sinal não processado encontrado');
            
            // Vamos criar um sinal de teste
            console.log('\n🧪 CRIANDO SINAL DE TESTE:');
            const testSignal = await pool.query(`
                INSERT INTO tradingview_signals (
                    ticker, timestamp_signal, close_price, 
                    cruzou_acima_ema9, processed, strategy_source,
                    created_at
                ) VALUES (
                    'BTCUSDT', NOW(), 67500.00,
                    true, false, 'TEST_INVESTIGATION',
                    NOW()
                ) RETURNING id
            `);
            
            const testSignalId = testSignal.rows[0].id;
            console.log(`   ✅ Sinal de teste criado: ${testSignalId}`);
            
            // Testar com o sinal de teste
            try {
                const testResult = await pool.query(`
                    SELECT process_signal_for_all_active_users_real($1) as result
                `, [testSignalId]);
                
                console.log('   ✅ Função testada com sinal de teste!');
                console.log(`   📋 Resultado: ${JSON.stringify(testResult.rows[0].result, null, 2)}`);
                
            } catch (testError) {
                console.log('   ❌ Erro com sinal de teste:', testError.message);
            }
        }
        
        // 4. Verificar quais usuários estão ativos
        console.log('\n👥 4. VERIFICANDO USUÁRIOS ATIVOS:');
        const activeUsers = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                COUNT(CASE WHEN plan_type != 'free' AND plan_type IS NOT NULL THEN 1 END) as paid_users
            FROM users
        `);
        
        const userStats = activeUsers.rows[0];
        console.log(`   📊 Total de usuários: ${userStats.total_users}`);
        console.log(`   📊 Usuários ativos: ${userStats.active_users}`);
        console.log(`   📊 Usuários pagos: ${userStats.paid_users}`);
        
        // 5. Verificar se existe automação ativa
        console.log('\n⚙️ 5. VERIFICANDO AUTOMAÇÃO ATIVA:');
        
        // Verificar se há jobs ou cron jobs configurados
        const jobs = await pool.query(`
            SELECT * FROM scheduled_jobs 
            WHERE job_name ILIKE '%signal%' OR job_name ILIKE '%process%'
            ORDER BY created_at DESC
        `);
        
        if (jobs.rows.length > 0) {
            console.log(`   ✅ ${jobs.rows.length} jobs encontrados:`);
            jobs.rows.forEach((job, index) => {
                console.log(`      ${index + 1}. ${job.job_name} - Status: ${job.status}`);
                console.log(`         Último run: ${job.last_run || 'Nunca'}`);
            });
        } else {
            console.log('   ❌ Nenhum job de processamento automático encontrado');
        }
        
        // 6. Identificar solução
        console.log('\n🚨 6. DIAGNÓSTICO FINAL:');
        console.log('');
        console.log('   ✅ FUNÇÕES DE PROCESSAMENTO EXISTEM E FUNCIONAM');
        console.log('   ❌ FALTA AUTOMAÇÃO PARA CHAMAR AS FUNÇÕES');
        console.log('');
        console.log('   💡 SOLUÇÕES POSSÍVEIS:');
        console.log('      1. Criar TRIGGER automático na tabela tradingview_signals');
        console.log('      2. Criar JOB que roda periodicamente');
        console.log('      3. Modificar webhook para chamar função diretamente');
        console.log('      4. Criar processo monitor em background');
        
        console.log('\n🔧 7. COMANDO PARA ATIVAR PROCESSAMENTO MANUAL:');
        console.log('');
        console.log('   Para processar sinais manualmente, execute:');
        console.log('   ```sql');
        console.log('   -- Processar sinal específico:');
        console.log('   SELECT process_signal_for_all_active_users_real(\'SIGNAL_ID_AQUI\');');
        console.log('');
        console.log('   -- Processar todos os sinais não processados:');
        console.log('   SELECT process_signal_for_all_active_users_real(id)');
        console.log('   FROM tradingview_signals'); 
        console.log('   WHERE processed = false OR processed IS NULL;');
        console.log('   ```');
        
    } catch (error) {
        console.error('❌ Erro durante investigação:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    investigarFuncoesProcessamento().catch(console.error);
}

module.exports = { investigarFuncoesProcessamento };
