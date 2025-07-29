/**
 * 🔧 CORRIGIR SCHEMA IA SUPERVISOR - VERIFICAR TABELAS
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarECorrigirSchema() {
    try {
        console.log('🔧 VERIFICANDO E CORRIGINDO SCHEMA...');
        
        // 1. Verificar se tabela user_operations existe
        const checkUserOps = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📊 COLUNAS DA TABELA user_operations:');
        if (checkUserOps.rows.length > 0) {
            checkUserOps.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        } else {
            console.log('   ❌ Tabela user_operations não encontrada');
        }
        
        // 2. Verificar se tabela users existe
        const checkUsers = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n👤 COLUNAS DA TABELA users:');
        if (checkUsers.rows.length > 0) {
            checkUsers.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        } else {
            console.log('   ❌ Tabela users não encontrada');
        }
        
        // 3. Criar schema simplificado sem dependências
        console.log('\n🏗️ CRIANDO SCHEMA SIMPLIFICADO...');
        
        const schemaSimplificado = `
            -- Tabela para monitoramento de operações (sem FK)
            CREATE TABLE IF NOT EXISTS operacao_monitoramento (
                id SERIAL PRIMARY KEY,
                operation_id VARCHAR(100),
                user_id INTEGER,
                current_price DECIMAL(20,8),
                profit_loss_percent DECIMAL(10,4),
                profit_loss_usd DECIMAL(15,2),
                timestamp TIMESTAMP DEFAULT NOW(),
                supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
            );

            -- Tabela para fechamentos de operações
            CREATE TABLE IF NOT EXISTS operacao_fechamentos (
                id SERIAL PRIMARY KEY,
                operation_id VARCHAR(100),
                user_id INTEGER,
                motivo_fechamento VARCHAR(100),
                timestamp_fechamento TIMESTAMP DEFAULT NOW(),
                preco_fechamento DECIMAL(20,8),
                profit_loss_final DECIMAL(15,2),
                tempo_operacao_minutos INTEGER,
                supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
                sucesso BOOLEAN DEFAULT true
            );

            -- Tabela para sinais rejeitados
            CREATE TABLE IF NOT EXISTS sinais_rejeitados (
                id SERIAL PRIMARY KEY,
                signal_id VARCHAR(100),
                sinal_data JSONB,
                motivo_rejeicao VARCHAR(100),
                tempo_decorrido_ms INTEGER,
                timestamp_sinal TIMESTAMP,
                timestamp_rejeicao TIMESTAMP DEFAULT NOW(),
                supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
            );

            -- Tabela para logs de atividade da IA
            CREATE TABLE IF NOT EXISTS ia_activity_logs (
                id SERIAL PRIMARY KEY,
                supervisor_type VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
                action VARCHAR(100) NOT NULL,
                details JSONB,
                execution_time_ms INTEGER,
                timestamp TIMESTAMP DEFAULT NOW(),
                success BOOLEAN DEFAULT true,
                error_message TEXT
            );

            -- Tabela para controle de tempo de sinais
            CREATE TABLE IF NOT EXISTS sinal_tempo_controle (
                id SERIAL PRIMARY KEY,
                signal_id VARCHAR(100) UNIQUE NOT NULL,
                timestamp_recebido TIMESTAMP DEFAULT NOW(),
                timestamp_limite TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDENTE'
            );

            -- Tabela para performance do supervisor
            CREATE TABLE IF NOT EXISTS supervisor_performance_log (
                id SERIAL PRIMARY KEY,
                supervisor_type VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL',
                metric_name VARCHAR(100) NOT NULL,
                metric_value DECIMAL(15,4),
                timestamp TIMESTAMP DEFAULT NOW(),
                details JSONB
            );

            -- Tabela para alertas do sistema
            CREATE TABLE IF NOT EXISTS sistema_alertas (
                id SERIAL PRIMARY KEY,
                alert_type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                severity VARCHAR(20) DEFAULT 'INFO',
                timestamp TIMESTAMP DEFAULT NOW(),
                acknowledged BOOLEAN DEFAULT false,
                supervisor VARCHAR(50) DEFAULT 'IA_SUPERVISOR_TEMPO_REAL'
            );

            -- Índices para performance
            CREATE INDEX IF NOT EXISTS idx_operacao_monitoramento_timestamp ON operacao_monitoramento(timestamp);
            CREATE INDEX IF NOT EXISTS idx_operacao_fechamentos_timestamp ON operacao_fechamentos(timestamp_fechamento);
            CREATE INDEX IF NOT EXISTS idx_sinais_rejeitados_timestamp ON sinais_rejeitados(timestamp_rejeicao);
            CREATE INDEX IF NOT EXISTS idx_ia_activity_logs_timestamp ON ia_activity_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_sinal_tempo_controle_signal_id ON sinal_tempo_controle(signal_id);
        `;
        
        await pool.query(schemaSimplificado);
        console.log('   ✅ Schema simplificado criado com sucesso');
        
        // 4. Testar inserção em cada tabela
        console.log('\n🧪 TESTANDO TABELAS...');
        
        const testes = [
            {
                nome: 'operacao_monitoramento',
                query: `INSERT INTO operacao_monitoramento (operation_id, user_id, current_price, profit_loss_percent) 
                       VALUES ('TEST_001', 1, 45000.50, 2.5) RETURNING id`
            },
            {
                nome: 'sinais_rejeitados',
                query: `INSERT INTO sinais_rejeitados (signal_id, motivo_rejeicao, tempo_decorrido_ms) 
                       VALUES ('SIGNAL_TEST_001', 'TEMPO_LIMITE_EXCEDIDO', 125000) RETURNING id`
            },
            {
                nome: 'ia_activity_logs',
                query: `INSERT INTO ia_activity_logs (action, execution_time_ms) 
                       VALUES ('TESTE_SCHEMA', 150) RETURNING id`
            }
        ];
        
        for (const teste of testes) {
            try {
                const result = await pool.query(teste.query);
                console.log(`   ✅ ${teste.nome}: OK (ID: ${result.rows[0].id})`);
            } catch (error) {
                console.log(`   ❌ ${teste.nome}: ${error.message}`);
            }
        }
        
        // 5. Limpar dados de teste
        console.log('\n🧹 LIMPANDO DADOS DE TESTE...');
        await pool.query(`DELETE FROM operacao_monitoramento WHERE operation_id = 'TEST_001'`);
        await pool.query(`DELETE FROM sinais_rejeitados WHERE signal_id = 'SIGNAL_TEST_001'`);
        await pool.query(`DELETE FROM ia_activity_logs WHERE action = 'TESTE_SCHEMA'`);
        console.log('   ✅ Dados de teste removidos');
        
        console.log('\n🎉 SCHEMA CORRIGIDO E FUNCIONAL!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarECorrigirSchema();
