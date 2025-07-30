#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO DE TABELAS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Verificar o estado atual das tabelas e corrigir problemas
 */

const { Pool } = require('pg');

async function diagnosticarTabelas() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 DIAGNÓSTICO DE TABELAS DO SISTEMA');
        console.log('====================================');
        
        // 1. Listar todas as tabelas existentes
        const tabelas = await listarTabelasExistentes(pool);
        console.log(`\n📊 Tabelas encontradas: ${tabelas.length}`);
        
        // 2. Verificar estrutura de cada tabela importante
        await verificarTabelasEssenciais(pool, tabelas);
        
        // 3. Criar tabelas faltantes de forma segura
        await criarTabelasFaltantesSeguro(pool);
        
        // 4. Relatório final
        await gerarRelatorioFinal(pool);

    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

async function listarTabelasExistentes(pool) {
    const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas existentes:');
    result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
    });
    
    return result.rows.map(row => row.table_name);
}

async function verificarTabelasEssenciais(pool, tabelasExistentes) {
    const tabelasEssenciais = [
        'users', 'user_api_keys', 'signals', 'trading_operations',
        'ai_analysis', 'risk_alerts', 'user_risk_profiles'
    ];
    
    console.log('\n🔍 Verificando tabelas essenciais:');
    
    for (const tabela of tabelasEssenciais) {
        if (tabelasExistentes.includes(tabela)) {
            console.log(`   ✅ ${tabela} - existe`);
            await verificarColunasTabela(pool, tabela);
        } else {
            console.log(`   ❌ ${tabela} - FALTANTE`);
        }
    }
}

async function verificarColunasTabela(pool, nomeTabela) {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        `, [nomeTabela]);
        
        console.log(`      📋 ${nomeTabela}: ${result.rows.length} colunas`);
        
        // Verificar colunas específicas importantes
        const colunas = result.rows.map(row => row.column_name);
        
        if (nomeTabela === 'ai_analysis') {
            const colunasRequeridas = ['output_data', 'is_active'];
            colunasRequeridas.forEach(col => {
                if (!colunas.includes(col)) {
                    console.log(`         ⚠️ Coluna faltante: ${col}`);
                }
            });
        }
        
    } catch (error) {
        console.log(`      ❌ Erro ao verificar ${nomeTabela}: ${error.message}`);
    }
}

async function criarTabelasFaltantesSeguro(pool) {
    console.log('\n🏗️ Criando tabelas faltantes de forma segura:');
    
    // Tabela de configurações do sistema
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_configurations (
                id SERIAL PRIMARY KEY,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value TEXT NOT NULL,
                config_type VARCHAR(50) DEFAULT 'general',
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ system_configurations criada');
    } catch (error) {
        console.log(`   ⚠️ system_configurations: ${error.message}`);
    }
    
    // Tabela de notificações
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                notification_type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ notifications criada');
    } catch (error) {
        console.log(`   ⚠️ notifications: ${error.message}`);
    }
    
    // Tabela de logs do sistema
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                log_level VARCHAR(20) NOT NULL,
                component VARCHAR(100),
                message TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ system_logs criada');
    } catch (error) {
        console.log(`   ⚠️ system_logs: ${error.message}`);
    }
    
    // Tabela de sessões de usuário
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                session_token VARCHAR(64) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
                is_active BOOLEAN DEFAULT true
            )
        `);
        console.log('   ✅ user_sessions criada');
    } catch (error) {
        console.log(`   ⚠️ user_sessions: ${error.message}`);
    }
    
    // Tabela de preferências do usuário
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE,
                theme VARCHAR(20) DEFAULT 'light',
                language VARCHAR(10) DEFAULT 'pt',
                notifications_enabled BOOLEAN DEFAULT true,
                trading_alerts BOOLEAN DEFAULT true,
                email_notifications BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('   ✅ user_preferences criada');
    } catch (error) {
        console.log(`   ⚠️ user_preferences: ${error.message}`);
    }
    
    // Índices importantes
    try {
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
            CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
        `);
        console.log('   ✅ Índices criados');
    } catch (error) {
        console.log(`   ⚠️ Índices: ${error.message}`);
    }
}

async function gerarRelatorioFinal(pool) {
    console.log('\n📊 RELATÓRIO FINAL DE TABELAS');
    console.log('==============================');
    
    // Contar total de tabelas
    const totalTabelas = await pool.query(`
        SELECT COUNT(*) as total 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    
    // Contar total de colunas
    const totalColunas = await pool.query(`
        SELECT COUNT(*) as total 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
    `);
    
    // Contar total de índices
    const totalIndices = await pool.query(`
        SELECT COUNT(*) as total 
        FROM pg_indexes 
        WHERE schemaname = 'public'
    `);
    
    console.log(`📋 Total de tabelas: ${totalTabelas.rows[0].total}`);
    console.log(`📝 Total de colunas: ${totalColunas.rows[0].total}`);
    console.log(`🔍 Total de índices: ${totalIndices.rows[0].total}`);
    
    // Verificar integridade das tabelas principais
    const tabelasPrincipais = [
        'users', 'user_api_keys', 'signals', 'trading_operations',
        'ai_analysis', 'risk_alerts', 'user_risk_profiles'
    ];
    
    let tabelasOK = 0;
    for (const tabela of tabelasPrincipais) {
        try {
            await pool.query(`SELECT 1 FROM ${tabela} LIMIT 1`);
            tabelasOK++;
        } catch (error) {
            console.log(`⚠️ Problema com tabela ${tabela}`);
        }
    }
    
    const porcentagem = ((tabelasOK / tabelasPrincipais.length) * 100).toFixed(1);
    console.log(`\n🎯 Status das tabelas principais: ${tabelasOK}/${tabelasPrincipais.length} (${porcentagem}%)`);
    
    if (porcentagem >= 95) {
        console.log('🟢 STATUS: EXCELENTE - Sistema completo!');
    } else if (porcentagem >= 80) {
        console.log('🟡 STATUS: BOM - Algumas melhorias necessárias');
    } else {
        console.log('🔴 STATUS: REQUER ATENÇÃO - Problemas detectados');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    diagnosticarTabelas()
        .then(() => {
            console.log('\n🎉 DIAGNÓSTICO CONCLUÍDO!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Falha no diagnóstico:', error.message);
            process.exit(1);
        });
}

module.exports = { diagnosticarTabelas };
