/**
 * 🎯 CRIAR SALDO INICIAL PARA PALOMA
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function criarSaldoPaloma() {
    try {
        console.log('💰 CRIANDO SALDO INICIAL PARA PALOMA');
        console.log('='.repeat(50));
        
        // 1. Buscar ID da Paloma
        const palomaQuery = `
            SELECT id, name, email
            FROM users 
            WHERE email = 'pamaral15@hotmail.com';
        `;
        
        const paloma = await pool.query(palomaQuery);
        const userId = paloma.rows[0].id;
        
        console.log(`✅ Paloma ID: ${userId}`);
        console.log(`   Nome: ${paloma.rows[0].name}`);
        
        // 2. Criar saldo sem a coluna total_balance (pode ser calculada automaticamente)
        console.log('\n📊 CRIANDO SALDO USDT BYBIT...');
        
        const criarSaldoQuery = `
            INSERT INTO user_balances (
                user_id, exchange, currency, 
                available_balance, locked_balance,
                last_updated, created_at
            ) VALUES (
                $1, 'bybit', 'USDT',
                236.71, 0,
                NOW(), NOW()
            )
            RETURNING id, exchange, currency, available_balance;
        `;
        
        const novoSaldo = await pool.query(criarSaldoQuery, [userId]);
        
        console.log('✅ SALDO CRIADO COM SUCESSO!');
        console.log(`   ID: ${novoSaldo.rows[0].id}`);
        console.log(`   Exchange: ${novoSaldo.rows[0].exchange}`);
        console.log(`   Currency: ${novoSaldo.rows[0].currency}`);
        console.log(`   Saldo: $${novoSaldo.rows[0].available_balance}`);
        
        // 3. Verificar saldo criado
        console.log('\n🔍 VERIFICANDO SALDO CRIADO:');
        const verificarQuery = `
            SELECT * FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bybit' AND currency = 'USDT';
        `;
        
        const saldoVerificado = await pool.query(verificarQuery, [userId]);
        const saldo = saldoVerificado.rows[0];
        
        console.log('📊 DETALHES DO SALDO:');
        console.log(`   Available Balance: $${saldo.available_balance}`);
        console.log(`   Locked Balance: $${saldo.locked_balance}`);
        console.log(`   Total Balance: $${saldo.total_balance || 'calculado automaticamente'}`);
        console.log(`   Created At: ${saldo.created_at}`);
        
        // 4. Verificar se Paloma já está ativa
        console.log('\n⚡ VERIFICANDO STATUS DA PALOMA:');
        const statusQuery = `
            SELECT status FROM users WHERE id = $1;
        `;
        
        const statusResult = await pool.query(statusQuery, [userId]);
        console.log(`   Status atual: ${statusResult.rows[0].status}`);
        
        if (statusResult.rows[0].status !== 'active') {
            console.log('🔄 Ativando status...');
            await pool.query(`
                UPDATE users SET status = 'active', updated_at = NOW()
                WHERE id = $1
            `, [userId]);
            console.log('   ✅ Status atualizado para ACTIVE');
        } else {
            console.log('   ✅ Status já está ACTIVE');
        }
        
        // 5. Verificar chaves API
        console.log('\n🔑 VERIFICANDO CHAVES API:');
        const chavesQuery = `
            SELECT api_key, exchange, environment
            FROM user_api_keys 
            WHERE user_id = $1;
        `;
        
        const chaves = await pool.query(chavesQuery, [userId]);
        if (chaves.rows.length > 0) {
            chaves.rows.forEach(chave => {
                console.log(`   ✅ ${chave.exchange}: ${chave.api_key} (${chave.environment})`);
            });
        } else {
            console.log('   ⚠️ Nenhuma chave API encontrada');
        }
        
        console.log('\n🎉 PALOMA CONFIGURADA COM SUCESSO!');
        console.log('✅ Saldo: $236.71 USDT');
        console.log('✅ Exchange: Bybit');
        console.log('✅ Status: Ativo');
        console.log('✅ Pronta para trading!');
        
        console.log('\n📊 RESUMO FINAL:');
        console.log(`   👤 Usuária: ${paloma.rows[0].name}`);
        console.log(`   📧 Email: ${paloma.rows[0].email}`);
        console.log(`   💰 Saldo inicial: $236.71 USDT`);
        console.log(`   🏢 Exchange: Bybit`);
        console.log(`   🔄 Status: Ativo para trading`);
        console.log('\n🚀 SISTEMA PRONTO PARA OPERAÇÃO!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        
        if (error.message.includes('duplicate key')) {
            console.log('\n💡 SALDO JÁ EXISTE!');
            console.log('Verificando saldo existente...');
            
            const verificarExistenteQuery = `
                SELECT * FROM user_balances 
                WHERE user_id = (SELECT id FROM users WHERE email = 'pamaral15@hotmail.com')
                AND exchange = 'bybit' AND currency = 'USDT';
            `;
            
            const existente = await pool.query(verificarExistenteQuery);
            if (existente.rows.length > 0) {
                const saldo = existente.rows[0];
                console.log('✅ SALDO EXISTENTE ENCONTRADO:');
                console.log(`   💰 Disponível: $${saldo.available_balance}`);
                console.log(`   🔒 Bloqueado: $${saldo.locked_balance}`);
                console.log('✅ PALOMA JÁ ESTÁ CONFIGURADA!');
            }
        }
    } finally {
        await pool.end();
    }
}

criarSaldoPaloma();
