/**
 * 📊 GESTOR DE MONITORAMENTO E ENCERRAMENTO DE POSIÇÕES
 * Sistema avançado para controle automático de posições abertas
 */

const { Pool } = require('pg');
const axios = require('axios');

console.log('📊 GESTOR DE MONITORAMENTO E ENCERRAMENTO');
console.log('========================================');

class GestorMonitoramentoEncerramento {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.monitoramentoAtivo = false;
        this.intervalos = {
            posicoes: null,        // Monitoramento de posições a cada 5s
            precos: null,          // Atualização de preços a cada 10s
            limpeza: null,         // Limpeza de dados a cada 1h
            relatorios: null       // Relatórios a cada 30min
        };

        this.estatisticas = {
            posicoes_monitoradas: 0,
            encerradas_tp: 0,
            encerradas_sl: 0,
            encerradas_manual: 0,
            lucro_total: 0,
            perda_total: 0
        };

        this.precos_cache = new Map(); // Cache de preços atual
    }

    // ========================================
    // 1. INICIALIZAÇÃO E CONTROLE
    // ========================================

    async iniciarMonitoramento() {
        if (this.monitoramentoAtivo) {
            console.log('⚠️ Monitoramento já está ativo');
            return;
        }

        console.log('🚀 Iniciando monitoramento de posições...');
        this.monitoramentoAtivo = true;

        // Monitorar posições abertas a cada 5 segundos
        this.intervalos.posicoes = setInterval(async () => {
            try {
                await this.monitorarPosicoesAbertas();
            } catch (error) {
                console.error('Erro no monitoramento de posições:', error.message);
            }
        }, 5000);

        // Atualizar preços a cada 10 segundos
        this.intervalos.precos = setInterval(async () => {
            try {
                await this.atualizarPrecos();
            } catch (error) {
                console.error('Erro na atualização de preços:', error.message);
            }
        }, 10000);

        // Limpeza de sinais antigos a cada hora
        this.intervalos.limpeza = setInterval(async () => {
            try {
                await this.executarLimpezaAutomatica();
            } catch (error) {
                console.error('Erro na limpeza automática:', error.message);
            }
        }, 3600000); // 1 hora

        // Relatórios a cada 30 minutos
        this.intervalos.relatorios = setInterval(async () => {
            try {
                await this.gerarRelatorioMonitoramento();
            } catch (error) {
                console.error('Erro na geração de relatórios:', error.message);
            }
        }, 1800000); // 30 minutos

        console.log('✅ Monitoramento iniciado com sucesso');
    }

    pararMonitoramento() {
        console.log('🛑 Parando monitoramento...');
        this.monitoramentoAtivo = false;

        Object.values(this.intervalos).forEach(intervalo => {
            if (intervalo) {
                clearInterval(intervalo);
            }
        });

        console.log('✅ Monitoramento parado');
    }

    // ========================================
    // 2. MONITORAMENTO DE POSIÇÕES
    // ========================================

    async monitorarPosicoesAbertas() {
        const client = await this.pool.connect();
        try {
            // Buscar todas as posições abertas
            const posicoes = await client.query(`
                SELECT 
                    uo.*, 
                    u.username, 
                    u.country,
                    uc.alavancagem_preferida,
                    uc.take_profit_preferido,
                    uc.stop_loss_preferido
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                LEFT JOIN usuario_config uc ON u.id = uc.user_id
                WHERE uo.status = 'open'
                AND uo.created_at > NOW() - INTERVAL '24 hours'
                ORDER BY uo.created_at ASC;
            `);

            this.estatisticas.posicoes_monitoradas = posicoes.rows.length;

            for (const posicao of posicoes.rows) {
                await this.verificarCriteriosEncerramento(posicao);
            }

        } catch (error) {
            console.error('Erro no monitoramento de posições:', error.message);
        } finally {
            client.release();
        }
    }

    async verificarCriteriosEncerramento(posicao) {
        try {
            // Obter preço atual
            const precoAtual = await this.obterPrecoAtual(posicao.symbol);
            if (!precoAtual) return;

            const precoEntrada = parseFloat(posicao.entry_price);
            const stopLoss = parseFloat(posicao.stop_loss);
            const takeProfit = parseFloat(posicao.take_profit);

            let deveEncerrar = false;
            let motivo = '';
            let tipoEncerramento = '';

            // Verificar critérios baseados no tipo de posição
            if (posicao.side === 'LONG') {
                // Para posições LONG
                if (precoAtual <= stopLoss) {
                    deveEncerrar = true;
                    motivo = 'Stop Loss atingido';
                    tipoEncerramento = 'stop_loss';
                } else if (precoAtual >= takeProfit) {
                    deveEncerrar = true;
                    motivo = 'Take Profit atingido';
                    tipoEncerramento = 'take_profit';
                }
            } else {
                // Para posições SHORT
                if (precoAtual >= stopLoss) {
                    deveEncerrar = true;
                    motivo = 'Stop Loss atingido';
                    tipoEncerramento = 'stop_loss';
                } else if (precoAtual <= takeProfit) {
                    deveEncerrar = true;
                    motivo = 'Take Profit atingido';
                    tipoEncerramento = 'take_profit';
                }
            }

            // Verificar timeout (sinais não aproveitados em 2 minutos)
            const tempoDecorrido = Date.now() - new Date(posicao.created_at).getTime();
            if (tempoDecorrido > 120000 && !deveEncerrar) { // 2 minutos
                // Verificar se foi baseado em sinal não confirmado
                const sinalData = JSON.parse(posicao.signal_data || '{}');
                if (sinalData.source === 'TradingView' && !sinalData.confirmed) {
                    deveEncerrar = true;
                    motivo = 'Sinal não aproveitado em 2 minutos';
                    tipoEncerramento = 'timeout';
                }
            }

            if (deveEncerrar) {
                await this.encerrarPosicao(posicao, precoAtual, motivo, tipoEncerramento);
            }

        } catch (error) {
            console.error(`Erro ao verificar posição ${posicao.id}:`, error.message);
        }
    }

    async encerrarPosicao(posicao, precoSaida, motivo, tipo) {
        const client = await this.pool.connect();
        try {
            console.log(`🔄 Encerrando posição ${posicao.id}: ${motivo}`);

            // Calcular PnL
            const pnl = this.calcularPnL(posicao, precoSaida);

            // Executar fechamento na exchange (simulado)
            const resultadoExchange = await this.executarFechamentoExchange(posicao, precoSaida);

            // Atualizar posição no banco
            await client.query(`
                UPDATE user_operations 
                SET 
                    status = 'closed',
                    exit_price = $1,
                    pnl = $2,
                    close_reason = $3,
                    closed_at = NOW(),
                    exchange_result = $4
                WHERE id = $5;
            `, [precoSaida, pnl.valor_usd, tipo, JSON.stringify(resultadoExchange), posicao.id]);

            // Aplicar bloqueio no ticker por 2 horas
            await this.aplicarBloqueioTicker(posicao.symbol, client);

            // Processar comissão se houver lucro
            if (pnl.valor_usd > 0) {
                await this.processarComissao(posicao, pnl, client);
            }

            // Atualizar estatísticas
            this.atualizarEstatisticas(tipo, pnl.valor_usd);

            // Notificar usuário se necessário
            await this.notificarEncerramento(posicao, pnl, motivo);

            console.log(`✅ Posição ${posicao.id} encerrada: PnL = $${pnl.valor_usd}`);

        } catch (error) {
            console.error(`Erro ao encerrar posição ${posicao.id}:`, error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 3. GESTÃO DE PREÇOS E DADOS
    // ========================================

    async atualizarPrecos() {
        const simbolos = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'DOTUSDT'];
        
        for (const simbolo of simbolos) {
            try {
                // Simular obtenção de preço (substitua pela API real)
                const preco = await this.buscarPrecoRealtime(simbolo);
                this.precos_cache.set(simbolo, {
                    preco,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error(`Erro ao atualizar preço de ${simbolo}:`, error.message);
            }
        }
    }

    async buscarPrecoRealtime(simbolo) {
        // Simular API de preços em tempo real
        const precosBase = {
            'BTCUSDT': 43000,
            'ETHUSDT': 2500,
            'ADAUSDT': 0.45,
            'BNBUSDT': 310,
            'DOTUSDT': 6.5
        };

        const base = precosBase[simbolo] || 100;
        const variacao = (Math.random() - 0.5) * 0.02; // ±1%
        return base * (1 + variacao);
    }

    async obterPrecoAtual(simbolo) {
        const cache = this.precos_cache.get(simbolo);
        
        // Se o cache tem menos de 30 segundos, usar
        if (cache && (Date.now() - cache.timestamp) < 30000) {
            return cache.preco;
        }

        // Caso contrário, buscar novo preço
        try {
            const preco = await this.buscarPrecoRealtime(simbolo);
            this.precos_cache.set(simbolo, {
                preco,
                timestamp: Date.now()
            });
            return preco;
        } catch (error) {
            console.error(`Erro ao obter preço de ${simbolo}:`, error.message);
            return cache ? cache.preco : null;
        }
    }

    // ========================================
    // 4. LIMPEZA AUTOMÁTICA
    // ========================================

    async executarLimpezaAutomatica() {
        console.log('🧹 Executando limpeza automática...');
        
        const client = await this.pool.connect();
        try {
            // Limpar sinais não processados há mais de 1 hora
            const sinaisLimpos = await client.query(`
                DELETE FROM trading_signals 
                WHERE created_at < NOW() - INTERVAL '1 hour' 
                AND status = 'pending'
                RETURNING id;
            `);

            // Limpar operações encerradas há mais de 2 horas
            const operacoesLimpas = await client.query(`
                DELETE FROM user_operations 
                WHERE status = 'closed' 
                AND closed_at < NOW() - INTERVAL '2 hours'
                AND pnl IS NOT NULL
                RETURNING id;
            `);

            // Limpar cache de preços antigos
            const agora = Date.now();
            for (const [simbolo, data] of this.precos_cache.entries()) {
                if (agora - data.timestamp > 300000) { // 5 minutos
                    this.precos_cache.delete(simbolo);
                }
            }

            console.log(`✅ Limpeza concluída: ${sinaisLimpos.rows.length} sinais, ${operacoesLimpas.rows.length} operações`);

        } catch (error) {
            console.error('Erro na limpeza automática:', error.message);
        } finally {
            client.release();
        }
    }

    // ========================================
    // 5. UTILITÁRIOS E CÁLCULOS
    // ========================================

    calcularPnL(posicao, precoSaida) {
        const precoEntrada = parseFloat(posicao.entry_price);
        const quantidade = parseFloat(posicao.quantity);
        const alavancagem = parseFloat(posicao.parameters_used?.trading?.leverage || 5);

        let pnlBase;
        if (posicao.side === 'LONG') {
            pnlBase = (precoSaida - precoEntrada) * quantidade;
        } else {
            pnlBase = (precoEntrada - precoSaida) * quantidade;
        }

        const pnlComAlavancagem = pnlBase * alavancagem;
        const porcentagem = (pnlComAlavancagem / (precoEntrada * quantidade)) * 100;

        return {
            valor_usd: pnlComAlavancagem.toFixed(6),
            porcentagem: porcentagem.toFixed(2),
            preco_entrada: precoEntrada,
            preco_saida: precoSaida,
            alavancagem
        };
    }

    async aplicarBloqueioTicker(simbolo, client) {
        await client.query(`
            INSERT INTO bloqueio_ticker (symbol, blocked_until, created_at)
            VALUES ($1, NOW() + INTERVAL '2 hours', NOW())
            ON CONFLICT (symbol) 
            DO UPDATE SET 
                blocked_until = NOW() + INTERVAL '2 hours',
                updated_at = NOW();
        `, [simbolo]);
    }

    async processarComissao(posicao, pnl, client) {
        // Buscar plano do usuário para calcular comissão
        const usuario = await client.query(`
            SELECT u.*, up.subscription_type 
            FROM users u
            LEFT JOIN user_plans up ON u.id = up.user_id AND up.status = 'active'
            WHERE u.id = $1;
        `, [posicao.user_id]);

        if (usuario.rows.length === 0) return;

        const user = usuario.rows[0];
        const temPlano = user.subscription_type === 'monthly';
        const taxaComissao = temPlano ? 0.10 : 0.20; // 10% ou 20%

        const valorComissao = parseFloat(pnl.valor_usd) * taxaComissao;

        // Registrar comissão
        await client.query(`
            INSERT INTO user_commissions (
                user_id, operation_id, commission_rate, commission_amount,
                profit_amount, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW());
        `, [posicao.user_id, posicao.id, taxaComissao, valorComissao, pnl.valor_usd]);

        console.log(`💰 Comissão processada: $${valorComissao} (${(taxaComissao * 100)}%)`);
    }

    async executarFechamentoExchange(posicao, precoSaida) {
        // Simular fechamento na exchange
        return {
            exchange: 'binance',
            order_id: `close_${Date.now()}`,
            symbol: posicao.symbol,
            side: posicao.side === 'LONG' ? 'SELL' : 'BUY',
            quantity: posicao.quantity,
            price: precoSaida,
            status: 'FILLED',
            timestamp: new Date().toISOString()
        };
    }

    atualizarEstatisticas(tipo, pnl) {
        switch (tipo) {
            case 'take_profit':
                this.estatisticas.encerradas_tp++;
                break;
            case 'stop_loss':
                this.estatisticas.encerradas_sl++;
                break;
            case 'manual':
                this.estatisticas.encerradas_manual++;
                break;
        }

        if (pnl > 0) {
            this.estatisticas.lucro_total += parseFloat(pnl);
        } else {
            this.estatisticas.perda_total += Math.abs(parseFloat(pnl));
        }
    }

    async notificarEncerramento(posicao, pnl, motivo) {
        // Aqui você implementaria notificação via SMS/WhatsApp
        console.log(`📱 Notificar usuário ${posicao.username}: ${motivo} - PnL: $${pnl.valor_usd}`);
    }

    // ========================================
    // 6. RELATÓRIOS E MONITORAMENTO
    // ========================================

    async gerarRelatorioMonitoramento() {
        console.log('\n📊 RELATÓRIO DE MONITORAMENTO');
        console.log('============================');
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        console.log(`📈 Posições monitoradas: ${this.estatisticas.posicoes_monitoradas}`);
        console.log(`✅ Encerradas TP: ${this.estatisticas.encerradas_tp}`);
        console.log(`🛑 Encerradas SL: ${this.estatisticas.encerradas_sl}`);
        console.log(`🖐️ Encerradas manual: ${this.estatisticas.encerradas_manual}`);
        console.log(`💰 Lucro total: $${this.estatisticas.lucro_total.toFixed(2)}`);
        console.log(`📉 Perda total: $${this.estatisticas.perda_total.toFixed(2)}`);
        console.log(`💾 Preços em cache: ${this.precos_cache.size}`);
    }

    async obterEstatisticasCompletas() {
        const client = await this.pool.connect();
        try {
            const stats = await client.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'open') as posicoes_abertas,
                    COUNT(*) FILTER (WHERE status = 'closed') as posicoes_fechadas,
                    COUNT(*) FILTER (WHERE close_reason = 'take_profit') as tp_count,
                    COUNT(*) FILTER (WHERE close_reason = 'stop_loss') as sl_count,
                    AVG(pnl) FILTER (WHERE pnl IS NOT NULL) as pnl_medio,
                    SUM(pnl) FILTER (WHERE pnl > 0) as lucro_total,
                    SUM(pnl) FILTER (WHERE pnl < 0) as perda_total
                FROM user_operations
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
            `);

            return {
                estatisticas_atuais: this.estatisticas,
                estatisticas_banco: stats.rows[0],
                cache_precos: Array.from(this.precos_cache.entries()),
                monitoramento_ativo: this.monitoramentoAtivo,
                ultima_atualizacao: new Date().toISOString()
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas:', error.message);
            return null;
        } finally {
            client.release();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorMonitoramentoEncerramento();
    
    gestor.iniciarMonitoramento();
    
    console.log('✅ Gestor de Monitoramento ativo...');
    
    // Cleanup
    process.on('SIGINT', () => {
        console.log('\n🛑 Parando gestor de monitoramento...');
        gestor.pararMonitoramento();
        process.exit(0);
    });
}

module.exports = GestorMonitoramentoEncerramento;
