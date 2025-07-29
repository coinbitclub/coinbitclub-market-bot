/**
 * 🔧 ATUALIZAÇÃO DE USUÁRIAS VIP - ÉRICA E LUIZA MARIA
 * ==================================================
 * 
 * Atualizando:
 * - Érica dos Santos: Nova chave API Bybit + R$5.000 crédito bônus
 * - Luiza Maria: Verificar saldo + R$1.000 crédito bônus
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarUsuariasVIP() {
    console.log('🔧 ATUALIZAÇÃO DE USUÁRIAS VIP - ÉRICA E LUIZA MARIA');
    console.log('==================================================');
    
    const client = await pool.connect();
    
    try {
        console.log('\n👩 1. ATUALIZANDO ÉRICA DOS SANTOS');
        console.log('─────────────────────────────────────');
        
        // Buscar Érica dos Santos
        const ericaResult = await client.query(`
            SELECT id, email, full_name, vip_status, affiliate_level, pais
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
        console.log(`👤 Nome: ${erica.full_name}`);
        console.log(`👑 VIP: ${erica.vip_status ? 'SIM' : 'NÃO'}`);
        console.log(`🌍 País: ${erica.pais || 'Não informado'}`);
        
        // Atualizar dados do país se necessário
        if (!erica.pais || erica.pais !== 'Brasil') {
            await client.query(`
                UPDATE users 
                SET pais = 'Brasil'
                WHERE id = $1
            `, [erica.id]);
            console.log('🌍 País atualizado para Brasil');
        }
        
        // Verificar chaves API existentes
        const chavesExistentes = await client.query(`
            SELECT id, exchange, api_key, is_active, validation_status
            FROM user_api_keys 
            WHERE user_id = $1
        `, [erica.id]);
        
        console.log(`\n🔑 Chaves API existentes: ${chavesExistentes.rows.length}`);
        chavesExistentes.rows.forEach(chave => {
            console.log(`  🏪 ${chave.exchange}: ${chave.is_active ? 'ATIVA' : 'INATIVA'} (${chave.validation_status})`);
        });
        
        // Dados da nova chave API Bybit da imagem
        const novaChaveBybit = {
            nome: 'COINBITCLU_ERICA',
            api_key: 'dtbi5nXnYURm7uHnxA',
            secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC',
            permissoes: 'Contratos - Ordens Posições, Trading Unificado - Trade, SPOT - Negociar'
        };
        
        // Atualizar ou inserir nova chave Bybit
        const chaveBybitExistente = chavesExistentes.rows.find(c => c.exchange === 'bybit');
        
        if (chaveBybitExistente) {
            // Atualizar chave existente
            await client.query(`
                UPDATE user_api_keys 
                SET api_key = $1, 
                    secret_key = $2,
                    is_active = true,
                    validation_status = 'updated',
                    updated_at = NOW(),
                    permissions = $3
                WHERE id = $4
            `, [
                novaChaveBybit.api_key,
                novaChaveBybit.secret_key,
                `{${novaChaveBybit.permissoes}}`,
                chaveBybitExistente.id
            ]);
            console.log('✅ Chave Bybit atualizada com sucesso');
        } else {
            // Inserir nova chave
            await client.query(`
                INSERT INTO user_api_keys 
                (user_id, exchange, api_key, secret_key, environment, is_active, validation_status, created_at, permissions)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
            `, [
                erica.id,
                'bybit',
                novaChaveBybit.api_key,
                novaChaveBybit.secret_key,
                'mainnet',
                true,
                'pending_validation',
                `{${novaChaveBybit.permissoes}}`
            ]);
            console.log('✅ Nova chave Bybit inserida com sucesso');
        }
        
        // Verificar saldo atual da Érica
        console.log('\n💰 1.1 Verificando Saldos Atuais da Érica');
        const saldosErica = await client.query(`
            SELECT * FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange, symbol
        `, [erica.id]);
        
        console.log(`📊 Saldos existentes: ${saldosErica.rows.length}`);
        saldosErica.rows.forEach(saldo => {
            console.log(`  💰 ${saldo.exchange || 'N/A'} ${saldo.symbol || saldo.asset || 'N/A'}: ${saldo.balance || saldo.amount || '0'}`);
        });
        
        // Adicionar crédito bônus de R$5.000 para Érica
        console.log('\n🎁 1.2 Adicionando Crédito Bônus R$5.000');
        
        try {
            await client.query(`
                INSERT INTO user_balances 
                (user_id, exchange, symbol, balance, balance_type, currency, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [
                erica.id,
                'bonus',
                'BRL',
                5000.00,
                'bonus_credit',
                'BRL'
            ]);
            console.log('✅ Crédito bônus de R$5.000,00 adicionado com sucesso');
        } catch (error) {
            console.log('⚠️ Erro ao adicionar crédito bônus (pode já existir):', error.message);
            
            // Tentar atualizar se já existir
            try {
                await client.query(`
                    UPDATE user_balances 
                    SET balance = balance + $1, updated_at = NOW()
                    WHERE user_id = $2 AND exchange = 'bonus' AND symbol = 'BRL'
                `, [5000.00, erica.id]);
                console.log('✅ Crédito bônus atualizado (somado aos existentes)');
            } catch (updateError) {
                console.log('❌ Erro ao atualizar crédito:', updateError.message);
            }
        }
        
        console.log('\n👩 2. VERIFICANDO E ATUALIZANDO LUIZA MARIA');
        console.log('──────────────────────────────────────────');
        
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
        
        // Verificar saldos da Luiza
        console.log('\n💰 2.1 Verificando Saldos da Luiza Maria');
        const saldosLuiza = await client.query(`
            SELECT * FROM user_balances 
            WHERE user_id = $1
            ORDER BY exchange, symbol
        `, [luiza.id]);
        
        console.log(`📊 Saldos existentes: ${saldosLuiza.rows.length}`);
        if (saldosLuiza.rows.length > 0) {
            saldosLuiza.rows.forEach(saldo => {
                console.log(`  💰 ${saldo.exchange || 'N/A'} ${saldo.symbol || saldo.asset || 'N/A'}: ${saldo.balance || saldo.amount || '0'}`);
            });
        } else {
            console.log('  📊 Nenhum saldo encontrado');
        }
        
        // Adicionar crédito bônus de R$1.000 para Luiza
        console.log('\n🎁 2.2 Adicionando Crédito Bônus R$1.000');
        
        try {
            await client.query(`
                INSERT INTO user_balances 
                (user_id, exchange, symbol, balance, balance_type, currency, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [
                luiza.id,
                'bonus',
                'BRL',
                1000.00,
                'bonus_credit',
                'BRL'
            ]);
            console.log('✅ Crédito bônus de R$1.000,00 adicionado com sucesso');
        } catch (error) {
            console.log('⚠️ Erro ao adicionar crédito bônus (pode já existir):', error.message);
            
            // Tentar atualizar se já existir
            try {
                await client.query(`
                    UPDATE user_balances 
                    SET balance = balance + $1, updated_at = NOW()
                    WHERE user_id = $2 AND exchange = 'bonus' AND symbol = 'BRL'
                `, [1000.00, luiza.id]);
                console.log('✅ Crédito bônus atualizado (somado aos existentes)');
            } catch (updateError) {
                console.log('❌ Erro ao atualizar crédito:', updateError.message);
            }
        }
        
        // Atualizar país da Luiza se necessário
        if (!luiza.pais || luiza.pais !== 'Brasil') {
            await client.query(`
                UPDATE users 
                SET pais = 'Brasil'
                WHERE id = $1
            `, [luiza.id]);
            console.log('🌍 País da Luiza atualizado para Brasil');
        }
        
        console.log('\n📊 3. VERIFICAÇÃO FINAL DAS ATUALIZAÇÕES');
        console.log('────────────────────────────────────────');
        
        // Verificar Érica atualizada
        console.log('\n👩 3.1 Status Final - Érica dos Santos');
        const ericaFinal = await client.query(`
            SELECT u.email, u.full_name, u.vip_status, u.pais,
                   k.exchange, k.api_key, k.is_active, k.validation_status
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
        `);
        
        if (ericaFinal.rows.length > 0) {
            const erica = ericaFinal.rows[0];
            console.log(`✅ ${erica.full_name}`);
            console.log(`🌍 País: ${erica.pais}`);
            console.log(`👑 VIP: ${erica.vip_status ? 'SIM' : 'NÃO'}`);
            console.log(`🔑 Chave ${erica.exchange}: ${erica.is_active ? 'ATIVA' : 'INATIVA'}`);
        }
        
        const saldosEricaFinal = await client.query(`
            SELECT * FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bonus'
        `, [erica.id]);
        
        if (saldosEricaFinal.rows.length > 0) {
            console.log(`💰 Crédito bônus: R$${saldosEricaFinal.rows[0].balance}`);
        }
        
        // Verificar Luiza atualizada
        console.log('\n👩 3.2 Status Final - Luiza Maria');
        const luizaFinal = await client.query(`
            SELECT email, full_name, name, vip_status, pais
            FROM users 
            WHERE email = 'lmariadeapinto@gmail.com'
        `);
        
        if (luizaFinal.rows.length > 0) {
            const luiza = luizaFinal.rows[0];
            console.log(`✅ ${luiza.full_name || luiza.name}`);
            console.log(`🌍 País: ${luiza.pais}`);
            console.log(`👑 VIP: ${luiza.vip_status ? 'SIM' : 'NÃO'}`);
        }
        
        const saldosLuizaFinal = await client.query(`
            SELECT * FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bonus'
        `, [luiza.id]);
        
        if (saldosLuizaFinal.rows.length > 0) {
            console.log(`💰 Crédito bônus: R$${saldosLuizaFinal.rows[0].balance}`);
        }
        
        console.log('\n🎉 ATUALIZAÇÕES CONCLUÍDAS COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ Érica dos Santos:');
        console.log('   - Nova chave API Bybit configurada');
        console.log('   - R$5.000,00 de crédito bônus adicionado');
        console.log('   - País definido como Brasil');
        console.log('✅ Luiza Maria:');
        console.log('   - R$1.000,00 de crédito bônus adicionado');
        console.log('   - País definido como Brasil');
        console.log('✅ Ambas as usuárias estão configuradas para trading');
        
    } catch (error) {
        console.log('❌ Erro durante a atualização:', error.message);
        console.log('📋 Stack:', error.stack);
    } finally {
        client.release();
    }
}

// Executar as atualizações
atualizarUsuariasVIP().catch(console.error);
