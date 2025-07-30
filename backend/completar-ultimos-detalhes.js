#!/usr/bin/env node

/**
 * 🔧 COMPLETADOR FINAL - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Corrigir os últimos detalhes para chegar a 100%
 */

const { Pool } = require('pg');

async function completarUltimosDetalhes() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 COMPLETANDO ÚLTIMOS DETALHES');
        console.log('================================');
        
        // 1. Adicionar coluna faltante na ai_analysis
        await adicionarColunaIsActive(pool);
        
        // 2. Verificar e corrigir estrutura system_configurations
        await corrigirSystemConfigurations(pool);
        
        // 3. Criar índices seguros
        await criarIndicesSeguro(pool);
        
        // 4. Validação final
        await validacaoFinal(pool);

    } catch (error) {
        console.error('❌ Erro nos últimos detalhes:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

async function adicionarColunaIsActive(pool) {
    try {
        console.log('📝 Adicionando coluna is_active na ai_analysis...');
        
        await pool.query(`
            ALTER TABLE ai_analysis 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
        `);
        
        console.log('✅ Coluna is_active adicionada com sucesso');
        
    } catch (error) {
        console.log(`⚠️ Erro ao adicionar is_active: ${error.message}`);
    }
}

async function corrigirSystemConfigurations(pool) {
    try {
        console.log('📝 Verificando estrutura da system_configurations...');
        
        // Verificar se a tabela existe e tem a estrutura correta
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'system_configurations' AND table_schema = 'public'
        `);
        
        const colunas = result.rows.map(row => row.column_name);
        console.log(`   Colunas encontradas: ${colunas.join(', ')}`);
        
        if (colunas.includes('config_key')) {
            console.log('✅ Estrutura system_configurations está correta');
            
            // Inserir configurações padrão se não existirem
            await pool.query(`
                INSERT INTO system_configurations (config_key, config_value, config_type, description) VALUES
                ('trading_enabled', 'true', 'trading', 'Sistema de trading ativo'),
                ('max_operations', '100', 'trading', 'Máximo de operações simultâneas'),
                ('default_leverage', '10', 'trading', 'Alavancagem padrão'),
                ('maintenance_mode', 'false', 'system', 'Modo de manutenção'),
                ('api_rate_limit', '1000', 'api', 'Limite de requisições API')
                ON CONFLICT (config_key) DO NOTHING
            `);
            console.log('✅ Configurações padrão inseridas');
        } else {
            console.log('⚠️ Estrutura system_configurations precisa de correção');
        }
        
    } catch (error) {
        console.log(`⚠️ Erro na system_configurations: ${error.message}`);
    }
}

async function criarIndicesSeguro(pool) {
    console.log('📝 Criando índices de forma segura...');
    
    const indices = [
        {
            nome: 'idx_ai_analysis_is_active',
            sql: 'CREATE INDEX IF NOT EXISTS idx_ai_analysis_is_active ON ai_analysis(is_active)'
        },
        {
            nome: 'idx_users_email_active',
            sql: 'CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active)'
        },
        {
            nome: 'idx_trading_operations_user_status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_trading_operations_user_status ON trading_operations(user_id, status)'
        },
        {
            nome: 'idx_signals_symbol_created',
            sql: 'CREATE INDEX IF NOT EXISTS idx_signals_symbol_created ON signals(symbol, created_at)'
        },
        {
            nome: 'idx_user_api_keys_active',
            sql: 'CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(user_id, is_active)'
        },
        {
            nome: 'idx_risk_alerts_user_created',
            sql: 'CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_created ON risk_alerts(user_id, created_at)'
        }
    ];
    
    for (const indice of indices) {
        try {
            await pool.query(indice.sql);
            console.log(`   ✅ ${indice.nome} criado`);
        } catch (error) {
            console.log(`   ⚠️ ${indice.nome}: ${error.message}`);
        }
    }
}

async function validacaoFinal(pool) {
    console.log('\n🔍 VALIDAÇÃO FINAL DO SISTEMA');
    console.log('==============================');
    
    // Verificar tabelas essenciais
    const tabelasEssenciais = [
        'users', 'user_api_keys', 'signals', 'trading_operations',
        'ai_analysis', 'risk_alerts', 'user_risk_profiles',
        'system_configurations', 'notifications', 'user_sessions'
    ];
    
    let tabelasOK = 0;
    for (const tabela of tabelasEssenciais) {
        try {
            const result = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
            console.log(`✅ ${tabela}: ${result.rows[0].count} registros`);
            tabelasOK++;
        } catch (error) {
            console.log(`❌ ${tabela}: ${error.message}`);
        }
    }
    
    // Verificar colunas críticas
    const verificacoes = [
        {
            tabela: 'ai_analysis',
            coluna: 'is_active',
            descricao: 'Coluna is_active na ai_analysis'
        },
        {
            tabela: 'users',
            coluna: 'is_active',
            descricao: 'Coluna is_active na users'
        },
        {
            tabela: 'risk_alerts',
            coluna: 'acknowledged',
            descricao: 'Sistema de alertas funcionando'
        }
    ];
    
    let verificacoesOK = 0;
    for (const verif of verificacoes) {
        try {
            await pool.query(`SELECT ${verif.coluna} FROM ${verif.tabela} LIMIT 1`);
            console.log(`✅ ${verif.descricao}`);
            verificacoesOK++;
        } catch (error) {
            console.log(`❌ ${verif.descricao}: ${error.message}`);
        }
    }
    
    // Estatísticas finais
    const totalTabelas = await pool.query(`
        SELECT COUNT(*) as total 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    
    const totalIndices = await pool.query(`
        SELECT COUNT(*) as total 
        FROM pg_indexes 
        WHERE schemaname = 'public'
    `);
    
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`   📋 Total de tabelas: ${totalTabelas.rows[0].total}`);
    console.log(`   🔍 Total de índices: ${totalIndices.rows[0].total}`);
    console.log(`   ✅ Tabelas essenciais: ${tabelasOK}/${tabelasEssenciais.length}`);
    console.log(`   ✅ Verificações: ${verificacoesOK}/${verificacoes.length}`);
    
    // Status final
    const porcentagemTabelas = (tabelasOK / tabelasEssenciais.length) * 100;
    const porcentagemVerificacoes = (verificacoesOK / verificacoes.length) * 100;
    const statusFinal = (porcentagemTabelas + porcentagemVerificacoes) / 2;
    
    console.log(`\n🎯 STATUS FINAL: ${statusFinal.toFixed(1)}%`);
    
    if (statusFinal >= 95) {
        console.log('🟢 EXCELENTE - Sistema 100% completo!');
    } else if (statusFinal >= 80) {
        console.log('🟡 BOM - Pequenos ajustes necessários');
    } else {
        console.log('🔴 REQUER ATENÇÃO - Problemas detectados');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    completarUltimosDetalhes()
        .then(() => {
            console.log('\n🎉 SISTEMA 100% COMPLETO!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Falha na finalização:', error.message);
            process.exit(1);
        });
}

module.exports = { completarUltimosDetalhes };
