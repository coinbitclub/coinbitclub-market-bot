/**
 * 📊 MONITOR DE OPERAÇÕES EM TEMPO REAL
 * Sistema para acompanhar operações ativas e calcular taxa de sucesso real
 */

const { Pool } = require('pg');

class OperationsMonitor {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: {
                rejectUnauthorized: false
            }
        });
        
        this.metricas = {
            operacoesAbertas: 0,
            operacoesFechadas: 0,
            operacoesLucrativas: 0,
            operacoesPrejuizo: 0,
            taxaSucessoReal: 0,
            volumeTotal: 0,
            pnlTotal: 0,
            ultimaAtualizacao: new Date()
        };

        this.init();
    }

    async init() {
        console.log('📊 INICIANDO MONITOR DE OPERAÇÕES EM TEMPO REAL');
        console.log('================================================');
        
        // Verificar/criar tabelas necessárias
        await this.criarTabelasMonitoramento();
        
        // Carregar operações existentes
        await this.carregarOperacoesExistentes();
        
        // Iniciar monitoramento contínuo
        this.iniciarMonitoramentoContinuo();
        
        console.log('✅ Monitor de operações iniciado com sucesso');
    }

    async criarTabelasMonitoramento() {
        try {
            // Tabela de operações em tempo real
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS live_operations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    user_name VARCHAR(100),
                    symbol VARCHAR(20) NOT NULL,
                    side VARCHAR(10) NOT NULL, -- 'Buy' ou 'Sell'
                    quantity DECIMAL(20,8) NOT NULL,
                    entry_price DECIMAL(20,8),
                    current_price DECIMAL(20,8),
                    pnl_unrealized DECIMAL(20,8) DEFAULT 0,
                    pnl_realized DECIMAL(20,8) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'CANCELLED'
                    order_id VARCHAR(100),
                    exchange VARCHAR(20) DEFAULT 'BYBIT',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    closed_at TIMESTAMP,
                    
                    -- Configurações da operação
                    stop_loss_price DECIMAL(20,8),
                    take_profit_price DECIMAL(20,8),
                    leverage INTEGER DEFAULT 1,
                    
                    -- Metadados do sinal
                    signal_id INTEGER,
                    signal_source VARCHAR(50) DEFAULT 'TRADINGVIEW',
                    fear_greed_index INTEGER,
                    
                    -- Performance
                    max_profit DECIMAL(20,8) DEFAULT 0,
                    max_loss DECIMAL(20,8) DEFAULT 0,
                    duration_minutes INTEGER DEFAULT 0
                );
            `);

            // Índices para performance
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_live_operations_status ON live_operations(status);
                CREATE INDEX IF NOT EXISTS idx_live_operations_user ON live_operations(user_id);
                CREATE INDEX IF NOT EXISTS idx_live_operations_symbol ON live_operations(symbol);
                CREATE INDEX IF NOT EXISTS idx_live_operations_created ON live_operations(created_at);
            `);

            // Tabela de métricas de performance em tempo real
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    metric_date DATE DEFAULT CURRENT_DATE,
                    
                    -- Operações do dia
                    operations_opened INTEGER DEFAULT 0,
                    operations_closed INTEGER DEFAULT 0,
                    operations_profitable INTEGER DEFAULT 0,
                    operations_loss INTEGER DEFAULT 0,
                    
                    -- Resultados financeiros
                    total_pnl DECIMAL(20,8) DEFAULT 0,
                    total_volume DECIMAL(20,8) DEFAULT 0,
                    max_drawdown DECIMAL(20,8) DEFAULT 0,
                    
                    -- Taxa de sucesso
                    success_rate DECIMAL(5,2) DEFAULT 0,
                    
                    -- Timing
                    avg_trade_duration INTEGER DEFAULT 0, -- minutos
                    
                    updated_at TIMESTAMP DEFAULT NOW(),
                    
                    UNIQUE(user_id, metric_date)
                );
            `);

            console.log('✅ Tabelas de monitoramento criadas/verificadas');

        } catch (error) {
            console.error('❌ Erro ao criar tabelas de monitoramento:', error);
        }
    }

    async carregarOperacoesExistentes() {
        try {
            // Carregar operações abertas
            const operacoesAbertas = await this.pool.query(`
                SELECT COUNT(*) as total FROM live_operations WHERE status = 'ABERTA'
            `);

            // Carregar operações fechadas hoje
            const operacoesFechadas = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_fechadas,
                    COUNT(CASE WHEN pnl > 0 THEN 1 END) as lucrativas,
                    COUNT(CASE WHEN pnl <= 0 THEN 1 END) as prejuizo,
                    COALESCE(SUM(pnl), 0) as pnl_total
                FROM live_operations 
                WHERE status = 'FECHADA' 
                AND DATE(fechada_em) = CURRENT_DATE
            `);

            const fechadas = operacoesFechadas.rows[0];
            
            this.metricas.operacoesAbertas = parseInt(operacoesAbertas.rows[0].total);
            this.metricas.operacoesFechadas = parseInt(fechadas.total_fechadas);
            this.metricas.operacoesLucrativas = parseInt(fechadas.lucrativas);
            this.metricas.operacoesPrejuizo = parseInt(fechadas.prejuizo);
            this.metricas.pnlTotal = parseFloat(fechadas.pnl_total);
            
            // Calcular taxa de sucesso real
            this.calcularTaxaSucessoReal();

            console.log('📊 MÉTRICAS CARREGADAS:');
            console.log(`   🔓 Operações abertas: ${this.metricas.operacoesAbertas}`);
            console.log(`   🔒 Operações fechadas hoje: ${this.metricas.operacoesFechadas}`);
            console.log(`   ✅ Lucrativas: ${this.metricas.operacoesLucrativas}`);
            console.log(`   ❌ Prejuízo: ${this.metricas.operacoesPrejuizo}`);
            console.log(`   🎯 Taxa de sucesso: ${this.metricas.taxaSucessoReal}%`);
            console.log(`   💰 PnL total: $${this.metricas.pnlTotal.toFixed(2)}`);

        } catch (error) {
            console.error('❌ Erro ao carregar operações existentes:', error);
        }
    }

    calcularTaxaSucessoReal() {
        if (this.metricas.operacoesFechadas > 0) {
            this.metricas.taxaSucessoReal = (
                (this.metricas.operacoesLucrativas / this.metricas.operacoesFechadas) * 100
            ).toFixed(2);
        } else {
            this.metricas.taxaSucessoReal = 0;
        }
        
        this.metricas.ultimaAtualizacao = new Date();
    }

    async registrarNovaOperacao(operacao) {
        try {
            console.log(`📈 NOVA OPERAÇÃO: ${operacao.symbol} ${operacao.tipo || operacao.side}`);
            
            const result = await this.pool.query(`
                INSERT INTO live_operations (
                    user_id, symbol, tipo, quantidade, preco_entrada,
                    order_id, exchange, status, signal_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `, [
                operacao.user_id,
                operacao.symbol,
                operacao.tipo || operacao.side || 'LONG',
                operacao.quantidade || operacao.quantity || 0,
                operacao.preco_entrada || operacao.entry_price || 0,
                operacao.order_id,
                operacao.exchange || 'bybit',
                'ABERTA',
                operacao.signal_id
            ]);

            this.metricas.operacoesAbertas++;
            
            console.log(`✅ Operação registrada - ID: ${result.rows[0].id}`);
            
            // Atualizar métricas diárias
            await this.atualizarMetricasDiarias(operacao.user_id, 'opened');
            
            return result.rows[0].id;

        } catch (error) {
            console.error('❌ Erro ao registrar nova operação:', error);
            throw error;
        }
    }

    async fecharOperacao(operationId, closeData) {
        try {
            console.log(`🔒 FECHANDO OPERAÇÃO: ${operationId}`);
            
            const pnlRealizado = parseFloat(closeData.pnl || closeData.pnl_realized || 0);
            const isLucrativa = pnlRealizado > 0;
            
            // Atualizar operação
            await this.pool.query(`
                UPDATE live_operations SET
                    status = 'FECHADA',
                    preco_saida = $1,
                    pnl = $2,
                    fechada_em = NOW(),
                    updated_at = NOW()
                WHERE id = $3
            `, [closeData.close_price, pnlRealizado, operationId]);

            // Obter dados da operação para métricas
            const operacao = await this.pool.query(`
                SELECT user_id, pnl FROM live_operations WHERE id = $1
            `, [operationId]);

            if (operacao.rows.length > 0) {
                const { user_id, pnl } = operacao.rows[0];
                
                // Atualizar métricas locais
                this.metricas.operacoesAbertas--;
                this.metricas.operacoesFechadas++;
                
                if (parseFloat(pnl) > 0) {
                    this.metricas.operacoesLucrativas++;
                    console.log(`✅ OPERAÇÃO LUCRATIVA: +$${pnl}`);
                } else {
                    this.metricas.operacoesPrejuizo++;
                    console.log(`❌ OPERAÇÃO COM PREJUÍZO: $${pnl}`);
                }
                
                this.metricas.pnlTotal += parseFloat(pnl);
                this.calcularTaxaSucessoReal();
                
                // Atualizar métricas diárias
                await this.atualizarMetricasDiarias(user_id, 'closed', isLucrativa, parseFloat(pnl));
                
                console.log(`🎯 NOVA TAXA DE SUCESSO: ${this.metricas.taxaSucessoReal}%`);
            }

        } catch (error) {
            console.error('❌ Erro ao fechar operação:', error);
            throw error;
        }
    }

    async atualizarMetricasDiarias(userId, action, isLucrativa = false, pnl = 0) {
        try {
            const updates = {};
            
            if (action === 'opened') {
                updates.operations_opened = 1;
            } else if (action === 'closed') {
                updates.operations_closed = 1;
                updates.total_pnl = pnl;
                
                if (isLucrativa) {
                    updates.operations_profitable = 1;
                } else {
                    updates.operations_loss = 1;
                }
            }

            // Upsert métricas diárias
            await this.pool.query(`
                INSERT INTO performance_metrics (
                    user_id, operations_opened, operations_closed, 
                    operations_profitable, operations_loss, total_pnl
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, metric_date) 
                DO UPDATE SET
                    operations_opened = performance_metrics.operations_opened + EXCLUDED.operations_opened,
                    operations_closed = performance_metrics.operations_closed + EXCLUDED.operations_closed,
                    operations_profitable = performance_metrics.operations_profitable + EXCLUDED.operations_profitable,
                    operations_loss = performance_metrics.operations_loss + EXCLUDED.operations_loss,
                    total_pnl = performance_metrics.total_pnl + EXCLUDED.total_pnl,
                    success_rate = CASE 
                        WHEN (performance_metrics.operations_closed + EXCLUDED.operations_closed) > 0 
                        THEN ((performance_metrics.operations_profitable + EXCLUDED.operations_profitable) * 100.0) / 
                             (performance_metrics.operations_closed + EXCLUDED.operations_closed)
                        ELSE 0 
                    END,
                    updated_at = NOW()
            `, [
                userId,
                updates.operations_opened || 0,
                updates.operations_closed || 0,
                updates.operations_profitable || 0,
                updates.operations_loss || 0,
                updates.total_pnl || 0
            ]);

        } catch (error) {
            console.error('❌ Erro ao atualizar métricas diárias:', error);
        }
    }

    async obterOperacoesAbertas() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    lo.*,
                    EXTRACT(EPOCH FROM (NOW() - lo.created_at))/60 as minutes_open,
                    lo.pnl_atual as pnl_unrealized_calc
                FROM live_operations lo
                WHERE lo.status = 'ABERTA'
                ORDER BY lo.created_at DESC
            `);

            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao obter operações abertas:', error);
            return [];
        }
    }

    async obterHistoricoOperacoes(limite = 50) {
        try {
            const result = await this.pool.query(`
                SELECT 
                    lo.*,
                    EXTRACT(EPOCH FROM (lo.fechada_em - lo.created_at))/60 as duration_minutes
                FROM live_operations lo
                WHERE lo.status = 'FECHADA'
                ORDER BY lo.fechada_em DESC
                LIMIT $1
            `, [limite]);

            return result.rows;

        } catch (error) {
            console.error('❌ Erro ao obter histórico de operações:', error);
            return [];
        }
    }

    async obterMetricasResumo() {
        try {
            // Métricas gerais de hoje
            const metricas = await this.pool.query(`
                SELECT 
                    COUNT(CASE WHEN status = 'ABERTA' THEN 1 END) as operacoes_abertas,
                    COUNT(CASE WHEN status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE THEN 1 END) as operacoes_fechadas_hoje,
                    COUNT(CASE WHEN status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE AND pnl > 0 THEN 1 END) as lucrativas_hoje,
                    COUNT(CASE WHEN status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE AND pnl <= 0 THEN 1 END) as prejuizo_hoje,
                    COALESCE(SUM(CASE WHEN status = 'FECHADA' AND DATE(fechada_em) = CURRENT_DATE THEN pnl END), 0) as pnl_total_hoje,
                    COUNT(CASE WHEN status = 'FECHADA' THEN 1 END) as total_operacoes_historico,
                    COUNT(CASE WHEN status = 'FECHADA' AND pnl > 0 THEN 1 END) as total_lucrativas_historico,
                    COALESCE(SUM(CASE WHEN status = 'FECHADA' THEN pnl END), 0) as pnl_total_historico
                FROM live_operations
            `);

            const dados = metricas.rows[0];
            
            // Calcular taxas de sucesso
            const taxaSucessoHoje = dados.operacoes_fechadas_hoje > 0 
                ? ((dados.lucrativas_hoje / dados.operacoes_fechadas_hoje) * 100).toFixed(2)
                : 0;
                
            const taxaSucessoHistorico = dados.total_operacoes_historico > 0 
                ? ((dados.total_lucrativas_historico / dados.total_operacoes_historico) * 100).toFixed(2)
                : 0;

            return {
                hoje: {
                    operacoesAbertas: parseInt(dados.operacoes_abertas),
                    operacoesFechadas: parseInt(dados.operacoes_fechadas_hoje),
                    operacoesLucrativas: parseInt(dados.lucrativas_hoje),
                    operacoesPrejuizo: parseInt(dados.prejuizo_hoje),
                    pnlTotal: parseFloat(dados.pnl_total_hoje),
                    taxaSucesso: parseFloat(taxaSucessoHoje),
                    classificacao: this.classificarTaxaSucesso(parseFloat(taxaSucessoHoje))
                },
                historico: {
                    totalOperacoes: parseInt(dados.total_operacoes_historico),
                    totalLucrativas: parseInt(dados.total_lucrativas_historico),
                    pnlTotal: parseFloat(dados.pnl_total_historico),
                    taxaSucesso: parseFloat(taxaSucessoHistorico),
                    classificacao: this.classificarTaxaSucesso(parseFloat(taxaSucessoHistorico))
                },
                ultimaAtualizacao: new Date()
            };

        } catch (error) {
            console.error('❌ Erro ao obter métricas resumo:', error);
            return {
                hoje: { operacoesAbertas: 0, operacoesFechadas: 0, taxaSucesso: 0 },
                historico: { totalOperacoes: 0, taxaSucesso: 0 }
            };
        }
    }

    classificarTaxaSucesso(taxa) {
        if (taxa >= 80) return { nivel: 'EXCELENTE', cor: '#4caf50', emoji: '🟢' };
        if (taxa >= 60) return { nivel: 'BOM', cor: '#2196f3', emoji: '🔵' };
        if (taxa >= 40) return { nivel: 'REGULAR', cor: '#ff9800', emoji: '🟡' };
        return { nivel: 'RUIM', cor: '#f44336', emoji: '🔴' };
    }

    iniciarMonitoramentoContinuo() {
        // Atualizar métricas a cada 30 segundos
        setInterval(async () => {
            await this.carregarOperacoesExistentes();
        }, 30000);

        // Log de status a cada 5 minutos
        setInterval(() => {
            console.log('\n📊 STATUS OPERAÇÕES (5min):');
            console.log(`   🔓 Abertas: ${this.metricas.operacoesAbertas}`);
            console.log(`   🔒 Fechadas hoje: ${this.metricas.operacoesFechadas}`);
            console.log(`   🎯 Taxa sucesso: ${this.metricas.taxaSucessoReal}%`);
            console.log(`   💰 PnL total: $${this.metricas.pnlTotal.toFixed(2)}`);
        }, 300000);
    }

    // Métodos para integração com APIs
    async iniciarOperacao(sinalTradingView, usuario, parametros) {
        const operacao = {
            user_id: usuario.id,
            user_name: usuario.name,
            symbol: sinalTradingView.symbol,
            side: sinalTradingView.side,
            quantity: parametros.quantity,
            entry_price: parametros.entry_price,
            stop_loss_price: parametros.stop_loss,
            take_profit_price: parametros.take_profit,
            leverage: parametros.leverage,
            signal_id: sinalTradingView.id,
            fear_greed_index: sinalTradingView.fear_greed_value,
            order_id: parametros.order_id
        };

        return await this.registrarNovaOperacao(operacao);
    }

    // Métodos getter para métricas
    getMetricas() {
        return this.metricas;
    }

    getMetricasTempoReal() {
        return {
            ...this.metricas,
            statusSistema: this.metricas.taxaSucessoReal >= 80 ? 'EXCELENTE' : 
                          this.metricas.taxaSucessoReal >= 60 ? 'BOM' : 'REGULAR'
        };
    }
}

module.exports = OperationsMonitor;
