#!/usr/bin/env node

/**
 * 🔧 CORRETOR FINAL COLUNAS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Corrige as últimas colunas faltantes nas tabelas
 */

const { Pool } = require('pg');

async function corrigirColunasFaltantes() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Corrigindo colunas faltantes...');
        
        // Corrigir coluna output_data na ai_analysis
        console.log('📝 Adicionando coluna output_data na ai_analysis...');
        await pool.query(`
            ALTER TABLE ai_analysis 
            ADD COLUMN IF NOT EXISTS output_data JSONB DEFAULT '{}'
        `);
        
        // Corrigir coluna is_active na risk_alerts
        console.log('📝 Adicionando coluna is_active na risk_alerts...');
        await pool.query(`
            ALTER TABLE risk_alerts 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
        `);
        
        // Verificar se users tem is_active
        console.log('📝 Verificando coluna is_active em users...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
        `);
        
        console.log('✅ Todas as colunas faltantes foram adicionadas!');

    } catch (error) {
        console.error('❌ Erro ao corrigir colunas:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    corrigirColunasFaltantes()
        .then(() => {
            console.log('🎉 Correção de colunas concluída!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Falha na correção:', error.message);
            process.exit(1);
        });
}

module.exports = { corrigirColunasFaltantes };
