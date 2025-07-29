/**
 * 🔍 VERIFICAR CONTA DA PALOMA - DIAGNÓSTICO COMPLETO
 * Verifica se o sistema está monitorando e operando corretamente
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarContaPaloma() {
    try {
        console.log('🔍 VERIFICANDO CONTA DA PALOMA - DIAGNÓSTICO COMPLETO');
        console.log('='.repeat(70));
        
        // 1. Verificar se Paloma existe no banco
        console.log('👤 1. VERIFICANDO USUÁRIO PALOMA...');
        const userQuery = `
            SELECT id, name, email, created_at, updated_at, is_active, plan
            FROM users 
            WHERE email = 'pamaral15@hotmail.com';
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ PROBLEMA: Paloma não encontrada no banco de dados!');
            return;
        }
        
        const paloma = userResult.rows[0];
        console.log('✅ Paloma encontrada:');
        console.log(`   ID: ${paloma.id}`);
        console.log(`   Nome: ${paloma.name}`);
        console.log(`   Email: ${paloma.email}`);
        console.log(`   Ativo: ${paloma.is_active}`);
        console.log(`   Plano: ${paloma.plan || 'Não definido'}`);
        console.log('');
        
        // 2. Verificar configurações de trading
        console.log('⚙️ 2. VERIFICANDO CONFIGURAÇÕES DE TRADING...');
        const configQuery = `
            SELECT * FROM usuario_configuracoes WHERE user_id = $1;
        `;
        
        const configResult = await pool.query(configQuery, [paloma.id]);
        
        if (configResult.rows.length === 0) {
            console.log('❌ PROBLEMA: Paloma não tem configurações de trading!');
        } else {
            const config = configResult.rows[0];
            console.log('✅ Configurações encontradas:');
            console.log(`   Alavancagem: ${config.leverage_default}x`);
            console.log(`   Take Profit: ${config.take_profit_multiplier}x`);
            console.log(`   Stop Loss: ${config.stop_loss_multiplier}x`);
            console.log(`   Percentual por trade: ${config.balance_percentage}%`);
            console.log(`   Max posições: ${config.max_open_positions}`);
        }
        console.log('');
        
        // 3. Verificar chaves de API
        console.log('🔑 3. VERIFICANDO CHAVES DE API...');
        const apiKeysQuery = `
            SELECT api_key, api_secret, is_active, exchange
            FROM user_api_keys 
            WHERE user_id = $1;
        `;
        
        const apiKeysResult = await pool.query(apiKeysQuery, [paloma.id]);
        
        if (apiKeysResult.rows.length === 0) {
            console.log('❌ PROBLEMA: Paloma não tem chaves de API configuradas!');
        } else {
            apiKeysResult.rows.forEach((key, index) => {
                console.log(`✅ Chave ${index + 1}:`);
                console.log(`   Exchange: ${key.exchange}`);
                console.log(`   API Key: ${key.api_key ? key.api_key.substring(0, 10) + '...' : 'Não definida'}`);
                console.log(`   Ativa: ${key.is_active}`);
            });
        }
        console.log('');
        
        // 4. Verificar operações recentes
        console.log('📊 4. VERIFICANDO OPERAÇÕES RECENTES...');
        const operationsQuery = `
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas,
                   COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechadas,
                   MAX(created_at) as ultima_operacao
            FROM user_operations 
            WHERE user_id = $1;
        `;
        
        const operationsResult = await pool.query(operationsQuery, [paloma.id]);
        const ops = operationsResult.rows[0];
        
        console.log(`📈 Total de operações: ${ops.total}`);
        console.log(`🔓 Operações abertas: ${ops.abertas}`);
        console.log(`✅ Operações fechadas: ${ops.fechadas}`);
        console.log(`⏰ Última operação: ${ops.ultima_operacao || 'Nenhuma'}`);
        console.log('');
        
        // 5. Verificar sinais recebidos
        console.log('📡 5. VERIFICANDO SINAIS RECEBIDOS...');
        const sinaisQuery = `
            SELECT COUNT(*) as total,
                   MAX(created_at) as ultimo_sinal,
                   signal_type,
                   COUNT(*) as quantidade
            FROM signals_received 
            WHERE user_id = $1
            GROUP BY signal_type
            ORDER BY quantidade DESC;
        `;
        
        const sinaisResult = await pool.query(sinaisQuery, [paloma.id]);
        
        if (sinaisResult.rows.length === 0) {
            console.log('❌ PROBLEMA: Nenhum sinal recebido para Paloma!');
        } else {
            console.log('✅ Sinais recebidos:');
            sinaisResult.rows.forEach(sinal => {
                console.log(`   ${sinal.signal_type}: ${sinal.quantidade} sinais`);
            });
            
            // Último sinal
            const ultimoSinalQuery = `
                SELECT signal_type, created_at, status
                FROM signals_received 
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 1;
            `;
            
            const ultimoSinal = await pool.query(ultimoSinalQuery, [paloma.id]);
            if (ultimoSinal.rows.length > 0) {
                const ultimo = ultimoSinal.rows[0];
                console.log(`⏰ Último sinal: ${ultimo.signal_type} em ${ultimo.created_at}`);
                console.log(`   Status: ${ultimo.status}`);
            }
        }
        console.log('');
        
        // 6. Verificar logs da IA Supervisor
        console.log('🤖 6. VERIFICANDO LOGS DA IA SUPERVISOR...');
        const logsQuery = `
            SELECT COUNT(*) as total,
                   MAX(created_at) as ultima_atividade,
                   log_type,
                   COUNT(*) as quantidade
            FROM ia_supervisor_logs 
            WHERE user_id = $1
                AND created_at > NOW() - INTERVAL '24 hours'
            GROUP BY log_type
            ORDER BY quantidade DESC;
        `;
        
        const logsResult = await pool.query(logsQuery, [paloma.id]);
        
        if (logsResult.rows.length === 0) {
            console.log('❌ PROBLEMA: IA Supervisor não está ativa para Paloma!');
        } else {
            console.log('✅ IA Supervisor ativa (últimas 24h):');
            logsResult.rows.forEach(log => {
                console.log(`   ${log.log_type}: ${log.quantidade} registros`);
            });
        }
        console.log('');
        
        // 7. Verificar saldo atual
        console.log('💰 7. VERIFICANDO SALDO ATUAL...');
        const saldoQuery = `
            SELECT balance, updated_at
            FROM user_balances 
            WHERE user_id = $1
            ORDER BY updated_at DESC
            LIMIT 1;
        `;
        
        const saldoResult = await pool.query(saldoQuery, [paloma.id]);
        
        if (saldoResult.rows.length === 0) {
            console.log('❌ PROBLEMA: Saldo da Paloma não encontrado!');
        } else {
            const saldo = saldoResult.rows[0];
            console.log(`✅ Saldo atual: $${saldo.balance}`);
            console.log(`⏰ Atualizado: ${saldo.updated_at}`);
        }
        console.log('');
        
        // 8. Status geral do sistema
        console.log('📋 8. DIAGNÓSTICO FINAL:');
        console.log('='.repeat(40));
        
        const problemas = [];
        
        if (!paloma.is_active) problemas.push('❌ Usuário inativo');
        if (configResult.rows.length === 0) problemas.push('❌ Sem configurações de trading');
        if (apiKeysResult.rows.length === 0) problemas.push('❌ Sem chaves de API');
        if (sinaisResult.rows.length === 0) problemas.push('❌ Nenhum sinal recebido');
        if (logsResult.rows.length === 0) problemas.push('❌ IA Supervisor inativa');
        if (saldoResult.rows.length === 0) problemas.push('❌ Saldo não configurado');
        
        if (problemas.length === 0) {
            console.log('✅ SISTEMA OK: Todos os componentes funcionando');
            console.log('🔄 Possível que sistema esteja aguardando sinais');
        } else {
            console.log('❌ PROBLEMAS ENCONTRADOS:');
            problemas.forEach(problema => console.log(`   ${problema}`));
        }
        
        console.log('');
        console.log('💡 PRÓXIMOS PASSOS:');
        console.log('   1. Se houver problemas, corrigi-los');
        console.log('   2. Verificar se IA Supervisor está rodando');
        console.log('   3. Verificar se webhooks TradingView estão ativos');
        console.log('   4. Testar envio manual de sinais');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

verificarContaPaloma();
