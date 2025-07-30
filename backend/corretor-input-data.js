#!/usr/bin/env node

/**
 * 🔧 CORRETOR INPUT_DATA - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Script para adicionar a coluna input_data com default
 */

const { Pool } = require('pg');

async function corrigirInputData() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Adicionando coluna input_data...');
        
        // Adicionar coluna com default
        await pool.query(`
            ALTER TABLE ai_analysis 
            ADD COLUMN input_data JSONB DEFAULT '{}'::jsonb
        `);
        
        console.log('✅ Coluna input_data adicionada com sucesso!');
        
        // Testar inserção
        await pool.query(`
            INSERT INTO ai_analysis (symbol, analysis_type, input_data, confidence_score, recommendation)
            VALUES ('BTCUSDT', 'test', '{"test": true}', 0.85, 'buy')
        `);
        
        await pool.query(`DELETE FROM ai_analysis WHERE analysis_type = 'test'`);
        console.log('✅ Teste de inserção: OK');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

corrigirInputData();
