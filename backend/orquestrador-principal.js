/**
 * 🎯 ORQUESTRADOR PRINCIPAL DO SISTEMA DE TRADING
 * Coordena todo o fluxo operacional automatizado
 */

const { Pool } = require('pg');
const axios = require('axios');

console.log('🎯 ====================================================');
console.log('     ORQUESTRADOR PRINCIPAL - FLUXO COMPLETO');
console.log('====================================================');

class OrquestradorPrincipal {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.isRunning = false;
        this.intervalId = null;
        this.estadoAtual = 'AGUARDANDO';
        this.ultimaExecucao = null;
        
        // Configurações do fluxo
        this.config = {
            intervaloVerificacao: 30000, // 30 segundos
            timeoutOperacao: 300000,     // 5 minutos timeout
            maxTentativas: 3,
            intervaloMonitoramento: 10000 // 10 segundos para monitoramento
        };

        // Estatísticas operacionais
        this.estatisticas = {
            sinaisProcessados: 0,
            operacoesAbertas: 0,
            operacoesFechadas: 0,
            lucroTotal: 0,
            comissoesGeradas: 0,
            ciclosCompletos: 0
        };

        // Estado das operações ativas
        this.operacoesAtivas = new Map();
        this.monitoramentoAtivo = false;
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ORQUESTRADOR ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   📊 Dados:', JSON.stringify(dados, null, 2));
        }

        // Salvar log estruturado no banco
        try {
            const client = await this.pool.connect();
            await client.query(`
                CREATE TABLE IF NOT EXISTS orchestrator_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT NOW(),
                    level VARCHAR(20),
                    message TEXT,
                    data JSONB,
                    stage VARCHAR(50)
                )
            `);
            
            await client.query(`
                INSERT INTO orchestrator_logs (timestamp, level, message, data, stage)
                VALUES ($1, $2, $3, $4, $5)
            `, [timestamp, nivel, mensagem, JSON.stringify(dados), this.estadoAtual]);
            
            client.release();
        } catch (error) {
            // Não quebrar por erro de log
        }
    }

    async iniciar() {
        if (this.isRunning) {
            await this.log('warning', 'Orquestrador já está rodando');
            return;
        }

        await this.log('info', '🚀 INICIANDO ORQUESTRADOR PRINCIPAL...');
        
        // Inicializar banco de dados
        await this.inicializarBancoDados();
        
        // Primeira execução imediata do ciclo
        await this.executarCicloCompleto();
        
        // Configurar execução periódica
        this.intervalId = setInterval(async () => {
            await this.executarCicloCompleto();
        }, this.config.intervaloVerificacao);
        
        // Iniciar monitoramento separado
        await this.iniciarMonitoramentoOperacoes();
        
        this.isRunning = true;
        await this.log('info', '✅ Orquestrador iniciado com sucesso');
    }

    async parar() {
        if (!this.isRunning) {
            await this.log('warning', 'Orquestrador não está rodando');
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.monitoramentoAtivo = false;
        this.isRunning = false;
        
        await this.log('info', '🛑 Orquestrador parado');
    }

    async executarCicloCompleto() {
        try {
            this.ultimaExecucao = new Date();
            await this.log('info', '🔄 INICIANDO CICLO COMPLETO DE OPERAÇÃO');

            // ETAPA 1: LEITURA DE MERCADO
            this.estadoAtual = 'LEITURA_MERCADO';
            const dadosMercado = await this.lerMercado();

            // ETAPA 2: PROCESSAMENTO DE SINAIS
            this.estadoAtual = 'PROCESSAMENTO_SINAIS';
            const sinaisPendentes = await this.processarSinais();

            // ETAPA 3: ABERTURA DE POSIÇÕES (se houver sinais válidos)
            if (sinaisPendentes.length > 0) {
                this.estadoAtual = 'ABERTURA_POSICOES';
                await this.abrirPosicoes(sinaisPendentes, dadosMercado);
            }

            // ETAPA 4: MONITORAMENTO (executado separadamente)
            this.estadoAtual = 'MONITORAMENTO_ATIVO';

            this.estadoAtual = 'CICLO_COMPLETO';
            this.estatisticas.ciclosCompletos++;
            
            await this.log('info', '✅ Ciclo completo finalizado', {
                sinais_processados: sinaisPendentes.length,
                operacoes_ativas: this.operacoesAtivas.size,
                fear_greed: dadosMercado.fearGreed
            });

        } catch (error) {
            this.estadoAtual = 'ERRO';
            await this.log('error', 'Erro no ciclo completo', { erro: error.message });
        }
    }

    // ========================================
    // ETAPA 1: LEITURA DE MERCADO
    // ========================================
    async lerMercado() {
        await this.log('info', '📊 ETAPA 1: Analisando condições de mercado...');
        
        try {
            const client = await this.pool.connect();
            
            // Buscar último Fear & Greed
            const fearGreedResult = await client.query(`
                SELECT 
                    value,
                    classification,
                    classificacao_pt,
                    CASE 
                        WHEN value < 30 THEN 'LONG_ONLY'
                        WHEN value > 80 THEN 'SHORT_ONLY'
                        ELSE 'BOTH'
                    END as direction_allowed,
                    created_at
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);

            let fearGreed = null;
            if (fearGreedResult.rows.length > 0) {
                fearGreed = fearGreedResult.rows[0];
            } else {
                // Fallback se não houver dados
                fearGreed = {
                    value: 50,
                    classification: 'Neutral',
                    classificacao_pt: 'Neutro',
                    direction_allowed: 'BOTH'
                };
            }

            client.release();

            await this.log('info', 'Leitura de mercado concluída', {
                fear_greed_value: fearGreed.value,
                direction_allowed: fearGreed.direction_allowed,
                market_sentiment: fearGreed.classificacao_pt
            });

            return {
                fearGreed,
                timestamp: new Date().toISOString(),
                marketOpen: true // Simplificado - crypto opera 24/7
            };

        } catch (error) {
            await this.log('error', 'Erro na leitura de mercado', { erro: error.message });
            // Retornar dados seguros em caso de erro
            return {
                fearGreed: { value: 50, direction_allowed: 'BOTH', classificacao_pt: 'Neutro' },
                timestamp: new Date().toISOString(),
                marketOpen: true
            };
        }
    }

    // ========================================
    // ETAPA 2: PROCESSAMENTO DE SINAIS
    // ========================================
    async processarSinais() {
        await this.log('info', '🎯 ETAPA 2: Processando sinais pendentes...');
        
        try {
            const client = await this.pool.connect();
            
            // Buscar sinais não processados recentes
            const sinaisResult = await client.query(`
                SELECT 
                    id, 
                    symbol, 
                    signal_data,
                    source,
                    received_at,
                    EXTRACT(EPOCH FROM (NOW() - received_at)) as segundos_pendente
                FROM trading_signals 
                WHERE processed = false 
                AND received_at > NOW() - INTERVAL '${this.config.timeoutOperacao/1000} seconds'
                ORDER BY received_at ASC
                LIMIT 10
            `);

            const sinaisValidos = [];

            for (const sinal of sinaisResult.rows) {
                const signalData = sinal.signal_data;
                
                // Validar sinal
                const validacao = await this.validarSinal(signalData);
                
                if (validacao.valido) {
                    sinaisValidos.push({
                        id: sinal.id,
                        symbol: sinal.symbol,
                        data: signalData,
                        validacao: validacao
                    });
                    
                    // Marcar como processado
                    await client.query(`
                        UPDATE trading_signals 
                        SET processed = true, 
                            processing_status = 'validated',
                            processed_at = NOW()
                        WHERE id = $1
                    `, [sinal.id]);
                    
                } else {
                    // Marcar como rejeitado
                    await client.query(`
                        UPDATE trading_signals 
                        SET processed = true, 
                            processing_status = 'rejected',
                            processed_at = NOW()
                        WHERE id = $1
                    `, [sinal.id]);
                }
            }

            client.release();
            
            this.estatisticas.sinaisProcessados += sinaisResult.rows.length;
            
            await this.log('info', 'Processamento de sinais concluído', {
                total_sinais: sinaisResult.rows.length,
                sinais_validos: sinaisValidos.length,
                sinais_rejeitados: sinaisResult.rows.length - sinaisValidos.length
            });

            return sinaisValidos;

        } catch (error) {
            await this.log('error', 'Erro no processamento de sinais', { erro: error.message });
            return [];
        }
    }

    async validarSinal(signalData) {
        try {
            // Validação básica do sinal
            if (!signalData.symbol || !signalData.action) {
                return { valido: false, motivo: 'Dados do sinal incompletos' };
            }

            // Validar com Fear & Greed
            const client = await this.pool.connect();
            const fearGreedResult = await client.query(`
                SELECT value,
                CASE 
                    WHEN value < 30 THEN 'LONG_ONLY'
                    WHEN value > 80 THEN 'SHORT_ONLY'
                    ELSE 'BOTH'
                END as direction_allowed
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            client.release();

            if (fearGreedResult.rows.length > 0) {
                const fg = fearGreedResult.rows[0];
                const acao = signalData.action?.toUpperCase();
                
                if (fg.direction_allowed === 'LONG_ONLY' && !['BUY', 'LONG'].includes(acao)) {
                    return { valido: false, motivo: `Fear & Greed permite apenas LONG, sinal é ${acao}` };
                }
                
                if (fg.direction_allowed === 'SHORT_ONLY' && !['SELL', 'SHORT'].includes(acao)) {
                    return { valido: false, motivo: `Fear & Greed permite apenas SHORT, sinal é ${acao}` };
                }
            }

            return { 
                valido: true, 
                motivo: 'Sinal validado com sucesso',
                fearGreedValue: fearGreedResult.rows[0]?.value || 50
            };

        } catch (error) {
            return { valido: false, motivo: `Erro na validação: ${error.message}` };
        }
    }

    // ========================================
    // ETAPA 3: ABERTURA DE POSIÇÕES
    // ========================================
    async abrirPosicoes(sinaisValidos, dadosMercado) {
        await this.log('info', '🚀 ETAPA 3: Abrindo posições automaticamente...');
        
        for (const sinal of sinaisValidos) {
            try {
                // Buscar usuários ativos
                const usuariosAtivos = await this.buscarUsuariosAtivos();
                
                for (const usuario of usuariosAtivos) {
                    // Verificar se usuário pode abrir nova posição
                    const podeAbrir = await this.verificarLimitesUsuario(usuario.user_id);
                    
                    if (podeAbrir.permitido) {
                        const operacao = await this.executarAberturaOperacao(sinal, usuario, dadosMercado);
                        
                        if (operacao) {
                            // Adicionar ao monitoramento
                            this.operacoesAtivas.set(operacao.id, {
                                ...operacao,
                                usuario_id: usuario.user_id,
                                sinal_id: sinal.id,
                                abertura: new Date()
                            });
                            
                            this.estatisticas.operacoesAbertas++;
                        }
                    }
                }
                
            } catch (error) {
                await this.log('error', `Erro na abertura para sinal ${sinal.id}`, { erro: error.message });
            }
        }
        
        await this.log('info', 'Abertura de posições concluída', {
            operacoes_abertas: this.estatisticas.operacoesAbertas,
            operacoes_ativas: this.operacoesAtivas.size
        });
    }

    async buscarUsuariosAtivos() {
        try {
            const client = await this.pool.connect();
            const result = await client.query(`
                SELECT DISTINCT u.user_id, u.username, uk.exchange
                FROM user_api_keys uk
                JOIN users u ON u.id = uk.user_id
                WHERE uk.status = 'active'
                AND u.status = 'active'
                LIMIT 5
            `);
            client.release();
            
            return result.rows;
        } catch (error) {
            await this.log('error', 'Erro ao buscar usuários ativos', { erro: error.message });
            return [];
        }
    }

    async verificarLimitesUsuario(userId) {
        try {
            const client = await this.pool.connect();
            
            // Verificar quantas operações ativas o usuário tem
            const operacoesAtivas = await client.query(`
                SELECT COUNT(*) as total
                FROM operations
                WHERE user_id = $1 
                AND status IN ('open', 'active')
            `, [userId]);
            
            client.release();
            
            const totalOperacoes = parseInt(operacoesAtivas.rows[0].total);
            const limiteOperacoes = 2; // Máximo 2 operações por usuário
            
            if (totalOperacoes >= limiteOperacoes) {
                return { permitido: false, motivo: `Usuário já possui ${totalOperacoes} operações ativas` };
            }
            
            return { permitido: true, motivo: 'Usuário pode abrir nova operação' };
            
        } catch (error) {
            return { permitido: false, motivo: `Erro na verificação: ${error.message}` };
        }
    }

    async executarAberturaOperacao(sinal, usuario, dadosMercado) {
        try {
            await this.log('info', `Abrindo operação para ${usuario.username} - ${sinal.symbol}`, {
                action: sinal.data.action,
                symbol: sinal.symbol,
                exchange: usuario.exchange
            });

            // Simular abertura (em produção seria a integração real com exchange)
            const operacao = {
                id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: usuario.user_id,
                symbol: sinal.symbol,
                action: sinal.data.action,
                price: sinal.data.price || this.gerarPrecoSimulado(sinal.symbol),
                quantity: this.calcularQuantidade(usuario.user_id),
                status: 'open',
                take_profit: null,
                stop_loss: null,
                exchange: usuario.exchange,
                created_at: new Date().toISOString()
            };

            // Calcular TP e SL
            operacao.take_profit = this.calcularTakeProfit(operacao.price, operacao.action);
            operacao.stop_loss = this.calcularStopLoss(operacao.price, operacao.action);

            // Salvar no banco
            await this.salvarOperacaoNoBanco(operacao);

            await this.log('info', 'Operação aberta com sucesso', {
                operacao_id: operacao.id,
                tp: operacao.take_profit,
                sl: operacao.stop_loss
            });

            return operacao;

        } catch (error) {
            await this.log('error', 'Erro na execução da abertura', { erro: error.message });
            return null;
        }
    }

    // ========================================
    // ETAPA 4: MONITORAMENTO EM TEMPO REAL
    // ========================================
    async iniciarMonitoramentoOperacoes() {
        if (this.monitoramentoAtivo) return;
        
        this.monitoramentoAtivo = true;
        await this.log('info', '👁️ Iniciando monitoramento em tempo real...');
        
        setInterval(async () => {
            if (!this.monitoramentoAtivo) return;
            
            await this.monitorarOperacoesAtivas();
        }, this.config.intervaloMonitoramento);
    }

    async monitorarOperacoesAtivas() {
        if (this.operacoesAtivas.size === 0) return;
        
        this.estadoAtual = 'MONITORAMENTO_TEMPO_REAL';
        
        for (const [operacaoId, operacao] of this.operacoesAtivas) {
            try {
                // Obter preço atual (simulado)
                const precoAtual = this.gerarPrecoSimulado(operacao.symbol);
                
                // Calcular P&L
                const pnl = this.calcularPnL(operacao, precoAtual);
                
                // Verificar condições de fechamento
                const deveFechar = this.verificarCondicoesFechamento(operacao, precoAtual, pnl);
                
                if (deveFechar.fechar) {
                    await this.fecharOperacao(operacao, precoAtual, deveFechar.motivo);
                    this.operacoesAtivas.delete(operacaoId);
                } else {
                    // Atualizar dados de monitoramento
                    await this.atualizarMonitoramento(operacao, precoAtual, pnl);
                }
                
            } catch (error) {
                await this.log('error', `Erro no monitoramento da operação ${operacaoId}`, { erro: error.message });
            }
        }
    }

    // ========================================
    // ETAPA 5: FECHAMENTO DE POSIÇÃO
    // ========================================
    async fecharOperacao(operacao, precoFechamento, motivo) {
        try {
            const pnl = this.calcularPnL(operacao, precoFechamento);
            const comissao = this.calcularComissao(operacao, pnl);
            
            await this.log('info', '🏁 FECHAMENTO DE POSIÇÃO', {
                operacao_id: operacao.id,
                symbol: operacao.symbol,
                motivo: motivo,
                pnl: pnl,
                comissao: comissao
            });

            // Atualizar operação no banco
            await this.atualizarOperacaoFechada(operacao, precoFechamento, pnl, motivo);
            
            // ETAPA 6: Gerar comissionamento
            await this.gerarComissionamento(operacao, pnl, comissao);
            
            this.estatisticas.operacoesFechadas++;
            this.estatisticas.lucroTotal += pnl;
            this.estatisticas.comissoesGeradas += comissao;
            
        } catch (error) {
            await this.log('error', 'Erro no fechamento da operação', { erro: error.message });
        }
    }

    // ========================================
    // ETAPA 6: COMISSIONAMENTO GERADO
    // ========================================
    async gerarComissionamento(operacao, pnl, comissao) {
        try {
            if (pnl > 0 && comissao > 0) {
                await this.log('info', '💰 COMISSIONAMENTO GERADO', {
                    operacao_id: operacao.id,
                    valor_comissao: comissao,
                    percentual: '1.5%'
                });

                // Salvar comissionamento no banco
                const client = await this.pool.connect();
                await client.query(`
                    INSERT INTO commissions (
                        user_id, operation_id, amount, percentage, status, created_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW())
                `, [operacao.user_id, operacao.id, comissao, 1.5, 'generated']);
                client.release();
            }
        } catch (error) {
            await this.log('error', 'Erro na geração de comissionamento', { erro: error.message });
        }
    }

    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================
    gerarPrecoSimulado(symbol) {
        const precos = {
            'BTCUSDT': 45000 + (Math.random() - 0.5) * 4000,
            'ETHUSDT': 3000 + (Math.random() - 0.5) * 400,
            'MATICUSDT': 0.8 + (Math.random() - 0.5) * 0.2
        };
        return precos[symbol] || 1000;
    }

    calcularQuantidade(userId) {
        // Simplificado - em produção seria baseado no saldo do usuário
        return Math.random() * 0.1 + 0.05; // Entre 0.05 e 0.15
    }

    calcularTakeProfit(preco, acao) {
        const multiplier = acao?.toUpperCase().includes('BUY') || acao?.toUpperCase().includes('LONG') ? 1.03 : 0.97;
        return preco * multiplier;
    }

    calcularStopLoss(preco, acao) {
        const multiplier = acao?.toUpperCase().includes('BUY') || acao?.toUpperCase().includes('LONG') ? 0.98 : 1.02;
        return preco * multiplier;
    }

    calcularPnL(operacao, precoAtual) {
        const isLong = operacao.action?.toUpperCase().includes('BUY') || operacao.action?.toUpperCase().includes('LONG');
        const diferenca = precoAtual - operacao.price;
        return isLong ? diferenca * operacao.quantity : -diferenca * operacao.quantity;
    }

    calcularComissao(operacao, pnl) {
        return pnl > 0 ? pnl * 0.015 : 0; // 1.5% sobre o lucro
    }

    verificarCondicoesFechamento(operacao, precoAtual, pnl) {
        // Verificar Take Profit
        if (operacao.take_profit) {
            const isLong = operacao.action?.toUpperCase().includes('BUY') || operacao.action?.toUpperCase().includes('LONG');
            if ((isLong && precoAtual >= operacao.take_profit) || (!isLong && precoAtual <= operacao.take_profit)) {
                return { fechar: true, motivo: 'TAKE_PROFIT_ATINGIDO' };
            }
        }

        // Verificar Stop Loss
        if (operacao.stop_loss) {
            const isLong = operacao.action?.toUpperCase().includes('BUY') || operacao.action?.toUpperCase().includes('LONG');
            if ((isLong && precoAtual <= operacao.stop_loss) || (!isLong && precoAtual >= operacao.stop_loss)) {
                return { fechar: true, motivo: 'STOP_LOSS_ACIONADO' };
            }
        }

        // Verificar tempo máximo (8 horas)
        const tempoAberto = Date.now() - new Date(operacao.created_at).getTime();
        if (tempoAberto > 8 * 60 * 60 * 1000) {
            return { fechar: true, motivo: 'TIMEOUT_8_HORAS' };
        }

        return { fechar: false };
    }

    async inicializarBancoDados() {
        const client = await this.pool.connect();
        
        try {
            // Criar tabelas necessárias
            await client.query(`
                CREATE TABLE IF NOT EXISTS operations (
                    id VARCHAR(100) PRIMARY KEY,
                    user_id INTEGER,
                    symbol VARCHAR(20),
                    action VARCHAR(20),
                    price DECIMAL(15,8),
                    quantity DECIMAL(15,8),
                    take_profit DECIMAL(15,8),
                    stop_loss DECIMAL(15,8),
                    status VARCHAR(20),
                    exchange VARCHAR(20),
                    pnl DECIMAL(15,8) DEFAULT 0,
                    close_price DECIMAL(15,8),
                    close_reason VARCHAR(50),
                    created_at TIMESTAMP DEFAULT NOW(),
                    closed_at TIMESTAMP
                )
            `);
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS commissions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    operation_id VARCHAR(100),
                    amount DECIMAL(15,8),
                    percentage DECIMAL(5,2),
                    status VARCHAR(20),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
        } finally {
            client.release();
        }
    }

    async salvarOperacaoNoBanco(operacao) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO operations (
                    id, user_id, symbol, action, price, quantity, 
                    take_profit, stop_loss, status, exchange, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                operacao.id, operacao.user_id, operacao.symbol, operacao.action,
                operacao.price, operacao.quantity, operacao.take_profit, operacao.stop_loss,
                operacao.status, operacao.exchange, operacao.created_at
            ]);
        } finally {
            client.release();
        }
    }

    async atualizarOperacaoFechada(operacao, precoFechamento, pnl, motivo) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE operations 
                SET status = 'closed', 
                    close_price = $1, 
                    pnl = $2, 
                    close_reason = $3,
                    closed_at = NOW()
                WHERE id = $4
            `, [precoFechamento, pnl, motivo, operacao.id]);
        } finally {
            client.release();
        }
    }

    async atualizarMonitoramento(operacao, precoAtual, pnl) {
        // Atualizar dados de monitoramento (poderia ser uma tabela separada)
        // Por enquanto apenas log
        await this.log('debug', `Monitorando ${operacao.symbol}`, {
            operacao_id: operacao.id,
            preco_atual: precoAtual,
            pnl: pnl.toFixed(2)
        });
    }

    obterEstatisticas() {
        return {
            ...this.estatisticas,
            isRunning: this.isRunning,
            estadoAtual: this.estadoAtual,
            operacoesAtivas: this.operacoesAtivas.size,
            ultimaExecucao: this.ultimaExecucao,
            proximaExecucao: this.ultimaExecucao ? 
                new Date(this.ultimaExecucao.getTime() + this.config.intervaloVerificacao) : null
        };
    }
}

module.exports = OrquestradorPrincipal;
