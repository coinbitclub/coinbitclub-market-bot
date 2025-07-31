#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:axCgNhGhEqcCxZmCMRQOGCgPNfAJQFNl@junction.proxy.rlwy.net:15094/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function corrigirSchemaCritico() {
    console.log('🔧 CORRIGINDO SCHEMA CRÍTICO DO BANCO DE DADOS');
    console.log('=================================================');

    try {
        // 1. Adicionar coluna quantity na tabela trading_signals
        console.log('1️⃣ Verificando/Adicionando coluna quantity em trading_signals...');
        try {
            await pool.query(`
                ALTER TABLE trading_signals 
                ADD COLUMN IF NOT EXISTS quantity DECIMAL(20,8) DEFAULT 0.001
            `);
            console.log('✅ Coluna quantity adicionada/verificada');
        } catch (error) {
            console.log('⚠️ Erro ao adicionar quantity:', error.message);
        }

        // 2. Adicionar coluna balance na tabela users
        console.log('2️⃣ Verificando/Adicionando coluna balance em users...');
        try {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS balance DECIMAL(20,8) DEFAULT 1000.00
            `);
            console.log('✅ Coluna balance adicionada/verificada');
        } catch (error) {
            console.log('⚠️ Erro ao adicionar balance:', error.message);
        }

        // 3. Adicionar outras colunas essenciais em trading_signals
        console.log('3️⃣ Verificando outras colunas essenciais...');
        
        const colunasEssenciais = [
            'timestamp_signal TIMESTAMP DEFAULT NOW()',
            'price DECIMAL(20,8) DEFAULT 0',
            'stop_loss DECIMAL(20,8) DEFAULT 0',
            'take_profit DECIMAL(20,8) DEFAULT 0',
            'leverage INTEGER DEFAULT 1',
            'processed BOOLEAN DEFAULT FALSE',
            'validation_passed BOOLEAN DEFAULT FALSE',
            'error_message TEXT'
        ];

        for (const coluna of colunasEssenciais) {
            try {
                const [nomeColuna] = coluna.split(' ');
                await pool.query(`
                    ALTER TABLE trading_signals 
                    ADD COLUMN IF NOT EXISTS ${coluna}
                `);
                console.log(`   ✅ ${nomeColuna} verificada`);
            } catch (error) {
                console.log(`   ⚠️ Erro em ${coluna}:`, error.message);
            }
        }

        // 4. Verificar estrutura atual das tabelas
        console.log('\n4️⃣ Verificando estrutura das tabelas:');
        
        // Estrutura trading_signals
        const signalsStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📊 ESTRUTURA trading_signals:');
        signalsStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (null: ${col.is_nullable}, default: ${col.column_default})`);
        });

        // Estrutura users
        const usersStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        console.log('\n👥 ESTRUTURA users:');
        usersStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (null: ${col.is_nullable}, default: ${col.column_default})`);
        });

        // 5. Atualizar usuários com saldo inicial
        console.log('\n5️⃣ Atualizando saldos de usuários...');
        await pool.query(`
            UPDATE users 
            SET balance = 1000.00 
            WHERE balance IS NULL OR balance = 0
        `);
        
        const usuariosComSaldo = await pool.query(`
            SELECT id, name, balance 
            FROM users 
            WHERE balance > 0
        `);
        
        console.log(`✅ ${usuariosComSaldo.rows.length} usuários com saldo configurado:`);
        usuariosComSaldo.rows.forEach(user => {
            console.log(`   - ${user.name}: $${user.balance}`);
        });

        // 6. Verificar sinais pendentes
        console.log('\n6️⃣ Verificando sinais pendentes...');
        const sinaisPendentes = await pool.query(`
            SELECT id, symbol, side, quantity, price, processed, validation_passed, created_at
            FROM trading_signals 
            WHERE processed = FALSE OR validation_passed = FALSE
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        console.log(`📡 ${sinaisPendentes.rows.length} sinais pendentes encontrados:`);
        sinaisPendentes.rows.forEach(signal => {
            console.log(`   - ${signal.symbol} ${signal.side}: qty=${signal.quantity}, processed=${signal.processed}, valid=${signal.validation_passed}`);
        });

        console.log('\n✅ CORREÇÃO DE SCHEMA CONCLUÍDA COM SUCESSO!');
        console.log('🚀 O sistema agora deve processar webhooks corretamente');

    } catch (error) {
        console.error('❌ Erro crítico na correção do schema:', error);
    } finally {
        await pool.end();
    }
}

// Executar correção
corrigirSchemaCritico();
