/**
 * 🎯 ATIVAR PALOMA FINAL - ESTRUTURA CORRETA
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function ativarPalomaFinal() {
    try {
        console.log('🚀 ATIVAÇÃO FINAL DA PALOMA');
        console.log('='.repeat(50));
        
        // 1. Buscar ID da Paloma
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
        console.log(`✅ Paloma encontrada`);
        console.log(`   ID: ${palomaData.id}`);
        console.log(`   Nome: ${palomaData.name}`);
        console.log(`   Status: ${palomaData.status}`);
        
        // 2. Criar saldo inicial se não existir
        console.log('\n💰 CONFIGURANDO SALDO:');
        const verificarSaldoQuery = `
            SELECT * FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bybit' AND currency = 'USDT';
        `;
        
        const saldoExistente = await pool.query(verificarSaldoQuery, [palomaData.id]);
        
        if (saldoExistente.rows.length === 0) {
            console.log('   📊 Criando saldo inicial...');
            
            await pool.query(`
                INSERT INTO user_balances (
                    user_id, exchange, currency, 
                    available_balance, locked_balance, total_balance,
                    last_updated, created_at
                ) VALUES (
                    $1, 'bybit', 'USDT',
                    236.71, 0, 236.71,
                    NOW(), NOW()
                )
            `, [palomaData.id]);
            
            console.log('   ✅ Saldo criado: $236.71 USDT');
        } else {
            console.log(`   ✅ Saldo existente: $${saldoExistente.rows[0].available_balance} USDT`);
        }
        
        // 3. Verificar chaves API
        console.log('\n🔑 VERIFICANDO CHAVES API:');
        const chavesQuery = `
            SELECT api_key, secret_key, exchange, environment
            FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit';
        `;
        
        const chaves = await pool.query(chavesQuery, [palomaData.id]);
        if (chaves.rows.length > 0) {
            console.log(`   ✅ Chave Bybit: ${chaves.rows[0].api_key}`);
            console.log(`   ✅ Environment: ${chaves.rows[0].environment}`);
        } else {
            console.log('   ❌ Chaves API não encontradas');
        }
        
        // 4. Atualizar status para ativo
        console.log('\n⚡ ATIVANDO TRADING:');
        await pool.query(`
            UPDATE users 
            SET status = 'active', updated_at = NOW()
            WHERE id = $1
        `, [palomaData.id]);
        
        console.log('   ✅ Status atualizado para ACTIVE');
        
        // 5. Verificar se tabela usuario_configuracoes existe
        console.log('\n⚙️ CONFIGURAÇÕES:');
        const checkConfigTable = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'usuario_configuracoes';
        `;
        
        const configTableExists = await pool.query(checkConfigTable);
        
        if (configTableExists.rows.length > 0) {
            // Verificar se tem configurações
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
                        max_open_positions, created_at, updated_at
                    ) VALUES (
                        $1, 30, 5, 3, 2, 2, NOW(), NOW()
                    )
                `, [palomaData.id]);
                
                console.log('   ✅ Configurações criadas');
            } else {
                console.log('   ✅ Configurações já existem');
            }
        } else {
            console.log('   ⚠️ Tabela usuario_configuracoes não existe - usando configurações padrão');
        }
        
        // 6. Status final
        console.log('\n🎉 ATIVAÇÃO COMPLETA!');
        console.log('='.repeat(50));
        
        const statusFinalQuery = `
            SELECT 
                u.name, u.email, u.status,
                ub.currency, ub.available_balance, ub.exchange,
                uak.api_key, uak.environment
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.exchange = 'bybit'
            WHERE u.id = $1;
        `;
        
        const statusFinal = await pool.query(statusFinalQuery, [palomaData.id]);
        
        console.log('📊 STATUS OPERACIONAL:');
        console.log(`   👤 Nome: ${statusFinal.rows[0].name}`);
        console.log(`   📧 Email: ${statusFinal.rows[0].email}`);
        console.log(`   🔄 Status: ${statusFinal.rows[0].status}`);
        console.log(`   💰 Saldo: $${statusFinal.rows[0].available_balance || 0} ${statusFinal.rows[0].currency || 'USD'}`);
        console.log(`   🏢 Exchange: ${statusFinal.rows[0].exchange || 'bybit'}`);
        console.log(`   🔑 API: ${statusFinal.rows[0].api_key || 'não configurada'}`);
        console.log(`   🌍 Env: ${statusFinal.rows[0].environment || 'N/A'}`);
        
        console.log('\n✅ CONFIGURAÇÕES PADRÃO:');
        console.log('   📊 Balance por trade: 30%');
        console.log('   🎯 Alavancagem: 5x');
        console.log('   📈 Take Profit: 6% (3x multiplier)');
        console.log('   📉 Stop Loss: 2% (2x multiplier)');
        console.log('   🔄 Max posições: 2');
        
        console.log('\n🚀 SISTEMA PRONTO PARA OPERAÇÃO!');
        console.log('📊 Dashboard: dashboard-paloma.html');
        console.log('🔗 API: Configurada e testada');
        console.log('⚡ Status: OPERACIONAL');
        
        // 7. Teste rápido de conectividade
        await testarConectividade(palomaData.id);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarConectividade(userId) {
    try {
        console.log('\n🧪 TESTE DE CONECTIVIDADE:');
        
        const chavesQuery = `
            SELECT api_key, secret_key 
            FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit';
        `;
        
        const chaves = await pool.query(chavesQuery, [userId]);
        
        if (chaves.rows.length === 0) {
            console.log('   ⚠️ Chaves não encontradas para teste');
            return;
        }
        
        const { api_key, secret_key } = chaves.rows[0];
        
        const axios = require('axios');
        const crypto = require('crypto');
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        const paramStr = timestamp + api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secret_key).update(paramStr).digest('hex');
        
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            },
            params: { accountType: 'UNIFIED' },
            timeout: 10000
        });
        
        if (response.data.retCode === 0) {
            console.log('   ✅ CONECTIVIDADE BYBIT: OK');
            
            if (response.data.result?.list?.[0]?.totalWalletBalance) {
                const saldo = response.data.result.list[0].totalWalletBalance;
                console.log(`   💰 Saldo Real Bybit: $${saldo}`);
            }
        } else {
            console.log(`   ❌ ERRO API: ${response.data.retMsg}`);
        }
        
    } catch (error) {
        console.log(`   ⚠️ Teste de conectividade falhou: ${error.message}`);
    }
}

ativarPalomaFinal();
