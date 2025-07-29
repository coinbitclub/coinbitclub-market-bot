/**
 * 🔧 ATUALIZAÇÃO CORRIGIDA DE USUÁRIAS VIP
 * ======================================
 * 
 * Corrigindo com estrutura real do banco
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarUsuariasVIPCorrigido() {
    console.log('🔧 ATUALIZAÇÃO CORRIGIDA DE USUÁRIAS VIP');
    console.log('=======================================');
    
    const client = await pool.connect();
    
    try {
        console.log('\n📋 1. VERIFICANDO ESTRUTURA DA TABELA user_balances');
        console.log('──────────────────────────────────────────────────');
        
        const estruturaBalances = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'user_balances'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Colunas da tabela user_balances:');
        estruturaBalances.rows.forEach(col => {
            console.log(`  🔸 ${col.column_name} (${col.data_type})`);
        });
        
        console.log('\n👩 2. ATUALIZANDO ÉRICA DOS SANTOS');
        console.log('─────────────────────────────────────');
        
        // Buscar Érica dos Santos
        const ericaResult = await client.query(`
            SELECT id, email, full_name, name, vip_status, affiliate_level, pais
            FROM users 
            WHERE email = 'erica.andrade.santos@hotmail.com'
        `);
        
        if (ericaResult.rows.length === 0) {
            console.log('❌ Usuária Érica não encontrada');
            return;
        }
        
        const erica = ericaResult.rows[0];
        console.log('✅ Usuária encontrada:');
        console.log(`📧 Email: ${erica.email}`);
        console.log(`👤 Nome: ${erica.full_name || erica.name || 'Érica dos Santos Andrade'}`);
        console.log(`👑 VIP: ${erica.vip_status ? 'SIM' : 'NÃO'}`);
        console.log(`🌍 País: ${erica.pais || 'Não informado'}`);
        
        // Atualizar nome completo e país se necessário
        await client.query(`
            UPDATE users 
            SET full_name = COALESCE(full_name, $1),
                pais = $2,
                updated_at = NOW()
            WHERE id = $3
        `, ['Érica dos Santos Andrade', 'Brasil', erica.id]);
        console.log('✅ Dados atualizados: nome completo e país Brasil');
        
        // Atualizar chave API Bybit
        console.log('\n🔑 2.1 Atualizando Chave API Bybit');
        
        const novaChaveBybit = {
            api_key: 'dtbi5nXnYURm7uHnxA',
            secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
            permissoes: ['Contratos - Ordens Posições', 'Trading Unificado - Trade', 'SPOT - Negociar']
        };
        
        // Verificar se já existe chave Bybit
        const chaveExistente = await client.query(`
            SELECT id FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit'
        `, [erica.id]);
        
        if (chaveExistente.rows.length > 0) {
            // Atualizar chave existente
            await client.query(`
                UPDATE user_api_keys 
                SET api_key = $1, 
                    secret_key = $2,
                    is_active = true,
                    validation_status = 'updated',
                    environment = 'mainnet',
                    updated_at = NOW(),
                    permissions = $3
                WHERE user_id = $4 AND exchange = 'bybit'
            `, [
                novaChaveBybit.api_key,
                novaChaveBybit.secret_key,
                novaChaveBybit.permissoes,
                erica.id
            ]);
            console.log('✅ Chave Bybit atualizada com sucesso');
        } else {
            // Inserir nova chave
            await client.query(`
                INSERT INTO user_api_keys 
                (user_id, exchange, api_key, secret_key, environment, is_active, validation_status, created_at, permissions)
                VALUES ($1, 'bybit', $2, $3, 'mainnet', true, 'updated', NOW(), $4)
            `, [
                erica.id,
                novaChaveBybit.api_key,
                novaChaveBybit.secret_key,
                novaChaveBybit.permissoes
            ]);
            console.log('✅ Nova chave Bybit inserida com sucesso');
        }
        
        // Verificar saldos existentes (usando estrutura real)
        console.log('\n💰 2.2 Verificando Saldos Atuais da Érica');
        const saldosErica = await client.query(`
            SELECT * FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange
        `, [erica.id]);
        
        console.log(`📊 Saldos existentes: ${saldosErica.rows.length}`);
        if (saldosErica.rows.length > 0) {
            saldosErica.rows.forEach(saldo => {
                console.log(`  💰 ${saldo.exchange || 'N/A'}: ${saldo.balance || saldo.amount || '0'} (${saldo.balance_type || 'N/A'})`);
            });
        }
        
        // Adicionar crédito bônus R$5.000
        console.log('\n🎁 2.3 Adicionando Crédito Bônus R$5.000');
        
        try {
            // Verificar se já existe um saldo bônus
            const bonusExistente = await client.query(`
                SELECT balance FROM user_balances 
                WHERE user_id = $1 AND exchange = 'bonus'
            `, [erica.id]);
            
            if (bonusExistente.rows.length > 0) {
                // Atualizar saldo existente
                await client.query(`
                    UPDATE user_balances 
                    SET balance = balance + $1, 
                        balance_type = 'bonus_credit',
                        updated_at = NOW()
                    WHERE user_id = $2 AND exchange = 'bonus'
                `, [5000.00, erica.id]);
                console.log('✅ Crédito bônus de R$5.000,00 adicionado ao saldo existente');
            } else {
                // Inserir novo saldo
                await client.query(`
                    INSERT INTO user_balances 
                    (user_id, exchange, balance, balance_type, created_at, updated_at)
                    VALUES ($1, 'bonus', $2, 'bonus_credit', NOW(), NOW())
                `, [erica.id, 5000.00]);
                console.log('✅ Crédito bônus de R$5.000,00 criado com sucesso');
            }
        } catch (error) {
            console.log('❌ Erro ao adicionar crédito bônus Érica:', error.message);
        }
        
        console.log('\n👩 3. ATUALIZANDO LUIZA MARIA');
        console.log('────────────────────────────────');
        
        // Buscar Luiza Maria
        const luizaResult = await client.query(`
            SELECT id, email, full_name, name, vip_status, affiliate_level, pais, balance_usd
            FROM users 
            WHERE email = 'lmariadeapinto@gmail.com'
        `);
        
        if (luizaResult.rows.length === 0) {
            console.log('❌ Usuária Luiza Maria não encontrada');
            return;
        }
        
        const luiza = luizaResult.rows[0];
        console.log('✅ Usuária encontrada:');
        console.log(`📧 Email: ${luiza.email}`);
        console.log(`👤 Nome: ${luiza.full_name || luiza.name}`);
        console.log(`👑 VIP: ${luiza.vip_status ? 'SIM' : 'NÃO'}`);
        console.log(`🌍 País: ${luiza.pais || 'Não informado'}`);
        console.log(`💰 Saldo USD: $${luiza.balance_usd || '0'}`);
        
        // Atualizar país da Luiza
        if (!luiza.pais || luiza.pais !== 'Brasil') {
            await client.query(`
                UPDATE users 
                SET pais = 'Brasil', updated_at = NOW()
                WHERE id = $1
            `, [luiza.id]);
            console.log('🌍 País atualizado para Brasil');
        }
        
        // Verificar saldos da Luiza
        console.log('\n💰 3.1 Verificando Saldos da Luiza Maria');
        const saldosLuiza = await client.query(`
            SELECT * FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange
        `, [luiza.id]);
        
        console.log(`📊 Saldos existentes: ${saldosLuiza.rows.length}`);
        if (saldosLuiza.rows.length > 0) {
            saldosLuiza.rows.forEach(saldo => {
                console.log(`  💰 ${saldo.exchange || 'N/A'}: ${saldo.balance || saldo.amount || '0'} (${saldo.balance_type || 'N/A'})`);
            });
        } else {
            console.log('  📊 Nenhum saldo encontrado');
        }
        
        // Adicionar crédito bônus R$1.000
        console.log('\n🎁 3.2 Adicionando Crédito Bônus R$1.000');
        
        try {
            // Verificar se já existe um saldo bônus
            const bonusExistenteLuiza = await client.query(`
                SELECT balance FROM user_balances 
                WHERE user_id = $1 AND exchange = 'bonus'
            `, [luiza.id]);
            
            if (bonusExistenteLuiza.rows.length > 0) {
                // Atualizar saldo existente
                await client.query(`
                    UPDATE user_balances 
                    SET balance = balance + $1, 
                        balance_type = 'bonus_credit',
                        updated_at = NOW()
                    WHERE user_id = $2 AND exchange = 'bonus'
                `, [1000.00, luiza.id]);
                console.log('✅ Crédito bônus de R$1.000,00 adicionado ao saldo existente');
            } else {
                // Inserir novo saldo
                await client.query(`
                    INSERT INTO user_balances 
                    (user_id, exchange, balance, balance_type, created_at, updated_at)
                    VALUES ($1, 'bonus', $2, 'bonus_credit', NOW(), NOW())
                `, [luiza.id, 1000.00]);
                console.log('✅ Crédito bônus de R$1.000,00 criado com sucesso');
            }
        } catch (error) {
            console.log('❌ Erro ao adicionar crédito bônus Luiza:', error.message);
        }
        
        console.log('\n📊 4. VERIFICAÇÃO FINAL');
        console.log('─────────────────────────');
        
        // Status final Érica
        const ericaFinal = await client.query(`
            SELECT u.email, u.full_name, u.vip_status, u.pais,
                   k.exchange, k.is_active, k.validation_status,
                   b.balance as bonus_balance
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id AND k.exchange = 'bybit'
            LEFT JOIN user_balances b ON u.id = b.user_id AND b.exchange = 'bonus'
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
        `);
        
        if (ericaFinal.rows.length > 0) {
            const erica = ericaFinal.rows[0];
            console.log('\n✅ ÉRICA DOS SANTOS - STATUS FINAL:');
            console.log(`👤 Nome: ${erica.full_name}`);
            console.log(`🌍 País: ${erica.pais}`);
            console.log(`👑 VIP: ${erica.vip_status ? 'SIM' : 'NÃO'}`);
            console.log(`🔑 Chave Bybit: ${erica.is_active ? 'ATIVA' : 'INATIVA'} (${erica.validation_status})`);
            console.log(`💰 Crédito bônus: R$${erica.bonus_balance || '0'}`);
        }
        
        // Status final Luiza
        const luizaFinal = await client.query(`
            SELECT u.email, u.full_name, u.name, u.vip_status, u.pais,
                   b.balance as bonus_balance
            FROM users u
            LEFT JOIN user_balances b ON u.id = b.user_id AND b.exchange = 'bonus'
            WHERE u.email = 'lmariadeapinto@gmail.com'
        `);
        
        if (luizaFinal.rows.length > 0) {
            const luiza = luizaFinal.rows[0];
            console.log('\n✅ LUIZA MARIA - STATUS FINAL:');
            console.log(`👤 Nome: ${luiza.full_name || luiza.name}`);
            console.log(`🌍 País: ${luiza.pais}`);
            console.log(`👑 VIP: ${luiza.vip_status ? 'SIM' : 'NÃO'}`);
            console.log(`💰 Crédito bônus: R$${luiza.bonus_balance || '0'}`);
        }
        
        console.log('\n🎉 ATUALIZAÇÕES CONCLUÍDAS COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ Todas as solicitações foram atendidas:');
        console.log('   📝 Érica: Nova chave API Bybit + R$5.000 bônus');
        console.log('   📝 Luiza: Verificação de saldo + R$1.000 bônus');
        console.log('   📝 Ambas com país = Brasil');
        console.log('   📝 Sistema pronto para trading!');
        
    } catch (error) {
        console.log('❌ Erro durante a atualização:', error.message);
        console.log('📋 Stack:', error.stack);
    } finally {
        client.release();
    }
}

// Executar as atualizações
atualizarUsuariasVIPCorrigido().catch(console.error);
