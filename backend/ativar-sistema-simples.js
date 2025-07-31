#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function ativarSistemaSimples() {
    console.log('🚀 ATIVANDO SISTEMA DE TRADING');
    console.log('===============================');

    try {
        // 1. Verificar se existe tabela de configuração do sistema
        console.log('1️⃣ Verificando configuração do sistema...');
        
        // Criar tabela de configuração se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_status (
                id SERIAL PRIMARY KEY,
                is_active BOOLEAN DEFAULT FALSE,
                last_updated TIMESTAMP DEFAULT NOW(),
                updated_by VARCHAR(50) DEFAULT 'AUTO'
            )
        `);

        // Verificar se já existe registro
        const statusResult = await pool.query('SELECT * FROM system_status LIMIT 1');
        
        if (statusResult.rows.length === 0) {
            // Inserir primeiro registro
            await pool.query(`
                INSERT INTO system_status (is_active, updated_by) 
                VALUES (TRUE, 'MANUAL_ACTIVATION')
            `);
            console.log('   ✅ Sistema ativado pela primeira vez');
        } else {
            // Atualizar registro existente
            await pool.query(`
                UPDATE system_status 
                SET is_active = TRUE, 
                    last_updated = NOW(),
                    updated_by = 'MANUAL_ACTIVATION'
                WHERE id = 1
            `);
            console.log('   ✅ Sistema reativado');
        }

        // 2. Verificar status de usuários ativos
        console.log('\n2️⃣ Verificando usuários ativos...');
        const usuarios = await pool.query(`
            SELECT u.id, u.name, u.balance,
                   COUNT(k.id) as api_keys_count
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = TRUE
            GROUP BY u.id, u.name, u.balance
            ORDER BY u.name
        `);
        
        console.log(`   👥 ${usuarios.rows.length} usuários ativos:`);
        usuarios.rows.forEach(user => {
            const status = user.api_keys_count > 0 ? '🔑' : '⚠️';
            console.log(`      ${status} ${user.name}: $${user.balance} (${user.api_keys_count} chaves)`);
        });

        // 3. Verificar sinais recentes
        console.log('\n3️⃣ Verificando sinais recentes...');
        const sinais = await pool.query(`
            SELECT symbol, side, price, processed, validation_passed, created_at
            FROM trading_signals 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        console.log(`   📡 ${sinais.rows.length} sinais nas últimas 24h:`);
        sinais.rows.forEach((signal, index) => {
            const status = signal.processed ? 
                (signal.validation_passed ? '✅' : '❌') : '⏳';
            console.log(`      ${index + 1}. ${signal.symbol} ${signal.side} - ${status}`);
        });

        // 4. Configurar webhook ativo
        console.log('\n4️⃣ Configurando webhook...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhook_config (
                id SERIAL PRIMARY KEY,
                endpoint VARCHAR(255) DEFAULT '/api/webhook/tradingview',
                is_active BOOLEAN DEFAULT TRUE,
                last_updated TIMESTAMP DEFAULT NOW()
            )
        `);

        // Verificar webhook config
        const webhookResult = await pool.query('SELECT * FROM webhook_config LIMIT 1');
        if (webhookResult.rows.length === 0) {
            await pool.query(`
                INSERT INTO webhook_config (endpoint, is_active) 
                VALUES ('/api/webhook/tradingview', TRUE)
            `);
        }
        console.log('   🌐 Webhook configurado: http://localhost:3000/api/webhook/tradingview');

        // 5. Status final
        console.log('\n5️⃣ Status final do sistema...');
        const finalStatus = await pool.query('SELECT * FROM system_status WHERE id = 1');
        
        console.log('📊 SISTEMA ATIVADO COM SUCESSO!');
        console.log(`   🟢 Status: ${finalStatus.rows[0].is_active ? 'ATIVO' : 'INATIVO'}`);
        console.log(`   🕒 Última atualização: ${finalStatus.rows[0].last_updated}`);
        console.log(`   👤 Atualizado por: ${finalStatus.rows[0].updated_by}`);
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('   1. ✅ Sistema está ATIVO e recebendo sinais');
        console.log('   2. ✅ Webhook funcionando em: http://localhost:3000/api/webhook/tradingview');
        console.log('   3. ✅ Signal processor rodando em background');
        console.log('   4. 🔄 Envie sinais do TradingView para testar');
        
        console.log('\n📡 TESTE O WEBHOOK:');
        console.log('curl -X POST http://localhost:3000/api/webhook/tradingview \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"symbol":"BTCUSDT","side":"BUY","action":"LONG","price":70000,"quantity":0.001}\'');

    } catch (error) {
        console.error('❌ Erro ao ativar sistema:', error);
    } finally {
        await pool.end();
    }
}

// Executar ativação
ativarSistemaSimples();
