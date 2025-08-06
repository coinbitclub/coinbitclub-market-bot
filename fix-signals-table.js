#!/usr/bin/env node
/**
 * 🔧 CORREÇÃO DA TABELA SIGNALS PARA WEBHOOKS
 * 
 * Script para ajustar a estrutura da tabela signals
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 CORREÇÃO DA TABELA SIGNALS PARA WEBHOOKS');
console.log('==========================================');

async function fixSignalsTable() {
    try {
        console.log('📊 1. Verificando estrutura atual da tabela signals...');
        
        const signalsColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'signals' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('Estrutura atual:');
        const existingColumns = [];
        signalsColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            existingColumns.push(col.column_name);
        });

        console.log('\n📝 2. Adicionando colunas necessárias...');
        
        // Adicionar coluna action se não existir
        if (!existingColumns.includes('action')) {
            console.log('➕ Adicionando coluna action...');
            await pool.query(`
                ALTER TABLE signals 
                ADD COLUMN action VARCHAR(20) DEFAULT 'UNKNOWN'
            `);
            console.log('✅ Coluna action adicionada');
        } else {
            console.log('✅ Coluna action já existe');
        }

        // Adicionar coluna quantity se não existir
        if (!existingColumns.includes('quantity')) {
            console.log('➕ Adicionando coluna quantity...');
            await pool.query(`
                ALTER TABLE signals 
                ADD COLUMN quantity DECIMAL(20, 8)
            `);
            console.log('✅ Coluna quantity adicionada');
        } else {
            console.log('✅ Coluna quantity já existe');
        }

        // Adicionar coluna timeframe se não existir
        if (!existingColumns.includes('timeframe')) {
            console.log('➕ Adicionando coluna timeframe...');
            await pool.query(`
                ALTER TABLE signals 
                ADD COLUMN timeframe VARCHAR(10)
            `);
            console.log('✅ Coluna timeframe adicionada');
        } else {
            console.log('✅ Coluna timeframe já existe');
        }

        // Adicionar coluna alert_message se não existir
        if (!existingColumns.includes('alert_message')) {
            console.log('➕ Adicionando coluna alert_message...');
            await pool.query(`
                ALTER TABLE signals 
                ADD COLUMN alert_message TEXT
            `);
            console.log('✅ Coluna alert_message adicionada');
        } else {
            console.log('✅ Coluna alert_message já existe');
        }

        // Adicionar coluna processed se não existir
        if (!existingColumns.includes('processed')) {
            console.log('➕ Adicionando coluna processed...');
            await pool.query(`
                ALTER TABLE signals 
                ADD COLUMN processed BOOLEAN DEFAULT false
            `);
            console.log('✅ Coluna processed adicionada');
        } else {
            console.log('✅ Coluna processed já existe');
        }

        // Adicionar coluna updated_at se não existir
        if (!existingColumns.includes('updated_at')) {
            console.log('➕ Adicionando coluna updated_at...');
            await pool.query(`
                ALTER TABLE signals 
                ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()
            `);
            console.log('✅ Coluna updated_at adicionada');
        } else {
            console.log('✅ Coluna updated_at já existe');
        }

        console.log('\n📋 3. Verificando estrutura final...');
        const finalColumns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'signals' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('Estrutura final:');
        finalColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });

        console.log('\n🧪 4. Testando inserção...');
        const testResult = await pool.query(`
            INSERT INTO signals (symbol, action, price, strategy, alert_message)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `, ['BTCUSDT', 'BUY', 45000.50, 'test-fix', 'Teste após correção']);
        
        console.log(`✅ Sinal de teste inserido com ID: ${testResult.rows[0].id}`);

        // Limpar teste
        await pool.query('DELETE FROM signals WHERE strategy = $1', ['test-fix']);
        console.log('🧹 Sinal de teste removido');

        console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('==================================');
        console.log('✅ Tabela signals corrigida');
        console.log('✅ Todas as colunas necessárias adicionadas');
        console.log('✅ Sistema pronto para receber webhooks');

    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar correção
fixSignalsTable().catch(console.error);
