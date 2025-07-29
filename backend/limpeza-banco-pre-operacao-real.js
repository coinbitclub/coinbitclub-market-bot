/**
 * 🧹 LIMPEZA COMPLETA DO BANCO DE DADOS PRÉ-OPERAÇÃO REAL
 * Remove todos os dados de teste para iniciar operação limpa
 */

const { Pool } = require('pg');

console.log('🧹 INICIANDO LIMPEZA PRÉ-OPERAÇÃO REAL');
console.log('=====================================');
console.log('📅 Data:', new Date().toLocaleDateString('pt-BR'));
console.log('⏰ Hora:', new Date().toLocaleTimeString('pt-BR'));
console.log('');

// Configuração do banco de dados Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 
        'postgresql://postgres:bBFdAzaPaEdCACgGgbfeFaGbCaBzEJDP@junction.proxy.rlwy.net:54393/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function executarLimpeza() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao banco PostgreSQL Railway');
        console.log('');
        
        // ===================================
        // 1. BACKUP DE SEGURANÇA PRÉ-LIMPEZA
        // ===================================
        
        console.log('💾 1. CRIANDO BACKUP DE SEGURANÇA');
        console.log('=================================');
        
        // Verificar tabelas existentes
        const tabelas = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelas encontradas:');
        tabelas.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        // Contar registros por tabela
        console.log('\n📊 Contagem de registros por tabela:');
        for (const tabela of tabelas.rows) {
            try {
                const count = await client.query(`SELECT COUNT(*) FROM ${tabela.table_name}`);
                console.log(`   - ${tabela.table_name}: ${count.rows[0].count} registros`);
            } catch (error) {
                console.log(`   - ${tabela.table_name}: Erro ao contar (${error.message})`);
            }
        }
        
        // ===================================
        // 2. LIMPEZA DE DADOS DE TESTE
        // ===================================
        
        console.log('\n🧹 2. INICIANDO LIMPEZA DE DADOS DE TESTE');
        console.log('=========================================');
        
        const tabelasParaLimpar = [
            { nome: 'sinais_trading', descricao: 'Sinais de teste do TradingView' },
            { nome: 'operacoes_executadas', descricao: 'Operações de teste executadas' },
            { nome: 'logs_trading', descricao: 'Logs de trading de teste' },
            { nome: 'exchanges_usuarios', descricao: 'Exchanges de teste dos usuários' },
            { nome: 'parametros_trading', descricao: 'Parâmetros de teste' },
            { nome: 'historico_operacoes', descricao: 'Histórico de operações de teste' },
            { nome: 'alertas_sistema', descricao: 'Alertas de teste do sistema' },
            { nome: 'session_tokens', descricao: 'Tokens de sessão expirados' },
            { nome: 'logs_sistema', descricao: 'Logs de sistema antigos' }
        ];
        
        let tabelasLimpas = 0;
        
        for (const tabela of tabelasParaLimpar) {
            try {
                // Verificar se a tabela existe
                const existe = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    )
                `, [tabela.nome]);
                
                if (existe.rows[0].exists) {
                    // Contar registros antes da limpeza
                    const countAntes = await client.query(`SELECT COUNT(*) FROM ${tabela.nome}`);
                    
                    // Limpar a tabela
                    await client.query(`DELETE FROM ${tabela.nome}`);
                    
                    console.log(`   ✅ ${tabela.nome}: ${countAntes.rows[0].count} registros removidos - ${tabela.descricao}`);
                    tabelasLimpas++;
                } else {
                    console.log(`   ⚠️  ${tabela.nome}: Tabela não existe - ${tabela.descricao}`);
                }
            } catch (error) {
                console.log(`   ❌ ${tabela.nome}: Erro na limpeza - ${error.message}`);
            }
        }
        
        // ===================================
        // 3. LIMPEZA DE USUÁRIOS DE TESTE
        // ===================================
        
        console.log('\n👥 3. LIMPEZA DE USUÁRIOS DE TESTE');
        console.log('=================================');
        
        try {
            // Verificar usuários existentes
            const usuarios = await client.query(`
                SELECT id, email, nome, created_at 
                FROM users 
                WHERE email LIKE '%test%' 
                   OR email LIKE '%demo%' 
                   OR email LIKE '%exemplo%'
                   OR nome LIKE '%test%'
                   OR nome LIKE '%demo%'
                ORDER BY created_at DESC
            `);
            
            console.log(`📋 Usuários de teste encontrados: ${usuarios.rows.length}`);
            
            if (usuarios.rows.length > 0) {
                console.log('👤 Usuários que serão removidos:');
                usuarios.rows.forEach(user => {
                    console.log(`   - ID: ${user.id} | Email: ${user.email} | Nome: ${user.nome}`);
                });
                
                // Remover usuários de teste
                const resultado = await client.query(`
                    DELETE FROM users 
                    WHERE email LIKE '%test%' 
                       OR email LIKE '%demo%' 
                       OR email LIKE '%exemplo%'
                       OR nome LIKE '%test%'
                       OR nome LIKE '%demo%'
                `);
                
                console.log(`   ✅ ${resultado.rowCount} usuários de teste removidos`);
            } else {
                console.log('   ✅ Nenhum usuário de teste encontrado');
            }
            
        } catch (error) {
            console.log(`   ⚠️  Erro na limpeza de usuários: ${error.message}`);
        }
        
        // ===================================
        // 4. RESET DE SEQUÊNCIAS
        // ===================================
        
        console.log('\n🔄 4. RESET DE SEQUÊNCIAS');
        console.log('========================');
        
        try {
            // Buscar todas as sequências
            const sequencias = await client.query(`
                SELECT sequence_name 
                FROM information_schema.sequences 
                WHERE sequence_schema = 'public'
            `);
            
            for (const seq of sequencias.rows) {
                await client.query(`ALTER SEQUENCE ${seq.sequence_name} RESTART WITH 1`);
                console.log(`   ✅ Sequência ${seq.sequence_name} resetada`);
            }
            
        } catch (error) {
            console.log(`   ⚠️  Erro no reset de sequências: ${error.message}`);
        }
        
        // ===================================
        // 5. CRIAÇÃO DE TABELAS NECESSÁRIAS
        // ===================================
        
        console.log('\n🏗️  5. VERIFICAÇÃO E CRIAÇÃO DE TABELAS NECESSÁRIAS');
        console.log('==================================================');
        
        const tabelasNecessarias = [
            {
                nome: 'sinais_trading',
                sql: `
                    CREATE TABLE IF NOT EXISTS sinais_trading (
                        id SERIAL PRIMARY KEY,
                        symbol VARCHAR(20) NOT NULL,
                        action VARCHAR(10) NOT NULL,
                        price DECIMAL(20,8),
                        quantity DECIMAL(20,8),
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        source VARCHAR(50) DEFAULT 'TradingView',
                        processed BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `
            },
            {
                nome: 'operacoes_executadas',
                sql: `
                    CREATE TABLE IF NOT EXISTS operacoes_executadas (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER,
                        exchange VARCHAR(20),
                        symbol VARCHAR(20),
                        side VARCHAR(10),
                        quantity DECIMAL(20,8),
                        price DECIMAL(20,8),
                        order_id VARCHAR(100),
                        status VARCHAR(20),
                        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        signal_id INTEGER
                    )
                `
            },
            {
                nome: 'exchanges_usuarios',
                sql: `
                    CREATE TABLE IF NOT EXISTS exchanges_usuarios (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        exchange_name VARCHAR(20) NOT NULL,
                        api_key VARCHAR(200),
                        api_secret VARCHAR(200),
                        testnet BOOLEAN DEFAULT TRUE,
                        active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, exchange_name)
                    )
                `
            },
            {
                nome: 'parametros_trading',
                sql: `
                    CREATE TABLE IF NOT EXISTS parametros_trading (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        max_exposure DECIMAL(20,2) DEFAULT 1000.00,
                        risk_percentage DECIMAL(5,2) DEFAULT 2.00,
                        stop_loss_percentage DECIMAL(5,2) DEFAULT 2.00,
                        take_profit_percentage DECIMAL(5,2) DEFAULT 6.00,
                        active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id)
                    )
                `
            }
        ];
        
        for (const tabela of tabelasNecessarias) {
            try {
                await client.query(tabela.sql);
                console.log(`   ✅ Tabela ${tabela.nome} verificada/criada`);
            } catch (error) {
                console.log(`   ❌ Erro ao criar ${tabela.nome}: ${error.message}`);
            }
        }
        
        // ===================================
        // 6. VERIFICAÇÃO FINAL
        // ===================================
        
        console.log('\n🔍 6. VERIFICAÇÃO FINAL');
        console.log('======================');
        
        // Contar registros após limpeza
        console.log('📊 Registros após limpeza:');
        for (const tabela of tabelas.rows) {
            try {
                const count = await client.query(`SELECT COUNT(*) FROM ${tabela.table_name}`);
                console.log(`   - ${tabela.table_name}: ${count.rows[0].count} registros`);
            } catch (error) {
                console.log(`   - ${tabela.table_name}: Erro ao contar (${error.message})`);
            }
        }
        
        console.log('\n✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
        console.log('================================');
        console.log(`📊 Tabelas limpas: ${tabelasLimpas}`);
        console.log('🎯 Sistema pronto para operação real');
        console.log('⚠️  Dados de teste removidos');
        console.log('🏗️  Estrutura de produção preparada');
        
    } catch (error) {
        console.error('❌ ERRO NA LIMPEZA:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Executar limpeza
if (require.main === module) {
    executarLimpeza()
        .then(() => {
            console.log('\n🎉 LIMPEZA FINALIZADA - SISTEMA PRONTO PARA OPERAÇÃO REAL!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 ERRO FATAL NA LIMPEZA:', error);
            process.exit(1);
        });
}

module.exports = { executarLimpeza };
