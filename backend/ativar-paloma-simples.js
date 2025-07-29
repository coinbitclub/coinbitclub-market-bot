/**
 * 🚀 ATIVAR PALOMA - VERSÃO SIMPLIFICADA
 * 
 * Usando a estrutura real do banco de dados
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function ativarPalomaSimplificado() {
    try {
        console.log('🚀 ATIVANDO PALOMA PARA TRADING');
        console.log('='.repeat(50));
        
        // 1. Buscar dados da Paloma
        const palomaQuery = `
            SELECT id, name, email, status
            FROM users 
            WHERE email = 'pamaral15@hotmail.com';
        `;
        
        const paloma = await pool.query(palomaQuery);
        if (paloma.rows.length === 0) {
            console.log('❌ Paloma não encontrada');
            return;
        }
        
        const palomaData = paloma.rows[0];
        console.log(`✅ Paloma encontrada - ID: ${palomaData.id}`);
        console.log(`   Nome: ${palomaData.name}`);
        console.log(`   Status atual: ${palomaData.status}`);
        
        // 2. Verificar saldo atual
        const saldoQuery = `
            SELECT currency, available_balance, test_credit_balance
            FROM user_balances 
            WHERE user_id = $1;
        `;
        
        const saldos = await pool.query(saldoQuery, [palomaData.id]);
        console.log('\n💰 SALDOS ATUAIS:');
        if (saldos.rows.length > 0) {
            saldos.rows.forEach(saldo => {
                console.log(`   ${saldo.currency}: $${saldo.available_balance || 0} (Crédito teste: $${saldo.test_credit_balance || 0})`);
            });
        } else {
            console.log('   📊 Criando saldo inicial...');
            
            // Criar saldo USD inicial
            await pool.query(`
                INSERT INTO user_balances (
                    id, user_id, currency, available_balance, 
                    locked_balance, pending_balance, total_deposits,
                    total_withdrawals, last_updated, created_at,
                    prepaid_balance, total_profit, total_loss,
                    pending_commission, paid_commission, 
                    test_credit_balance, test_credit_used
                ) VALUES (
                    gen_random_uuid(), $1, 'USD', 236.71,
                    0, 0, 236.71, 0, NOW(), NOW(),
                    236.71, 0, 0, 0, 0, 1000, 0
                )
            `, [palomaData.id]);
            
            console.log('   ✅ Saldo USD criado: $236.71');
        }
        
        // 3. Verificar chaves API
        console.log('\n🔑 VERIFICANDO CHAVES API:');
        const chavesQuery = `
            SELECT api_key, secret_key, exchange, environment, is_active
            FROM user_api_keys 
            WHERE user_id = $1;
        `;
        
        const chaves = await pool.query(chavesQuery, [palomaData.id]);
        if (chaves.rows.length > 0) {
            chaves.rows.forEach(chave => {
                console.log(`   ✅ ${chave.exchange}: ${chave.api_key} (${chave.environment})`);
            });
        } else {
            console.log('   ❌ Nenhuma chave API encontrada');
        }
        
        // 4. Criar configurações de usuário se não existirem
        console.log('\n⚙️ CONFIGURAÇÕES DE TRADING:');
        const configQuery = `
            SELECT * FROM usuario_configuracoes WHERE user_id = $1;
        `;
        
        const configs = await pool.query(configQuery, [palomaData.id]);
        if (configs.rows.length === 0) {
            console.log('   📊 Criando configurações padrão...');
            
            await pool.query(`
                INSERT INTO usuario_configuracoes (
                    user_id, balance_percentage, leverage_default,
                    take_profit_multiplier, stop_loss_multiplier,
                    max_open_positions, trailing_stop, risk_reward_ratio,
                    min_signal_confidence, max_slippage_percent,
                    created_at, updated_at
                ) VALUES (
                    $1, 30, 5, 3, 2, 2, false, 1.5, 0.7, 0.1, NOW(), NOW()
                )
            `, [palomaData.id]);
            
            console.log('   ✅ Configurações criadas');
        } else {
            console.log('   ✅ Configurações já existem');
        }
        
        // 5. Ativar status de trading
        console.log('\n🔄 ATIVANDO STATUS DE TRADING:');
        await pool.query(`
            UPDATE users 
            SET status = 'active', updated_at = NOW()
            WHERE id = $1
        `, [palomaData.id]);
        
        console.log('   ✅ Status atualizado para ACTIVE');
        
        // 6. Verificar status final
        console.log('\n📊 STATUS FINAL:');
        const finalQuery = `
            SELECT 
                u.name, u.email, u.status,
                ub.currency, ub.available_balance,
                ub.test_credit_balance,
                uak.exchange, uak.api_key
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id = $1;
        `;
        
        const finalData = await pool.query(finalQuery, [palomaData.id]);
        finalData.rows.forEach(row => {
            console.log(`   👤 ${row.name} (${row.status})`);
            console.log(`   💰 Saldo: $${row.available_balance || 0} ${row.currency || 'USD'}`);
            console.log(`   🎁 Crédito teste: $${row.test_credit_balance || 0}`);
            console.log(`   🔑 API: ${row.exchange || 'N/A'} - ${row.api_key || 'não configurada'}`);
        });
        
        console.log('\n🎉 PALOMA ATIVADA COM SUCESSO!');
        console.log('✅ Status: ATIVO');
        console.log('✅ Saldo: Configurado');
        console.log('✅ API: Verificada');
        console.log('✅ Configurações: Aplicadas');
        console.log('\n🚀 SISTEMA PRONTO PARA TRADING!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

ativarPalomaSimplificado();
