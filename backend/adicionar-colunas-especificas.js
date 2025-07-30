#!/usr/bin/env node

/**
 * 🔧 ADICIONAR COLUNAS ESPECÍFICAS - COINBITCLUB MARKET BOT V3.0.0
 */

const { Pool } = require('pg');

async function adicionarColunasEspecificas() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 ADICIONANDO COLUNAS ESPECÍFICAS');
        
        // 1. Adicionar processing_time na ai_analysis
        try {
            await pool.query('ALTER TABLE ai_analysis ADD COLUMN IF NOT EXISTS processing_time INTEGER DEFAULT 0');
            console.log('✅ processing_time adicionada na ai_analysis');
        } catch (error) {
            console.log('⚠️ processing_time:', error.message);
        }
        
        // 2. Adicionar risk_level na user_risk_profiles
        try {
            await pool.query('ALTER TABLE user_risk_profiles ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT \'medium\'');
            console.log('✅ risk_level adicionada na user_risk_profiles');
        } catch (error) {
            console.log('⚠️ risk_level:', error.message);
        }
        
        console.log('🎉 COLUNAS ADICIONADAS COM SUCESSO!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

adicionarColunasEspecificas();
