#!/usr/bin/env node

/**
 * 🔧 CORRETOR AI GUARDIAN - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Corrige a estrutura da tabela ai_analysis para incluir user_id
 */

const { Pool } = require('pg');

async function corrigirTabelaAIAnalysis() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Corrigindo estrutura da tabela ai_analysis...');
        
        // Verificar se a coluna user_id já existe
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'ai_analysis' 
            AND column_name = 'user_id'
        `);

        if (checkColumn.rows.length === 0) {
            console.log('📝 Adicionando coluna user_id...');
            
            // Adicionar coluna user_id
            await pool.query(`
                ALTER TABLE ai_analysis 
                ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
            `);

            // Atualizar registros existentes com user_id padrão (usuário admin)
            await pool.query(`
                UPDATE ai_analysis 
                SET user_id = 1 
                WHERE user_id IS NULL
            `);

            console.log('✅ Coluna user_id adicionada com sucesso');
        } else {
            console.log('✅ Coluna user_id já existe');
        }

        // Verificar outras colunas essenciais
        const requiredColumns = [
            { name: 'signal_type', type: 'VARCHAR(10)', default: "'hold'" },
            { name: 'confidence_score', type: 'DECIMAL(5,4)', default: '0.5' },
            { name: 'source', type: 'VARCHAR(100)', default: "'AI_Guardian'" },
            { name: 'reasoning', type: 'TEXT', default: "'Análise automática'" }
        ];

        for (const col of requiredColumns) {
            const checkCol = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'ai_analysis' 
                AND column_name = $1
            `, [col.name]);

            if (checkCol.rows.length === 0) {
                console.log(`📝 Adicionando coluna ${col.name}...`);
                
                await pool.query(`
                    ALTER TABLE ai_analysis 
                    ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}
                `);
                
                console.log(`✅ Coluna ${col.name} adicionada`);
            }
        }

        // Criar índices se não existirem
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
            CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON ai_analysis(symbol);
            CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);
        `);

        console.log('✅ Estrutura da tabela ai_analysis corrigida com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao corrigir tabela ai_analysis:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    corrigirTabelaAIAnalysis()
        .then(() => {
            console.log('🎉 Correção concluída!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Falha na correção:', error.message);
            process.exit(1);
        });
}

module.exports = { corrigirTabelaAIAnalysis };
