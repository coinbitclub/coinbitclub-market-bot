/**
 * 📈 GESTOR DE ABERTURA E ENCERRAMENTO DE OPERAÇÕES
 * Sistema completo para gerenciar ciclo de vida das operações
 */

const { Pool } = require('pg');
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('📈 GESTOR DE OPERAÇÕES - ABERTURA E ENCERRAMENTO');
console.log('==============================================');

class GestorOperacoes {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.gestorChaves = new GestorChavesAPI();
        this.operacoesAbertas = new Map(); // Cache das operações ativas
        this.monitoramento = null; // Intervalo de monitoramento
        this.estatisticas = {
            operacoes_abertas: 0,
            operacoes_fechadas: 0,
            stop_loss_acionados: 0,
            take_profit_acionados: 0,
            trailing_stops: 0
        };
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }

        // Salvar log no banco para auditoria
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO operation_logs (timestamp, level, message, data)
                VALUES ($1, $2, $3, $4);
            `, [timestamp, nivel, mensagem, JSON.stringify(dados)]);
            client.release();
        } catch (error) {
            // Não quebrar por erro de log
        }
    }

    // ========================================
    // 1. ABERTURA DE OPERAÇÕES
    // ========================================

    async abrirOperacao(sinal, userId) {
        await this.log('info', `Iniciando abertura de operação para usuário ${userId}`, { sinal });

        const client = await this.pool.connect();
        try {
            // Buscar dados completos do usuário
            const dadosUsuario = await this.gestorChaves.obterDadosUsuarioParaTrading(userId);
            
            if (!dadosUsuario || dadosUsuario.chaves.length === 0) {
                throw new Error('Usuário não possui chaves de exchange configuradas');
            }

            // Validar se pode abrir nova operação
            const validacao = await this.validarAberturaOperacao(userId, sinal, dadosUsuario, client);
            if (!validacao.permitido) {
                throw new Error(`Operação bloqueada: ${validacao.motivo}`);
            }

            // Calcular tamanho da posição
            const tamanhoPosit = await this.calcularTamanhoPosicao(userId, sinal, dadosUsuario, client);

            // Executar abertura nas exchanges
            const resultados = [];
            for (const chave of dadosUsuario.chaves) {
                if (chave.status === 'active') {
                    const resultado = await this.executarAberturaExchange(
                        userId, sinal, chave, tamanhoPosit, dadosUsuario.parametrizacoes
                    );
                    resultados.push(resultado);
                }
            }

            // Salvar operação no banco
            const operacao = await this.salvarOperacaoAberta(
                userId, sinal, tamanhoPosit, resultados, dadosUsuario.parametrizacoes, client
            );

            // Adicionar ao cache de monitoramento
            this.operacoesAbertas.set(operacao.id, operacao);
            this.estatisticas.operacoes_abertas++;

            await this.log('info', `Operação aberta com sucesso`, {
                operacao_id: operacao.id,
                usuario_id: userId,
                symbol: sinal.symbol,
                quantidade: tamanhoPosit.quantidade,
                exchanges: resultados.length
            });

            return {
                sucesso: true,
                operacao_id: operacao.id,
                quantidade: tamanhoPosit.quantidade,
                resultados_exchanges: resultados,
                stop_loss: operacao.stop_loss,
                take_profit: operacao.take_profit
            };

        } catch (error) {
            await this.log('error', 'Erro na abertura de operação', {
                usuario_id: userId,
                sinal,
                erro: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async validarAberturaOperacao(userId, sinal, dadosUsuario, client) {
        const params = dadosUsuario.parametrizacoes;

        // Verificar se trading está habilitado para o usuário
        if (!params.advanced?.auto_compound) {
            return { permitido: false, motivo: 'Trading automático desabilitado' };
        }

        // Verificar horário de trading
        const agora = new Date();
        const horaAtual = agora.toTimeString().slice(0, 5);
        
        if (horaAtual < params.schedule.trading_hours_start || 
            horaAtual > params.schedule.trading_hours_end) {
            return { permitido: false, motivo: 'Fora do horário de trading' };
        }

        // Verificar se é final de semana (se não permitido)
        if (!params.schedule.weekend_trading && (agora.getDay() === 0 || agora.getDay() === 6)) {
            return { permitido: false, motivo: 'Trading em finais de semana desabilitado' };
        }

        // Verificar limite de posições abertas
        const posicoesAbertas = await client.query(`
            SELECT COUNT(*) FROM user_operations 
            WHERE user_id = $1 AND status = 'open';
        `, [userId]);

        if (parseInt(posicoesAbertas.rows[0].count) >= params.trading.max_open_positions) {
            return { permitido: false, motivo: 'Limite de posições abertas atingido' };
        }

        // Verificar limite diário de trades
        const tradesToday = await client.query(`
            SELECT COUNT(*) FROM user_operations 
            WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE;
        `, [userId]);

        if (parseInt(tradesToday.rows[0].count) >= params.limits.max_daily_trades) {
            return { permitido: false, motivo: 'Limite diário de trades atingido' };
        }

        // Verificar perda diária
        const perdaHoje = await client.query(`
            SELECT COALESCE(SUM(pnl), 0) as perda_total
            FROM user_operations 
            WHERE user_id = $1 AND DATE(closed_at) = CURRENT_DATE AND status = 'closed' AND pnl < 0;
        `, [userId]);

        if (Math.abs(parseFloat(perdaHoje.rows[0].perda_total)) >= params.limits.max_daily_loss_usd) {
            return { permitido: false, motivo: 'Limite de perda diária atingido' };
        }

        // Verificar whitelist/blacklist de pares
        if (params.assets.blacklisted_pairs.includes(sinal.symbol)) {
            return { permitido: false, motivo: 'Par está na blacklist' };
        }

        if (params.assets.whitelisted_pairs.length > 0 && 
            !params.assets.whitelisted_pairs.includes(sinal.symbol)) {
            return { permitido: false, motivo: 'Par não está na whitelist' };
        }

        // Verificar confiança mínima do sinal
        if (sinal.confidence && sinal.confidence < params.trading.min_signal_confidence) {
            return { permitido: false, motivo: 'Confiança do sinal abaixo do mínimo' };
        }

        return { permitido: true, motivo: 'Validação passou' };
    }

    async calcularTamanhoPosicao(userId, sinal, dadosUsuario, client) {
        const params = dadosUsuario.parametrizacoes.trading;
        
        // Buscar saldo disponível em USDT
        const saldo = await client.query(`
            SELECT free_balance FROM user_balances 
            WHERE user_id = $1 AND asset = 'USDT';
        `, [userId]);

        const saldoDisponivel = parseFloat(saldo.rows[0]?.free_balance || '0');
        
        if (saldoDisponivel < dadosUsuario.parametrizacoes.limits.min_account_balance) {
            throw new Error('Saldo insuficiente para operar');
        }

        // Calcular quantidade baseada na porcentagem do saldo
        const valorOperacao = saldoDisponivel * (params.position_size_percent / 100);
        
        // Verificar limites mínimo e máximo
        const valorFinal = Math.max(
            dadosUsuario.parametrizacoes.assets.min_trade_amount_usd,
            Math.min(valorOperacao, dadosUsuario.parametrizacoes.assets.max_trade_amount_usd)
        );

        // Converter para quantidade baseada no preço atual
        const precoAtual = parseFloat(sinal.price || '0');
        if (precoAtual <= 0) {
            throw new Error('Preço inválido no sinal');
        }

        const quantidade = valorFinal / precoAtual;

        return {
            quantidade: quantidade.toFixed(8),
            valor_usd: valorFinal,
            preco_entrada: precoAtual,
            porcentagem_saldo: params.position_size_percent
        };
    }

    async executarAberturaExchange(userId, sinal, chave, tamanhoPosit, parametrizacoes) {
        try {
            // Aqui você integraria com a API real da exchange
            // Por enquanto, simular a execução
            const ordemSimulada = {
                exchange: chave.exchange_name,
                symbol: sinal.symbol,
                side: sinal.action.toUpperCase(),
                type: 'MARKET',
                quantity: tamanhoPosit.quantidade,
                price: tamanhoPosit.preco_entrada,
                order_id: `${chave.exchange_name}_${Date.now()}`,
                status: 'FILLED',
                executed_qty: tamanhoPosit.quantidade,
                executed_price: tamanhoPosit.preco_entrada,
                commission: (tamanhoPosit.valor_usd * 0.001).toFixed(6), // 0.1% de taxa
                timestamp: new Date().toISOString()
            };

            await this.log('info', `Ordem executada na ${chave.exchange_name}`, ordemSimulada);

            return {
                sucesso: true,
                exchange: chave.exchange_name,
                ordem: ordemSimulada
            };

        } catch (error) {
            await this.log('error', `Erro na execução na ${chave.exchange_name}`, {
                erro: error.message,
                sinal,
                tamanho: tamanhoPosit
            });

            return {
                sucesso: false,
                exchange: chave.exchange_name,
                erro: error.message
            };
        }
    }

    async salvarOperacaoAberta(userId, sinal, tamanhoPosit, resultados, parametrizacoes, client) {
        // Calcular stop loss e take profit
        const precoEntrada = parseFloat(tamanhoPosit.preco_entrada);
        const stopLossPercent = parametrizacoes.trading.stop_loss_percent / 100;
        const takeProfitPercent = parametrizacoes.trading.take_profit_percent / 100;

        let stopLoss, takeProfit;
        
        if (sinal.action.toUpperCase() === 'BUY') {
            stopLoss = precoEntrada * (1 - stopLossPercent);
            takeProfit = precoEntrada * (1 + takeProfitPercent);
        } else {
            stopLoss = precoEntrada * (1 + stopLossPercent);
            takeProfit = precoEntrada * (1 - takeProfitPercent);
        }

        // Salvar operação principal
        const operacao = await client.query(`
            INSERT INTO user_operations (
                user_id, symbol, side, quantity, entry_price, 
                stop_loss, take_profit, trailing_stop, status,
                signal_data, execution_results, parameters_used,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            RETURNING *;
        `, [
            userId, sinal.symbol, sinal.action.toUpperCase(), tamanhoPosit.quantidade,
            precoEntrada, stopLoss, takeProfit, parametrizacoes.trading.trailing_stop,
            'open', JSON.stringify(sinal), JSON.stringify(resultados),
            JSON.stringify(parametrizacoes)
        ]);

        return operacao.rows[0];
    }

    // ========================================
    // 2. ENCERRAMENTO DE OPERAÇÕES
    // ========================================

    async encerrarOperacao(operacaoId, motivo = 'manual', precoSaida = null) {
        await this.log('info', `Iniciando encerramento da operação ${operacaoId}`, { motivo, precoSaida });

        const client = await this.pool.connect();
        try {
            // Buscar operação
            const operacao = await client.query(`
                SELECT * FROM user_operations WHERE id = $1 AND status = 'open';
            `, [operacaoId]);

            if (operacao.rows.length === 0) {
                throw new Error('Operação não encontrada ou já fechada');
            }

            const op = operacao.rows[0];

            // Buscar dados do usuário para execução
            const dadosUsuario = await this.gestorChaves.obterDadosUsuarioParaTrading(op.user_id);

            // Determinar preço de saída
            const precoFinal = precoSaida || await this.obterPrecoAtual(op.symbol);

            // Executar fechamento nas exchanges
            const resultadosFechamento = [];
            for (const chave of dadosUsuario.chaves) {
                if (chave.status === 'active') {
                    const resultado = await this.executarFechamentoExchange(
                        op, chave, precoFinal, motivo
                    );
                    resultadosFechamento.push(resultado);
                }
            }

            // Calcular PnL
            const pnl = this.calcularPnL(op, precoFinal);

            // Atualizar operação no banco
            await client.query(`
                UPDATE user_operations 
                SET status = 'closed', exit_price = $1, pnl = $2, 
                    close_reason = $3, closed_at = NOW(),
                    close_execution_results = $4
                WHERE id = $5;
            `, [precoFinal, pnl.valor_usd, motivo, JSON.stringify(resultadosFechamento), operacaoId]);

            // Remover do cache
            this.operacoesAbertas.delete(operacaoId);
            this.estatisticas.operacoes_fechadas++;

            // Atualizar estatísticas específicas
            if (motivo === 'stop_loss') this.estatisticas.stop_loss_acionados++;
            if (motivo === 'take_profit') this.estatisticas.take_profit_acionados++;
            if (motivo === 'trailing_stop') this.estatisticas.trailing_stops++;

            await this.log('info', `Operação ${operacaoId} encerrada com sucesso`, {
                motivo,
                preco_saida: precoFinal,
                pnl: pnl.valor_usd,
                porcentagem: pnl.porcentagem
            });

            return {
                sucesso: true,
                operacao_id: operacaoId,
                preco_saida: precoFinal,
                pnl: pnl,
                motivo,
                resultados_exchanges: resultadosFechamento
            };

        } catch (error) {
            await this.log('error', `Erro no encerramento da operação ${operacaoId}`, {
                erro: error.message,
                motivo
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async executarFechamentoExchange(operacao, chave, precoSaida, motivo) {
        try {
            // Determinar lado oposto
            const ladoFechamento = operacao.side === 'BUY' ? 'SELL' : 'BUY';

            // Simular execução do fechamento
            const ordemFechamento = {
                exchange: chave.exchange_name,
                symbol: operacao.symbol,
                side: ladoFechamento,
                type: 'MARKET',
                quantity: operacao.quantity,
                price: precoSaida,
                order_id: `${chave.exchange_name}_close_${Date.now()}`,
                status: 'FILLED',
                executed_qty: operacao.quantity,
                executed_price: precoSaida,
                commission: (parseFloat(operacao.quantity) * precoSaida * 0.001).toFixed(6),
                timestamp: new Date().toISOString(),
                close_reason: motivo
            };

            await this.log('info', `Ordem de fechamento executada na ${chave.exchange_name}`, ordemFechamento);

            return {
                sucesso: true,
                exchange: chave.exchange_name,
                ordem: ordemFechamento
            };

        } catch (error) {
            await this.log('error', `Erro no fechamento na ${chave.exchange_name}`, {
                erro: error.message,
                operacao_id: operacao.id
            });

            return {
                sucesso: false,
                exchange: chave.exchange_name,
                erro: error.message
            };
        }
    }

    calcularPnL(operacao, precoSaida) {
        const precoEntrada = parseFloat(operacao.entry_price);
        const quantidade = parseFloat(operacao.quantity);
        
        let pnlValor;
        if (operacao.side === 'BUY') {
            pnlValor = (precoSaida - precoEntrada) * quantidade;
        } else {
            pnlValor = (precoEntrada - precoSaida) * quantidade;
        }

        const porcentagem = ((precoSaida - precoEntrada) / precoEntrada) * 100;
        const porcentagemFinal = operacao.side === 'BUY' ? porcentagem : -porcentagem;

        return {
            valor_usd: pnlValor.toFixed(6),
            porcentagem: porcentagemFinal.toFixed(2),
            preco_entrada: precoEntrada,
            preco_saida: precoSaida,
            quantidade
        };
    }

    // ========================================
    // 3. MONITORAMENTO E STOP LOSS/TAKE PROFIT
    // ========================================

    iniciarMonitoramento() {
        console.log('🔍 Iniciando monitoramento de operações');
        
        // Monitorar a cada 5 segundos
        this.monitoramento = setInterval(async () => {
            try {
                await this.monitorarOperacoesAbertas();
            } catch (error) {
                console.error('Erro no monitoramento:', error.message);
            }
        }, 5000);

        // Relatório a cada minuto
        setInterval(() => {
            this.gerarRelatorioMonitoramento();
        }, 60000);
    }

    async monitorarOperacoesAbertas() {
        const client = await this.pool.connect();
        try {
            // Buscar todas as operações abertas
            const operacoes = await client.query(`
                SELECT * FROM user_operations WHERE status = 'open';
            `);

            for (const operacao of operacoes.rows) {
                await this.verificarStopLosseTakeProfit(operacao);
            }

        } catch (error) {
            console.error('Erro no monitoramento de operações:', error.message);
        } finally {
            client.release();
        }
    }

    async verificarStopLosseTakeProfit(operacao) {
        try {
            // Buscar preço atual
            const precoAtual = await this.obterPrecoAtual(operacao.symbol);
            
            const stopLoss = parseFloat(operacao.stop_loss);
            const takeProfit = parseFloat(operacao.take_profit);
            const precoEntrada = parseFloat(operacao.entry_price);

            let deveFechar = false;
            let motivo = '';

            if (operacao.side === 'BUY') {
                // Para compra: stop loss se preço caiu muito, take profit se subiu muito
                if (precoAtual <= stopLoss) {
                    deveFechar = true;
                    motivo = 'stop_loss';
                } else if (precoAtual >= takeProfit) {
                    deveFechar = true;
                    motivo = 'take_profit';
                }
            } else {
                // Para venda: stop loss se preço subiu muito, take profit se caiu muito
                if (precoAtual >= stopLoss) {
                    deveFechar = true;
                    motivo = 'stop_loss';
                } else if (precoAtual <= takeProfit) {
                    deveFechar = true;
                    motivo = 'take_profit';
                }
            }

            // Verificar trailing stop se habilitado
            if (!deveFechar && operacao.trailing_stop) {
                const resultadoTrailing = await this.verificarTrailingStop(operacao, precoAtual);
                if (resultadoTrailing.deve_fechar) {
                    deveFechar = true;
                    motivo = 'trailing_stop';
                }
            }

            if (deveFechar) {
                await this.log('info', `Acionando ${motivo} para operação ${operacao.id}`, {
                    symbol: operacao.symbol,
                    preco_atual: precoAtual,
                    preco_entrada: precoEntrada,
                    stop_loss: stopLoss,
                    take_profit: takeProfit
                });

                await this.encerrarOperacao(operacao.id, motivo, precoAtual);
            }

        } catch (error) {
            await this.log('error', `Erro na verificação de stop/take para operação ${operacao.id}`, {
                erro: error.message
            });
        }
    }

    async verificarTrailingStop(operacao, precoAtual) {
        // Implementar lógica de trailing stop
        // Por simplicidade, usar 1% de trailing
        const trailingPercent = 0.01;
        const precoEntrada = parseFloat(operacao.entry_price);
        
        // Aqui você implementaria a lógica completa de trailing stop
        // que acompanha o preço favorável e ajusta o stop loss dinamicamente
        
        return { deve_fechar: false, novo_stop: null };
    }

    async obterPrecoAtual(symbol) {
        // Simular obtenção de preço atual
        // Em produção, buscar da API da exchange ou feed de preços
        const precoBase = {
            'BTCUSDT': 43000,
            'ETHUSDT': 2500,
            'ADAUSDT': 0.45,
            'BNBUSDT': 310
        };

        const base = precoBase[symbol] || 100;
        // Adicionar variação aleatória de ±2%
        const variacao = (Math.random() - 0.5) * 0.04;
        return base * (1 + variacao);
    }

    // ========================================
    // 4. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    gerarRelatorioMonitoramento() {
        console.log('\n📊 RELATÓRIO DE MONITORAMENTO');
        console.log('============================');
        console.log(`🔓 Operações abertas: ${this.estatisticas.operacoes_abertas}`);
        console.log(`✅ Operações fechadas: ${this.estatisticas.operacoes_fechadas}`);
        console.log(`🛑 Stop loss acionados: ${this.estatisticas.stop_loss_acionados}`);
        console.log(`💰 Take profit acionados: ${this.estatisticas.take_profit_acionados}`);
        console.log(`📈 Trailing stops: ${this.estatisticas.trailing_stops}`);
        console.log(`⏰ Última verificação: ${new Date().toLocaleTimeString()}`);
    }

    async gerarRelatorioCompleto() {
        console.log('📈 Gerando relatório completo de operações');

        const client = await this.pool.connect();
        try {
            const relatorio = await client.query(`
                SELECT 
                    COUNT(*) as total_operacoes,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechadas,
                    AVG(CASE WHEN pnl IS NOT NULL THEN pnl END) as pnl_medio,
                    SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as lucro_total,
                    SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) as perda_total,
                    COUNT(CASE WHEN close_reason = 'stop_loss' THEN 1 END) as stop_loss_count,
                    COUNT(CASE WHEN close_reason = 'take_profit' THEN 1 END) as take_profit_count
                FROM user_operations
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
            `);

            return relatorio.rows[0];

        } catch (error) {
            console.error('Erro ao gerar relatório:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorOperacoes();
    
    // Iniciar monitoramento
    gestor.iniciarMonitoramento();
    
    console.log('✅ Gestor de Operações ativo e monitorando...');
    
    // Manter o processo rodando
    process.on('SIGINT', () => {
        console.log('\n🛑 Parando gestor de operações...');
        if (gestor.monitoramento) {
            clearInterval(gestor.monitoramento);
        }
        process.exit(0);
    });
}

module.exports = GestorOperacoes;
