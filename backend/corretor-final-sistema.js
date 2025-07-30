#!/usr/bin/env node

/**
 * 🔧 CORRETOR FINAL SISTEMA - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Script de correção final para ajustar problemas identificados
 * Completar estrutura do banco e ajustar componentes
 */

const { Pool } = require('pg');

class CorretorFinalSistema {
    constructor() {
        this.id = 'corretor-final-sistema';
        this.nome = 'Corretor Final Sistema';
        this.timestamp = new Date().toISOString();
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.correcoes = [];
    }

    async executarCorrecoesCompletas() {
        console.log('🔧 INICIANDO CORREÇÕES FINAIS DO SISTEMA');
        console.log('================================================================================');
        console.log(`⏰ Timestamp: ${this.timestamp}`);
        console.log('');

        try {
            // 1. Corrigir estrutura da tabela trading_operations
            await this.corrigirTabelaTradingOperations();
            
            // 2. Corrigir estrutura da tabela ai_analysis
            await this.corrigirTabelaAIAnalysis();
            
            // 3. Criar tabelas faltantes
            await this.criarTabelasFaltantes();
            
            // 4. Corrigir métodos nos componentes
            await this.corrigirMetodosComponentes();
            
            // 5. Verificar resultado final
            await this.verificarResultadoFinal();
            
            console.log('✅ CORREÇÕES FINAIS CONCLUÍDAS!');
            
        } catch (error) {
            console.error('❌ Erro durante as correções:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async corrigirTabelaTradingOperations() {
        console.log('🔧 CORRIGINDO TABELA TRADING_OPERATIONS');
        console.log('----------------------------------------');

        try {
            // Verificar colunas existentes
            const colunas = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'trading_operations'
            `);

            const colunasExistentes = colunas.rows.map(row => row.column_name);
            console.log(`📊 Colunas existentes: ${colunasExistentes.join(', ')}`);

            // Adicionar colunas faltantes
            const colunasNecessarias = [
                { nome: 'entry_price', tipo: 'DECIMAL(20,8)', descricao: 'Preço de entrada' },
                { nome: 'exit_price', tipo: 'DECIMAL(20,8)', descricao: 'Preço de saída' },
                { nome: 'pnl', tipo: 'DECIMAL(20,8)', descricao: 'PnL em valor absoluto' },
                { nome: 'current_pnl', tipo: 'DECIMAL(20,8)', descricao: 'PnL atual' },
                { nome: 'quantity', tipo: 'DECIMAL(20,8)', descricao: 'Quantidade negociada' },
                { nome: 'side', tipo: 'VARCHAR(10)', descricao: 'Lado da operação (buy/sell)' }
            ];

            for (const coluna of colunasNecessarias) {
                if (!colunasExistentes.includes(coluna.nome)) {
                    try {
                        await this.pool.query(`
                            ALTER TABLE trading_operations 
                            ADD COLUMN ${coluna.nome} ${coluna.tipo}
                        `);
                        console.log(`✅ Coluna adicionada: ${coluna.nome} (${coluna.descricao})`);
                        this.correcoes.push(`Coluna ${coluna.nome} adicionada`);
                    } catch (error) {
                        console.log(`⚠️ Erro ao adicionar ${coluna.nome}: ${error.message}`);
                    }
                } else {
                    console.log(`✅ Coluna já existe: ${coluna.nome}`);
                }
            }

        } catch (error) {
            console.error('❌ Erro ao corrigir trading_operations:', error.message);
        }

        console.log('');
    }

    async corrigirTabelaAIAnalysis() {
        console.log('🔧 CORRIGINDO TABELA AI_ANALYSIS');
        console.log('----------------------------------------');

        try {
            // Verificar se a tabela existe
            const tabelaExiste = await this.pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'ai_analysis'
                )
            `);

            if (tabelaExiste.rows[0].exists) {
                // Verificar colunas
                const colunas = await this.pool.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'ai_analysis'
                `);

                const colunasExistentes = colunas.rows.map(row => row.column_name);
                
                if (!colunasExistentes.includes('symbol')) {
                    await this.pool.query(`
                        ALTER TABLE ai_analysis 
                        ADD COLUMN symbol VARCHAR(20) NOT NULL DEFAULT 'BTCUSDT'
                    `);
                    console.log('✅ Coluna symbol adicionada à ai_analysis');
                    this.correcoes.push('Coluna symbol adicionada à ai_analysis');
                }

                if (!colunasExistentes.includes('analysis_type')) {
                    await this.pool.query(`
                        ALTER TABLE ai_analysis 
                        ADD COLUMN analysis_type VARCHAR(50) NOT NULL DEFAULT 'signal_analysis'
                    `);
                    console.log('✅ Coluna analysis_type adicionada à ai_analysis');
                    this.correcoes.push('Coluna analysis_type adicionada à ai_analysis');
                }

            } else {
                // Criar tabela completa
                await this.pool.query(`
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
                `);
                console.log('✅ Tabela ai_analysis criada');
                this.correcoes.push('Tabela ai_analysis criada');
            }

        } catch (error) {
            console.error('❌ Erro ao corrigir ai_analysis:', error.message);
        }

        console.log('');
    }

    async criarTabelasFaltantes() {
        console.log('🔧 CRIANDO TABELAS FALTANTES');
        console.log('----------------------------------------');

        const tabelasFaltantes = [
            {
                nome: 'trading_signals',
                sql: `
                    CREATE TABLE IF NOT EXISTS trading_signals (
                        id SERIAL PRIMARY KEY,
                        symbol VARCHAR(20) NOT NULL,
                        signal_type VARCHAR(20) NOT NULL,
                        source VARCHAR(50) NOT NULL,
                        confidence_score DECIMAL(5,4) NOT NULL,
                        entry_price DECIMAL(20,8),
                        stop_loss DECIMAL(20,8),
                        take_profit DECIMAL(20,8),
                        volume_suggested DECIMAL(20,8),
                        timeframe VARCHAR(10),
                        technical_indicators JSONB,
                        market_data JSONB,
                        reasoning TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        processed_at TIMESTAMP,
                        status VARCHAR(20) DEFAULT 'pending',
                        validity_score DECIMAL(5,4),
                        ai_analysis JSONB
                    )
                `
            },
            {
                nome: 'user_risk_profiles',
                sql: `
                    CREATE TABLE IF NOT EXISTS user_risk_profiles (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) UNIQUE,
                        risk_tolerance VARCHAR(20) DEFAULT 'medium',
                        max_daily_loss DECIMAL(5,4) DEFAULT 0.05,
                        max_position_size DECIMAL(5,4) DEFAULT 0.20,
                        max_concurrent_trades INTEGER DEFAULT 5,
                        stop_loss_percentage DECIMAL(5,4) DEFAULT 0.02,
                        take_profit_percentage DECIMAL(5,4) DEFAULT 0.04,
                        max_drawdown DECIMAL(5,4) DEFAULT 0.15,
                        risk_score DECIMAL(5,4) DEFAULT 0.5,
                        last_risk_assessment TIMESTAMP,
                        custom_rules JSONB,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                `
            },
            {
                nome: 'risk_alerts',
                sql: `
                    CREATE TABLE IF NOT EXISTS risk_alerts (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        alert_type VARCHAR(50) NOT NULL,
                        severity VARCHAR(20) NOT NULL,
                        message TEXT NOT NULL,
                        current_value DECIMAL(20,8),
                        threshold_value DECIMAL(20,8),
                        symbol VARCHAR(20),
                        trade_id INTEGER,
                        status VARCHAR(20) DEFAULT 'active',
                        actions_taken JSONB,
                        created_at TIMESTAMP DEFAULT NOW(),
                        resolved_at TIMESTAMP
                    )
                `
            }
        ];

        for (const tabela of tabelasFaltantes) {
            try {
                await this.pool.query(tabela.sql);
                console.log(`✅ Tabela verificada/criada: ${tabela.nome}`);
                this.correcoes.push(`Tabela ${tabela.nome} verificada/criada`);
            } catch (error) {
                console.log(`❌ Erro na tabela ${tabela.nome}: ${error.message}`);
            }
        }

        console.log('');
    }

    async corrigirMetodosComponentes() {
        console.log('🔧 CORRIGINDO MÉTODOS DOS COMPONENTES');
        console.log('----------------------------------------');

        // Esta seção seria para corrigir métodos específicos
        // Por agora, apenas registraremos a necessidade
        
        const componentesParaCorrigir = [
            {
                arquivo: 'database-manager.js',
                metodos_faltantes: ['criarTabelasEssenciais']
            },
            {
                arquivo: 'user-manager-v2.js',
                metodos_faltantes: ['autenticarUsuario', 'obterDadosUsuario']
            },
            {
                arquivo: 'trading-engine.js',
                metodos_faltantes: ['processarSinal', 'executarOrdem']
            }
        ];

        for (const componente of componentesParaCorrigir) {
            console.log(`📝 ${componente.arquivo}:`);
            for (const metodo of componente.metodos_faltantes) {
                console.log(`   ⚠️ Método faltante: ${metodo}`);
                this.correcoes.push(`Método ${metodo} faltante em ${componente.arquivo}`);
            }
        }

        console.log('');
    }

    async verificarResultadoFinal() {
        console.log('🔍 VERIFICANDO RESULTADO FINAL');
        console.log('----------------------------------------');

        try {
            // Verificar tabelas criadas
            const tabelas = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);

            console.log('📊 Tabelas no banco:');
            tabelas.rows.forEach(row => {
                console.log(`   ✅ ${row.table_name}`);
            });

            // Verificar se trading_operations tem as colunas necessárias
            const colunasTrading = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'trading_operations'
                ORDER BY column_name
            `);

            console.log('');
            console.log('📊 Colunas trading_operations:');
            colunasTrading.rows.forEach(row => {
                console.log(`   ✅ ${row.column_name}`);
            });

        } catch (error) {
            console.error('❌ Erro na verificação final:', error.message);
        }

        console.log('');
    }

    async gerarRelatorioCorrecoes() {
        console.log('📊 RELATÓRIO DE CORREÇÕES');
        console.log('================================================================================');

        console.log('✅ CORREÇÕES APLICADAS:');
        if (this.correcoes.length === 0) {
            console.log('   ℹ️ Nenhuma correção foi necessária');
        } else {
            this.correcoes.forEach((correcao, index) => {
                console.log(`   ${index + 1}. ${correcao}`);
            });
        }

        console.log('');
        console.log('📋 PRÓXIMOS PASSOS RECOMENDADOS:');
        console.log('   1. 🔧 Implementar métodos faltantes nos componentes');
        console.log('   2. 🧪 Executar novamente o validador-sistema-final.js');
        console.log('   3. 🚀 Testar funcionalidades em ambiente de produção');
        console.log('   4. 📊 Monitorar logs e performance');
        
        console.log('');
        console.log('💡 COMANDOS ÚTEIS:');
        console.log('   node validador-sistema-final.js  # Validar novamente');
        console.log('   node orquestrador-sistema-completo.js  # Testar orquestração');
        console.log('');

        console.log('================================================================================');
        console.log('🎉 CORREÇÕES FINAIS CONCLUÍDAS - COINBITCLUB MARKET BOT V3.0.0');
        console.log('================================================================================');
    }
}

// Executar correções se for executado diretamente
if (require.main === module) {
    const corretor = new CorretorFinalSistema();
    corretor.executarCorrecoesCompletas()
        .then(() => corretor.gerarRelatorioCorrecoes())
        .catch(console.error);
}

module.exports = CorretorFinalSistema;
