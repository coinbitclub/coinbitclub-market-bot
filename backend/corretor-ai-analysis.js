#!/usr/bin/env node

/**
 * 🔧 CORRETOR AI_ANALYSIS - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Script específico para corrigir completamente a tabela ai_analysis
 */

const { Pool } = require('pg');

class CorretorAIAnalysis {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async corrigirTabelaCompleta() {
        console.log('🔧 CORRIGINDO TABELA AI_ANALYSIS COMPLETAMENTE');
        console.log('========================================');

        try {
            // Primeiro, verificar se a tabela existe
            const tabelaExiste = await this.pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'ai_analysis'
                )
            `);

            if (tabelaExiste.rows[0].exists) {
                console.log('🔍 Tabela ai_analysis existe - verificando estrutura...');
                await this.verificarECorrigirColunas();
            } else {
                console.log('🏗️ Criando tabela ai_analysis do zero...');
                await this.criarTabelaCompleta();
            }

            // Verificar resultado final
            await this.verificarEstruturaFinal();

        } catch (error) {
            console.error('❌ Erro ao corrigir ai_analysis:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async verificarECorrigirColunas() {
        // Listar colunas existentes
        const colunas = await this.pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'ai_analysis'
            ORDER BY ordinal_position
        `);

        console.log('📊 Colunas existentes:');
        const colunasExistentes = colunas.rows.map(row => {
            console.log(`   - ${row.column_name} (${row.data_type})`);
            return row.column_name;
        });

        // Colunas necessárias
        const colunasNecessarias = [
            { nome: 'id', tipo: 'SERIAL PRIMARY KEY' },
            { nome: 'symbol', tipo: 'VARCHAR(20) NOT NULL' },
            { nome: 'analysis_type', tipo: 'VARCHAR(50) NOT NULL' },
            { nome: 'input_data', tipo: 'JSONB NOT NULL' },
            { nome: 'ai_response', tipo: 'JSONB' },
            { nome: 'confidence_score', tipo: 'DECIMAL(5,4)' },
            { nome: 'recommendation', tipo: 'VARCHAR(20)' },
            { nome: 'reasoning', tipo: 'TEXT' },
            { nome: 'created_at', tipo: 'TIMESTAMP DEFAULT NOW()' },
            { nome: 'processed_at', tipo: 'TIMESTAMP' },
            { nome: 'model_version', tipo: 'VARCHAR(50)' },
            { nome: 'execution_time_ms', tipo: 'INTEGER' }
        ];

        // Adicionar colunas faltantes
        for (const coluna of colunasNecessarias) {
            if (!colunasExistentes.includes(coluna.nome)) {
                try {
                    await this.pool.query(`
                        ALTER TABLE ai_analysis 
                        ADD COLUMN ${coluna.nome} ${coluna.tipo}
                    `);
                    console.log(`✅ Coluna adicionada: ${coluna.nome}`);
                } catch (error) {
                    console.log(`❌ Erro ao adicionar ${coluna.nome}: ${error.message}`);
                }
            }
        }

        // Criar índices se não existirem
        await this.criarIndices();
    }

    async criarTabelaCompleta() {
        const sql = `
            CREATE TABLE ai_analysis (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                analysis_type VARCHAR(50) NOT NULL,
                input_data JSONB NOT NULL,
                ai_response JSONB,
                confidence_score DECIMAL(5,4),
                recommendation VARCHAR(20),
                reasoning TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                model_version VARCHAR(50),
                execution_time_ms INTEGER
            )
        `;

        await this.pool.query(sql);
        console.log('✅ Tabela ai_analysis criada');

        await this.criarIndices();
    }

    async criarIndices() {
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON ai_analysis(symbol)',
            'CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type)'
        ];

        for (const indice of indices) {
            try {
                await this.pool.query(indice);
                console.log('✅ Índice criado/verificado');
            } catch (error) {
                console.log(`⚠️ Erro no índice: ${error.message}`);
            }
        }
    }

    async verificarEstruturaFinal() {
        console.log('\n🔍 VERIFICAÇÃO FINAL:');
        
        const colunas = await this.pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'ai_analysis'
            ORDER BY ordinal_position
        `);

        console.log('📊 Estrutura final da tabela ai_analysis:');
        colunas.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(not null)';
            console.log(`   ✅ ${row.column_name}: ${row.data_type} ${nullable}`);
        });

        // Testar inserção
        try {
            await this.pool.query(`
                INSERT INTO ai_analysis (symbol, analysis_type, input_data, confidence_score, recommendation)
                VALUES ('BTCUSDT', 'test', '{"test": true}', 0.85, 'buy')
            `);
            
            await this.pool.query(`DELETE FROM ai_analysis WHERE analysis_type = 'test'`);
            console.log('✅ Teste de inserção/deleção: OK');
            
        } catch (error) {
            console.log(`❌ Erro no teste: ${error.message}`);
        }

        console.log('\n🎉 CORREÇÃO DA TABELA AI_ANALYSIS CONCLUÍDA!');
    }
}

// Executar correção
if (require.main === module) {
    const corretor = new CorretorAIAnalysis();
    corretor.corrigirTabelaCompleta().catch(console.error);
}

module.exports = CorretorAIAnalysis;
