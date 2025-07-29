/**
 * 🔧 CORREÇÃO URGENTE - TABELA OPERACAO_MONITORAMENTO
 * ===================================================
 * Adicionando coluna 'status' que está faltando
 * Corrigindo estrutura para compatibilidade com IA Supervisor
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirTabelaMonitoramento() {
    try {
        console.log('🔧 INICIANDO CORREÇÃO DA TABELA OPERACAO_MONITORAMENTO...');
        
        // Verificar se a coluna 'status' existe
        const checkColumn = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'operacao_monitoramento' 
            AND column_name = 'status'
        `;
        
        const columnExists = await pool.query(checkColumn);
        
        if (columnExists.rows.length === 0) {
            console.log('➕ Adicionando coluna status...');
            
            const addStatusColumn = `
                ALTER TABLE operacao_monitoramento 
                ADD COLUMN status VARCHAR(20) DEFAULT 'ativa'
            `;
            
            await pool.query(addStatusColumn);
            console.log('✅ Coluna status adicionada com sucesso!');
        } else {
            console.log('ℹ️ Coluna status já existe.');
        }
        
        // Verificar e corrigir estrutura completa
        console.log('🔍 Verificando estrutura completa da tabela...');
        
        const createTableIfNotExists = `
            CREATE TABLE IF NOT EXISTS operacao_monitoramento (
                id SERIAL PRIMARY KEY,
                operacao_id INTEGER REFERENCES operacoes(id),
                usuario_id INTEGER REFERENCES usuarios(id),
                par VARCHAR(20) NOT NULL,
                tipo VARCHAR(10) NOT NULL,
                preco_entrada DECIMAL(15,8) NOT NULL,
                preco_atual DECIMAL(15,8),
                pl_atual DECIMAL(15,8) DEFAULT 0,
                pl_percentual DECIMAL(10,4) DEFAULT 0,
                volume DECIMAL(15,8) NOT NULL,
                status VARCHAR(20) DEFAULT 'ativa',
                sinal_recebido_em TIMESTAMP DEFAULT NOW(),
                ultima_atualizacao TIMESTAMP DEFAULT NOW(),
                tempo_operacao_minutos INTEGER DEFAULT 0,
                exchange VARCHAR(20) DEFAULT 'bybit',
                dados_extras JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        
        await pool.query(createTableIfNotExists);
        console.log('✅ Estrutura da tabela verificada e corrigida!');
        
        // Atualizar registros existentes sem status
        const updateExisting = `
            UPDATE operacao_monitoramento 
            SET status = 'ativa' 
            WHERE status IS NULL OR status = ''
        `;
        
        const updateResult = await pool.query(updateExisting);
        console.log(`📊 ${updateResult.rowCount} registros atualizados com status 'ativa'`);
        
        // Verificar dados atuais
        const countQuery = `
            SELECT 
                status,
                COUNT(*) as total
            FROM operacao_monitoramento 
            GROUP BY status
        `;
        
        const statusCount = await pool.query(countQuery);
        console.log('📈 Status atual dos registros:');
        statusCount.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.total} registros`);
        });
        
        console.log('🎯 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error);
        throw error;
    }
}

// Executar correção
corrigirTabelaMonitoramento()
    .then(() => {
        console.log('✅ Tabela corrigida, reinicie o IA Supervisor!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Falha na correção:', error);
        process.exit(1);
    });
