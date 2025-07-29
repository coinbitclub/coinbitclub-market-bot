/**
 * 🎯 GESTOR DE FECHAMENTO AUTOMÁTICO DE ORDENS
 * Sistema inteligente para monitoramento e fechamento de posições
 */

const { Pool } = require('pg');
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('🎯 GESTOR DE FECHAMENTO AUTOMÁTICO DE ORDENS');
console.log('==========================================');

class GestorFechamentoOrdens {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.gestorChaves = new GestorChavesAPI();
        this.intervalosMonitoramento = new Map(); // Para controlar intervalos de usuários
        this.ordensEmMonitoramento = new Set();
    }

    // ========================================
    // 1. MONITORAMENTO DE ORDENS ATIVAS
    // ========================================

    async iniciarMonitoramentoUsuario(userId) {
        console.log(`📊 Iniciando monitoramento de ordens para usuário ${userId}`);

        try {
            // Verificar se já está monitorando
            if (this.intervalosMonitoramento.has(userId)) {
                console.log(`ℹ️ Usuário ${userId} já está sendo monitorado`);
                return;
            }

            // Buscar dados do usuário para trading
            const dadosUsuario = await this.gestorChaves.obterDadosUsuarioParaTrading(userId);
            
            if (!dadosUsuario || dadosUsuario.chaves.length === 0) {
                console.log(`⚠️ Usuário ${userId} não tem chaves configuradas`);
                return;
            }

            // Iniciar monitoramento com intervalo de 30 segundos
            const intervaloId = setInterval(async () => {
                try {
                    await this.verificarOrdensUsuario(userId, dadosUsuario);
                } catch (error) {
                    console.error(`❌ Erro no monitoramento do usuário ${userId}:`, error.message);
                }
            }, 30000); // 30 segundos

            this.intervalosMonitoramento.set(userId, intervaloId);
            console.log(`✅ Monitoramento iniciado para usuário ${userId}`);

        } catch (error) {
            console.error(`❌ Erro ao iniciar monitoramento: ${error.message}`);
        }
    }

    async pararMonitoramentoUsuario(userId) {
        console.log(`⏹️ Parando monitoramento para usuário ${userId}`);

        if (this.intervalosMonitoramento.has(userId)) {
            clearInterval(this.intervalosMonitoramento.get(userId));
            this.intervalosMonitoramento.delete(userId);
            console.log(`✅ Monitoramento parado para usuário ${userId}`);
        }
    }

    async verificarOrdensUsuario(userId, dadosUsuario) {
        const client = await this.pool.connect();
        try {
            // Buscar ordens abertas do usuário
            const ordensAbertas = await client.query(`
                SELECT id, symbol, side, entry_price, quantity, leverage,
                       take_profit, stop_loss, exchange_name, order_id,
                       created_at, metadata
                FROM trading_operations 
                WHERE user_id = $1 AND status = 'open'
            `, [userId]);

            for (const ordem of ordensAbertas.rows) {
                if (!this.ordensEmMonitoramento.has(ordem.id)) {
                    this.ordensEmMonitoramento.add(ordem.id);
                    
                    // Verificar condições de fechamento para cada ordem
                    await this.verificarCondicoesFechamento(ordem, dadosUsuario);
                    
                    this.ordensEmMonitoramento.delete(ordem.id);
                }
            }

        } catch (error) {
            console.error(`❌ Erro ao verificar ordens: ${error.message}`);
        } finally {
            client.release();
        }
    }

    async verificarCondicoesFechamento(ordem, dadosUsuario) {
        try {
            // Buscar preço atual do ativo
            const precoAtual = await this.obterPrecoAtual(ordem.symbol, ordem.exchange_name);
            
            if (!precoAtual) {
                console.log(`⚠️ Não foi possível obter preço atual para ${ordem.symbol}`);
                return;
            }

            const precoEntrada = parseFloat(ordem.entry_price);
            const takeProfit = parseFloat(ordem.take_profit);
            const stopLoss = parseFloat(ordem.stop_loss);

            let deveFecha = false;
            let motivoFechamento = '';

            // Verificar Take Profit
            if (ordem.side === 'BUY' || ordem.side === 'LONG') {
                if (precoAtual >= takeProfit) {
                    deveFecha = true;
                    motivoFechamento = 'take_profit';
                } else if (precoAtual <= stopLoss) {
                    deveFecha = true;
                    motivoFechamento = 'stop_loss';
                }
            } else { // SELL ou SHORT
                if (precoAtual <= takeProfit) {
                    deveFecha = true;
                    motivoFechamento = 'take_profit';
                } else if (precoAtual >= stopLoss) {
                    deveFecha = true;
                    motivoFechamento = 'stop_loss';
                }
            }

            // Verificar outras condições (tempo máximo, etc.)
            const tempoOperacao = Date.now() - new Date(ordem.created_at).getTime();
            const tempoMaximo = 24 * 60 * 60 * 1000; // 24 horas

            if (tempoOperacao > tempoMaximo) {
                deveFecha = true;
                motivoFechamento = 'tempo_maximo';
            }

            // Fechar ordem se necessário
            if (deveFecha) {
                await this.fecharOrdemAutomaticamente(ordem.id, precoAtual, motivoFechamento);
            }

        } catch (error) {
            console.error(`❌ Erro ao verificar condições: ${error.message}`);
        }
    }

    async fecharOrdemAutomaticamente(ordemId, precoFechamento, motivo) {
        console.log(`🔒 Fechando ordem ${ordemId} automaticamente - Motivo: ${motivo}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar dados da ordem
            const ordem = await client.query(`
                SELECT * FROM trading_operations 
                WHERE id = $1 AND status = 'open'
            `, [ordemId]);

            if (ordem.rows.length === 0) {
                console.log(`⚠️ Ordem ${ordemId} não encontrada ou já fechada`);
                return;
            }

            const op = ordem.rows[0];

            // Calcular resultado
            const resultado = this.calcularResultado(op, precoFechamento);

            // Atualizar ordem no banco
            await client.query(`
                UPDATE trading_operations 
                SET status = 'closed', exit_price = $1, closed_at = NOW(),
                    profit_loss = $2, profit_loss_percentage = $3, 
                    close_reason = $4, auto_closed = true
                WHERE id = $5
            `, [
                precoFechamento, resultado.lucro, resultado.percentual, 
                motivo, ordemId
            ]);

            // Executar fechamento real na exchange
            const fechamentoExchange = await this.executarFechamentoNaExchange(op, precoFechamento);

            // Registrar transação financeira
            await client.query(`
                INSERT INTO financial_transactions (
                    user_id, type, amount, currency, status, operation_id,
                    description, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [
                op.user_id, 
                resultado.lucro > 0 ? 'trading_profit' : 'trading_loss',
                Math.abs(resultado.lucro), 
                'USDT', 'completed', ordemId,
                `Fechamento automático - ${motivo}: ${resultado.lucro > 0 ? '+' : ''}${resultado.lucro.toFixed(2)}`
            ]);

            await client.query('COMMIT');

            console.log(`✅ Ordem ${ordemId} fechada automaticamente`);
            console.log(`💰 Resultado: ${resultado.lucro > 0 ? '+' : ''}${resultado.lucro.toFixed(2)} (${resultado.percentual.toFixed(2)}%)`);

            // Notificar usuário
            await this.notificarFechamentoAutomatico(op.user_id, {
                ordemId: ordemId,
                symbol: op.symbol,
                motivo: motivo,
                resultado: resultado,
                precoFechamento: precoFechamento
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro ao fechar ordem automaticamente: ${error.message}`);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 2. INTEGRAÇÃO COM EXCHANGES
    // ========================================

    async obterPrecoAtual(symbol, exchangeName) {
        try {
            // Simular obtenção de preço (substituir por API real)
            switch (exchangeName.toLowerCase()) {
                case 'binance':
                    return await this.obterPrecoBinance(symbol);
                case 'bybit':
                    return await this.obterPrecoBybit(symbol);
                case 'okx':
                    return await this.obterPrecoOKX(symbol);
                default:
                    console.log(`⚠️ Exchange ${exchangeName} não suportada para obter preço`);
                    return null;
            }
        } catch (error) {
            console.error(`❌ Erro ao obter preço: ${error.message}`);
            return null;
        }
    }

    async obterPrecoBinance(symbol) {
        // Simulação - Em produção, usar API real da Binance
        const precosSimulados = {
            'BTCUSDT': 45000 + (Math.random() - 0.5) * 2000,
            'ETHUSDT': 3000 + (Math.random() - 0.5) * 200,
            'ADAUSDT': 0.5 + (Math.random() - 0.5) * 0.1
        };

        return precosSimulados[symbol] || 1000;
    }

    async obterPrecoBybit(symbol) {
        // Simulação - Em produção, usar API real da Bybit
        const precosSimulados = {
            'BTCUSDT': 45000 + (Math.random() - 0.5) * 2000,
            'ETHUSDT': 3000 + (Math.random() - 0.5) * 200,
            'ADAUSDT': 0.5 + (Math.random() - 0.5) * 0.1
        };

        return precosSimulados[symbol] || 1000;
    }

    async obterPrecoOKX(symbol) {
        // Simulação - Em produção, usar API real da OKX
        const precosSimulados = {
            'BTCUSDT': 45000 + (Math.random() - 0.5) * 2000,
            'ETHUSDT': 3000 + (Math.random() - 0.5) * 200,
            'ADAUSDT': 0.5 + (Math.random() - 0.5) * 0.1
        };

        return precosSimulados[symbol] || 1000;
    }

    async executarFechamentoNaExchange(ordem, precoFechamento) {
        try {
            console.log(`🔄 Executando fechamento na ${ordem.exchange_name} - Ordem: ${ordem.order_id}`);

            // Simular fechamento na exchange
            // Em produção, fazer chamada real para API da exchange
            
            return {
                sucesso: true,
                orderId: ordem.order_id,
                precoExecucao: precoFechamento,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Erro ao fechar na exchange: ${error.message}`);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    // ========================================
    // 3. CÁLCULOS E UTILITÁRIOS
    // ========================================

    calcularResultado(ordem, precoSaida) {
        const precoEntrada = parseFloat(ordem.entry_price);
        const quantidade = parseFloat(ordem.quantity);
        const alavancagem = parseFloat(ordem.leverage);

        let percentualVariacao;
        if (ordem.side === 'BUY' || ordem.side === 'LONG') {
            percentualVariacao = ((precoSaida - precoEntrada) / precoEntrada) * 100;
        } else {
            percentualVariacao = ((precoEntrada - precoSaida) / precoEntrada) * 100;
        }

        const percentualComAlavancagem = percentualVariacao * alavancagem;
        const valorInvestido = quantidade * precoEntrada;
        const lucro = (valorInvestido * percentualComAlavancagem) / 100;

        return {
            lucro: lucro,
            percentual: percentualComAlavancagem,
            valorInvestido: valorInvestido,
            precoEntrada: precoEntrada,
            precoSaida: precoSaida
        };
    }

    async notificarFechamentoAutomatico(userId, dadosFechamento) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO user_notifications (
                    user_id, type, title, message, data, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, 'unread', NOW())
            `, [
                userId,
                'auto_order_close',
                'Ordem fechada automaticamente',
                `Sua operação ${dadosFechamento.symbol} foi fechada automaticamente por ${dadosFechamento.motivo}`,
                JSON.stringify(dadosFechamento)
            ]);

            console.log(`📱 Notificação enviada para usuário ${userId}`);

        } catch (error) {
            console.error(`❌ Erro ao enviar notificação: ${error.message}`);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 4. GESTÃO DO SISTEMA DE MONITORAMENTO
    // ========================================

    async iniciarSistemaMonitoramento() {
        console.log('🚀 Iniciando sistema de monitoramento global');

        try {
            // Buscar todos os usuários com ordens abertas
            const client = await this.pool.connect();
            
            const usuariosComOrdens = await client.query(`
                SELECT DISTINCT user_id 
                FROM trading_operations 
                WHERE status = 'open'
            `);

            client.release();

            // Iniciar monitoramento para cada usuário
            for (const usuario of usuariosComOrdens.rows) {
                await this.iniciarMonitoramentoUsuario(usuario.user_id);
            }

            console.log(`✅ Sistema iniciado para ${usuariosComOrdens.rows.length} usuários`);

        } catch (error) {
            console.error(`❌ Erro ao iniciar sistema: ${error.message}`);
        }
    }

    async pararSistemaMonitoramento() {
        console.log('⏹️ Parando sistema de monitoramento global');

        for (const [userId, intervaloId] of this.intervalosMonitoramento.entries()) {
            clearInterval(intervaloId);
        }

        this.intervalosMonitoramento.clear();
        this.ordensEmMonitoramento.clear();

        console.log('✅ Sistema de monitoramento parado');
    }

    obterEstatisticasMonitoramento() {
        return {
            usuariosMonitorados: this.intervalosMonitoramento.size,
            ordensEmProcessamento: this.ordensEmMonitoramento.size,
            sistemaAtivo: this.intervalosMonitoramento.size > 0
        };
    }
}

// Inicializar sistema se executado diretamente
if (require.main === module) {
    const gestor = new GestorFechamentoOrdens();
    
    // Iniciar sistema
    gestor.iniciarSistemaMonitoramento().then(() => {
        console.log('📊 Sistema de fechamento automático rodando...');
    }).catch(error => {
        console.error('❌ Erro ao iniciar:', error.message);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Parando sistema...');
        await gestor.pararSistemaMonitoramento();
        process.exit(0);
    });
}

module.exports = GestorFechamentoOrdens;
