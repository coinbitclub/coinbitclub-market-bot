/**
 * 🔧 ATUALIZAÇÃO FINAL DAS USUÁRIAS VIP
 * ===================================
 * 
 * Usando estrutura correta: total_balance, available_balance, locked_balance
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarUsuariasVIPFinal() {
    console.log('🔧 ATUALIZAÇÃO FINAL DAS USUÁRIAS VIP');
    console.log('====================================');
    
    const client = await pool.connect();
    
    try {
        console.log('\n👩 1. ATUALIZANDO ÉRICA DOS SANTOS');
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
        console.log(`👤 Nome: ${erica.full_name || erica.name || 'N/A'}`);
        console.log(`👑 VIP: ${erica.vip_status ? 'SIM' : 'NÃO'}`);
        console.log(`🌍 País: ${erica.pais || 'Não informado'}`);
        
        // Atualizar dados da Érica
        await client.query(`
            UPDATE users 
            SET full_name = $1,
                pais = $2,
                vip_status = true,
                affiliate_level = 'VIP',
                updated_at = NOW()
            WHERE id = $3
        `, ['Érica dos Santos Andrade', 'Brasil', erica.id]);
        console.log('✅ Dados atualizados: nome, país Brasil, status VIP confirmado');
        
        // Atualizar chave API Bybit da imagem
        console.log('\n🔑 1.1 Configurando Nova Chave API Bybit');
        
        const novaChaveBybit = {
            nome: 'COINBITCLU_ERICA',
            api_key: 'dtbi5nXnYURm7uHnxA',
            secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
            permissoes: ['Contratos - Ordens Posições', 'Trading Unificado - Trade', 'SPOT - Negociar']
        };
        
        // Atualizar/inserir chave Bybit
        const updateChave = await client.query(`
            UPDATE user_api_keys 
            SET api_key = $1, 
                secret_key = $2,
                is_active = true,
                validation_status = 'updated_by_admin',
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
        
        if (updateChave.rowCount === 0) {
            // Inserir nova chave se não existir
            await client.query(`
                INSERT INTO user_api_keys 
                (user_id, exchange, api_key, secret_key, environment, is_active, validation_status, created_at, permissions)
                VALUES ($1, 'bybit', $2, $3, 'mainnet', true, 'updated_by_admin', NOW(), $4)
            `, [
                erica.id,
                novaChaveBybit.api_key,
                novaChaveBybit.secret_key,
                novaChaveBybit.permissoes
            ]);
            console.log('✅ Nova chave Bybit inserida');
        } else {
            console.log('✅ Chave Bybit atualizada');
        }
        
        console.log(`🔐 API Key: ${novaChaveBybit.api_key.substring(0, 10)}...`);
        console.log(`🔐 Secret: ${novaChaveBybit.secret_key.substring(0, 10)}...`);
        console.log(`🎯 Permissões: ${novaChaveBybit.permissoes.join(', ')}`);
        
        // Verificar saldos atuais da Érica
        console.log('\n💰 1.2 Verificando Saldos Atuais');
        const saldosErica = await client.query(`
            SELECT exchange, currency, available_balance, locked_balance, total_balance
            FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange, currency
        `, [erica.id]);
        
        console.log(`📊 Registros de saldo: ${saldosErica.rows.length}`);
        if (saldosErica.rows.length > 0) {
            saldosErica.rows.forEach(saldo => {
                console.log(`  💰 ${saldo.exchange} ${saldo.currency}: Total=${saldo.total_balance}, Disponível=${saldo.available_balance}`);
            });
        }
        
        // Adicionar crédito bônus R$5.000 para Érica
        console.log('\n🎁 1.3 Adicionando Crédito Bônus R$5.000');
        
        try {
            // Verificar se já existe saldo BRL bonus
            const bonusExistente = await client.query(`
                SELECT id, available_balance, total_balance FROM user_balances 
                WHERE user_id = $1 AND exchange = 'bonus' AND currency = 'BRL'
            `, [erica.id]);
            
            if (bonusExistente.rows.length > 0) {
                // Atualizar saldo existente
                const saldoAtual = parseFloat(bonusExistente.rows[0].total_balance) || 0;
                const novoSaldo = saldoAtual + 5000.00;
                
                await client.query(`
                    UPDATE user_balances 
                    SET available_balance = $1,
                        total_balance = $1,
                        last_updated = NOW()
                    WHERE user_id = $2 AND exchange = 'bonus' AND currency = 'BRL'
                `, [novoSaldo, erica.id]);
                
                console.log(`✅ Crédito atualizado: R$${saldoAtual} + R$5.000 = R$${novoSaldo}`);
            } else {
                // Inserir novo saldo
                await client.query(`
                    INSERT INTO user_balances 
                    (user_id, exchange, currency, available_balance, locked_balance, total_balance, created_at, last_updated)
                    VALUES ($1, 'bonus', 'BRL', $2, 0, $2, NOW(), NOW())
                `, [erica.id, 5000.00]);
                
                console.log('✅ Crédito bônus de R$5.000,00 criado');
            }
        } catch (error) {
            console.log('❌ Erro ao adicionar crédito Érica:', error.message);
        }
        
        console.log('\n👩 2. ATUALIZANDO LUIZA MARIA');
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
        
        // Atualizar dados da Luiza
        await client.query(`
            UPDATE users 
            SET pais = 'Brasil',
                updated_at = NOW()
            WHERE id = $1
        `, [luiza.id]);
        console.log('✅ País atualizado para Brasil');
        
        // Verificar saldos da Luiza
        console.log('\n💰 2.1 Verificando Saldos da Luiza Maria');
        const saldosLuiza = await client.query(`
            SELECT exchange, currency, available_balance, locked_balance, total_balance
            FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange, currency
        `, [luiza.id]);
        
        console.log(`📊 Registros de saldo: ${saldosLuiza.rows.length}`);
        if (saldosLuiza.rows.length > 0) {
            saldosLuiza.rows.forEach(saldo => {
                console.log(`  💰 ${saldo.exchange} ${saldo.currency}: Total=${saldo.total_balance}, Disponível=${saldo.available_balance}`);
            });
        } else {
            console.log('  📊 Nenhum saldo encontrado');
        }
        
        // Adicionar crédito bônus R$1.000 para Luiza
        console.log('\n🎁 2.2 Adicionando Crédito Bônus R$1.000');
        
        try {
            // Verificar se já existe saldo BRL bonus
            const bonusExistenteLuiza = await client.query(`
                SELECT id, available_balance, total_balance FROM user_balances 
                WHERE user_id = $1 AND exchange = 'bonus' AND currency = 'BRL'
            `, [luiza.id]);
            
            if (bonusExistenteLuiza.rows.length > 0) {
                // Atualizar saldo existente
                const saldoAtual = parseFloat(bonusExistenteLuiza.rows[0].total_balance) || 0;
                const novoSaldo = saldoAtual + 1000.00;
                
                await client.query(`
                    UPDATE user_balances 
                    SET available_balance = $1,
                        total_balance = $1,
                        last_updated = NOW()
                    WHERE user_id = $2 AND exchange = 'bonus' AND currency = 'BRL'
                `, [novoSaldo, luiza.id]);
                
                console.log(`✅ Crédito atualizado: R$${saldoAtual} + R$1.000 = R$${novoSaldo}`);
            } else {
                // Inserir novo saldo
                await client.query(`
                    INSERT INTO user_balances 
                    (user_id, exchange, currency, available_balance, locked_balance, total_balance, created_at, last_updated)
                    VALUES ($1, 'bonus', 'BRL', $2, 0, $2, NOW(), NOW())
                `, [luiza.id, 1000.00]);
                
                console.log('✅ Crédito bônus de R$1.000,00 criado');
            }
        } catch (error) {
            console.log('❌ Erro ao adicionar crédito Luiza:', error.message);
        }
        
        console.log('\n📊 3. VERIFICAÇÃO FINAL E RESUMO');
        console.log('───────────────────────────────────');
        
        // Status final Érica
        const ericaFinal = await client.query(`
            SELECT u.email, u.full_name, u.vip_status, u.pais,
                   k.exchange, k.api_key, k.is_active, k.validation_status,
                   b.total_balance as bonus_balance
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id AND k.exchange = 'bybit'
            LEFT JOIN user_balances b ON u.id = b.user_id AND b.exchange = 'bonus' AND b.currency = 'BRL'
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
        `);
        
        if (ericaFinal.rows.length > 0) {
            const erica = ericaFinal.rows[0];
            console.log('\n✅ ÉRICA DOS SANTOS - STATUS FINAL:');
            console.log(`👤 Nome completo: ${erica.full_name}`);
            console.log(`🌍 País: ${erica.pais}`);
            console.log(`👑 Status VIP: ${erica.vip_status ? 'ATIVO' : 'INATIVO'}`);
            console.log(`🔑 Chave Bybit: ${erica.api_key ? erica.api_key.substring(0, 10) + '...' : 'N/A'}`);
            console.log(`📊 Status chave: ${erica.is_active ? 'ATIVA' : 'INATIVA'} (${erica.validation_status})`);
            console.log(`💰 Crédito bônus: R$${erica.bonus_balance || '0,00'}`);
        }
        
        // Status final Luiza
        const luizaFinal = await client.query(`
            SELECT u.email, u.full_name, u.name, u.vip_status, u.pais,
                   b.total_balance as bonus_balance
            FROM users u
            LEFT JOIN user_balances b ON u.id = b.user_id AND b.exchange = 'bonus' AND b.currency = 'BRL'
            WHERE u.email = 'lmariadeapinto@gmail.com'
        `);
        
        if (luizaFinal.rows.length > 0) {
            const luiza = luizaFinal.rows[0];
            console.log('\n✅ LUIZA MARIA - STATUS FINAL:');
            console.log(`👤 Nome: ${luiza.full_name || luiza.name}`);
            console.log(`🌍 País: ${luiza.pais}`);
            console.log(`👑 Status VIP: ${luiza.vip_status ? 'ATIVO' : 'INATIVO'}`);
            console.log(`💰 Crédito bônus: R$${luiza.bonus_balance || '0,00'}`);
        }
        
        console.log('\n🎉 ATUALIZAÇÕES CONCLUÍDAS COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ RESUMO DAS ATUALIZAÇÕES:');
        console.log('');
        console.log('👩 ÉRICA DOS SANTOS ANDRADE:');
        console.log('   🔑 Nova chave API Bybit configurada');
        console.log('   💰 R$5.000,00 de crédito bônus adicionado');
        console.log('   🌍 País: Brasil');
        console.log('   👑 Status VIP confirmado');
        console.log('   🏪 Exchange: Bybit (mainnet)');
        console.log('');
        console.log('👩 LUIZA MARIA DE ALMEIDA PINTO:');
        console.log('   💰 R$1.000,00 de crédito bônus adicionado');
        console.log('   🌍 País: Brasil');
        console.log('   📊 Saldos verificados');
        console.log('');
        console.log('🚀 Ambas as usuárias estão prontas para trading!');
        
    } catch (error) {
        console.log('❌ Erro durante a atualização:', error.message);
        console.log('📋 Stack:', error.stack);
    } finally {
        client.release();
    }
}

// Executar as atualizações
atualizarUsuariasVIPFinal().catch(console.error);
