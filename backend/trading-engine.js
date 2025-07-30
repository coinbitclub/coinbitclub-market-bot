#!/usr/bin/env node

/**
 * 📈 MOTOR DE TRADING - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Motor principal de execução de trades com Bybit
 * Gerencia operações multiusuário com diferentes estratégias
 */

const { Pool } = require('pg');
const crypto = require('crypto');

class TradingEngine {
    constructor() {
        this.id = 'trading-engine';
        this.nome = 'Motor de Trading';
        this.tipo = 'core';
        this.status = 'inicializando';
        this.dependencias = ['api-key-manager', 'user-manager'];
        
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.metricas = {
            inicializado_em: null,
            trades_executados: 0,
            trades_lucrativos: 0,
            volume_total: 0,
            lucro_total: 0,
            usuarios_ativos_trading: 0,
            ultima_operacao: null
        };

        this.configTrading = {
            max_operacoes_simultaneas: 10,
            leverage_padrao: 5, // ✅ Alavancagem padrão = 5x (conforme especificação)
            stop_loss_padrao: 0.10, // ✅ SL = 2 × alavancagem = 2 × 5 = 10%
            take_profit_padrao: 0.15, // ✅ TP = 3 × alavancagem = 3 × 5 = 15%
            risk_per_trade: 0.30 // ✅ 30% do saldo por operação (conforme regras)
        };

        this.operacoesAtivas = new Map();
        this.filaOrdens = [];
    }

    async inicializar() {
        console.log(`🚀 Inicializando ${this.nome}...`);
        
        try {
            // Verificar estrutura de trading
            await this.verificarEstruturaTradingOperations();
            
            // Carregar operações ativas
            await this.carregarOperacoesAtivas();
            
            // Configurar monitoramento de mercado
            await this.configurarMonitoramentoMercado();
            
            // Inicializar processamento de ordens
            await this.inicializarProcessamentoOrdens();
            
            this.status = 'ativo';
            this.metricas.inicializado_em = new Date();
            
            console.log(`✅ ${this.nome} inicializado com sucesso`);
            console.log(`📊 Operações ativas: ${this.operacoesAtivas.size}`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.nome}:`, error.message);
            this.status = 'erro';
            return false;
        }
    }

    async verificarEstruturaTradingOperations() {
        console.log('🔍 Verificando estrutura trading_operations...');
        
        try {
            // Verificar se tabela existe
            const tabelaExiste = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = 'trading_operations' AND table_schema = 'public'
            `);

            if (parseInt(tabelaExiste.rows[0].count) === 0) {
                console.log('🔧 Criando tabela trading_operations...');
                await this.criarTabelaTradingOperations();
            } else {
                console.log('✅ Tabela trading_operations encontrada');
            }

            // Verificar colunas essenciais
            await this.verificarColunasEssenciais();

        } catch (error) {
            console.error('❌ Erro ao verificar estrutura:', error.message);
            throw error;
        }
    }

    async criarTabelaTradingOperations() {
        const sql = `
            CREATE TABLE IF NOT EXISTS trading_operations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                signal_id INTEGER,
                symbol VARCHAR(20) NOT NULL,
                side VARCHAR(10) NOT NULL, -- 'buy' ou 'sell'
                size DECIMAL(20,8) NOT NULL,
                leverage INTEGER DEFAULT 5, -- ✅ Alavancagem padrão = 5x
                entry_price DECIMAL(20,8),
                current_price DECIMAL(20,8),
                stop_loss DECIMAL(20,8),
                take_profit DECIMAL(20,8),
                pnl DECIMAL(20,8) DEFAULT 0,
                pnl_percentage DECIMAL(10,4) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending', -- pending, active, closed, cancelled
                order_id VARCHAR(100),
                exchange VARCHAR(20) DEFAULT 'bybit',
                created_at TIMESTAMP DEFAULT NOW(),
                opened_at TIMESTAMP,
                closed_at TIMESTAMP,
                metadata JSONB
            );

            CREATE INDEX IF NOT EXISTS idx_trading_operations_user_id ON trading_operations(user_id);
            CREATE INDEX IF NOT EXISTS idx_trading_operations_status ON trading_operations(status);
            CREATE INDEX IF NOT EXISTS idx_trading_operations_symbol ON trading_operations(symbol);
            CREATE INDEX IF NOT EXISTS idx_trading_operations_created_at ON trading_operations(created_at);
        `;

        await this.pool.query(sql);
        console.log('✅ Tabela trading_operations criada');
    }

    async verificarColunasEssenciais() {
        const colunasEssenciais = [
            'pnl', 'pnl_percentage', 'leverage', 'stop_loss', 'take_profit'
        ];

        for (const coluna of colunasEssenciais) {
            try {
                await this.pool.query(`SELECT ${coluna} FROM trading_operations LIMIT 1`);
                console.log(`✅ Coluna encontrada: ${coluna}`);
            } catch (error) {
                console.log(`⚠️ Coluna faltante: ${coluna}`);
                // Implementar adição de colunas se necessário
            }
        }
    }

    async carregarOperacoesAtivas() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    t.*,
                    u.name as user_name,
                    u.email as user_email,
                    k.api_key,
                    k.secret_key
                FROM trading_operations t
                INNER JOIN users u ON t.user_id = u.id
                INNER JOIN user_api_keys k ON u.id = k.user_id
                WHERE t.status = 'active' AND k.is_active = true
            `);

            this.operacoesAtivas.clear();
            
            result.rows.forEach(operacao => {
                this.operacoesAtivas.set(operacao.id, operacao);
            });

            console.log(`📊 ${this.operacoesAtivas.size} operações ativas carregadas`);

        } catch (error) {
            console.error('❌ Erro ao carregar operações ativas:', error.message);
        }
    }

    async configurarMonitoramentoMercado() {
        console.log('📊 Configurando monitoramento de mercado...');

        // Monitorar preços a cada 5 segundos
        setInterval(async () => {
            await this.atualizarPrecosOperacoes();
        }, 5000);

        // Verificar stop loss / take profit a cada 2 segundos
        setInterval(async () => {
            await this.verificarStopLossTakeProfit();
        }, 2000);
    }

    async inicializarProcessamentoOrdens() {
        console.log('⚙️ Inicializando processamento de ordens...');

        // Processar fila de ordens a cada 1 segundo
        setInterval(async () => {
            await this.processarFilaOrdens();
        }, 1000);
    }

    async executarTrade(parametros) {
        try {
            const { 
                userId, 
                symbol, 
                side, 
                quantity, 
                leverage = this.configTrading.leverage_padrao,
                stop_loss,
                take_profit,
                signal_id
            } = parametros;

            console.log(`📈 Executando trade: ${symbol} ${side} ${quantity}`);

            // Verificar se usuário pode operar
            const podeOperar = await this.verificarPermissaoUsuario(userId);
            if (!podeOperar) {
                throw new Error('Usuário não autorizado a operar');
            }

            // Buscar chaves API do usuário
            const chavesUsuario = await this.obterChavesUsuario(userId);
            if (!chavesUsuario) {
                throw new Error('Chaves API não encontradas');
            }

            // Calcular tamanho da posição baseado no risco
            const tamanhoCalculado = await this.calcularTamanhoPosicao(
                userId, 
                symbol, 
                quantity
            );

            // Obter preço atual
            const precoAtual = await this.obterPrecoAtual(symbol, chavesUsuario);

            // ✅ CALCULAR TP/SL CONFORME REGRAS (sempre no momento da abertura)
            // Alavancagem padrão = 5x
            const alavancagemReal = leverage || 5;
            
            // Stop Loss = 2 × alavancagem (em %)
            const stopLossPercent = 2 * alavancagemReal; // Ex: 2 × 5 = 10%
            
            // Take Profit = 3 × alavancagem (em %)
            const takeProfitPercent = 3 * alavancagemReal; // Ex: 3 × 5 = 15%
            
            // Calcular preços absolutos baseados no preço de entrada
            let stopLossPrice, takeProfitPrice;
            
            if (side.toLowerCase() === 'buy' || side.toLowerCase() === 'long') {
                // LONG: SL abaixo do preço, TP acima
                stopLossPrice = precoAtual * (1 - (stopLossPercent / 100));
                takeProfitPrice = precoAtual * (1 + (takeProfitPercent / 100));
            } else {
                // SHORT: SL acima do preço, TP abaixo
                stopLossPrice = precoAtual * (1 + (stopLossPercent / 100));
                takeProfitPrice = precoAtual * (1 - (takeProfitPercent / 100));
            }

            console.log(`⚙️ TP/SL calculados para ${symbol}:`);
            console.log(`   📈 Preço entrada: $${precoAtual}`);
            console.log(`   🎯 Take Profit: $${takeProfitPrice.toFixed(6)} (+${takeProfitPercent}%)`);
            console.log(`   🔻 Stop Loss: $${stopLossPrice.toFixed(6)} (-${stopLossPercent}%)`);
            console.log(`   ⚡ Alavancagem: ${alavancagemReal}x`);

            // Criar registro da operação com TP/SL calculados
            const operacao = await this.criarOperacao({
                user_id: userId,
                signal_id: signal_id,
                symbol: symbol,
                side: side,
                size: tamanhoCalculado,
                leverage: alavancagemReal,
                entry_price: precoAtual,
                stop_loss: stopLossPrice,    // ✅ Preço absoluto calculado
                take_profit: takeProfitPrice, // ✅ Preço absoluto calculado
                status: 'pending'
            });

            // Adicionar à fila de ordens
            this.filaOrdens.push({
                operacao_id: operacao.id,
                user_id: userId,
                chaves: chavesUsuario,
                parametros: {
                    symbol,
                    side,
                    size: tamanhoCalculado,
                    leverage
                }
            });

            console.log(`✅ Trade ${operacao.id} adicionado à fila`);
            return operacao;

        } catch (error) {
            console.error('❌ Erro ao executar trade:', error.message);
            throw error;
        }
    }

    async verificarPermissaoUsuario(userId) {
        try {
            const result = await this.pool.query(`
                SELECT 
                    u.is_active,
                    u.plan_type,
                    COUNT(t.id) as operacoes_ativas
                FROM users u
                LEFT JOIN trading_operations t ON u.id = t.user_id AND t.status = 'active'
                WHERE u.id = $1
                GROUP BY u.id, u.is_active, u.plan_type
            `, [userId]);

            if (result.rows.length === 0) {
                return false;
            }

            const usuario = result.rows[0];
            
            // Verificar se usuário está ativo
            if (!usuario.is_active) {
                return false;
            }

            // Verificar limite de operações simultâneas
            const limiteOperacoes = this.obterLimiteOperacoes(usuario.plan_type);
            if (usuario.operacoes_ativas >= limiteOperacoes) {
                return false;
            }

            return true;

        } catch (error) {
            console.error('❌ Erro ao verificar permissão:', error.message);
            return false;
        }
    }

    obterLimiteOperacoes(planType) {
        const limites = {
            'standard': 5,
            'vip': 20,
            'premium': 50,
            'elite': 100
        };
        return limites[planType] || 5;
    }

    async obterChavesUsuario(userId) {
        try {
            const result = await this.pool.query(`
                SELECT api_key, secret_key, exchange
                FROM user_api_keys
                WHERE user_id = $1 AND is_active = true
                LIMIT 1
            `, [userId]);

            return result.rows.length > 0 ? result.rows[0] : null;

        } catch (error) {
            console.error('❌ Erro ao obter chaves:', error.message);
            return null;
        }
    }

    async calcularTamanhoPosicao(userId, symbol, quantidadeDesejada) {
        try {
            // Buscar saldo do usuário
            const result = await this.pool.query(`
                SELECT balance_usd FROM users WHERE id = $1
            `, [userId]);

            if (result.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const saldo = parseFloat(result.rows[0].balance_usd || 0);
            const riscoPorTrade = saldo * this.configTrading.risk_per_trade;
            
            // Se quantidade desejada é menor que o risco calculado, usar a desejada
            return Math.min(quantidadeDesejada, riscoPorTrade);

        } catch (error) {
            console.error('❌ Erro ao calcular tamanho:', error.message);
            return quantidadeDesejada;
        }
    }

    async obterPrecoAtual(symbol, chaves) {
        try {
            const timestamp = Date.now().toString();
            const url = `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.retCode === 0 && data.result.list.length > 0) {
                return parseFloat(data.result.list[0].lastPrice);
            }

            throw new Error('Não foi possível obter preço');

        } catch (error) {
            console.error(`❌ Erro ao obter preço ${symbol}:`, error.message);
            return 0;
        }
    }

    async criarOperacao(dadosOperacao) {
        try {
            const result = await this.pool.query(`
                INSERT INTO trading_operations (
                    user_id, signal_id, symbol, side, size, leverage,
                    entry_price, stop_loss, take_profit, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                dadosOperacao.user_id,
                dadosOperacao.signal_id,
                dadosOperacao.symbol,
                dadosOperacao.side,
                dadosOperacao.size,
                dadosOperacao.leverage,
                dadosOperacao.entry_price,
                dadosOperacao.stop_loss,
                dadosOperacao.take_profit,
                dadosOperacao.status
            ]);

            return result.rows[0];

        } catch (error) {
            console.error('❌ Erro ao criar operação:', error.message);
            throw error;
        }
    }

    async processarFilaOrdens() {
        if (this.filaOrdens.length === 0) return;

        const ordem = this.filaOrdens.shift();
        
        try {
            // Simular execução da ordem (em produção, faria chamada real para Bybit)
            console.log(`🔄 Processando ordem ${ordem.operacao_id}: ${ordem.parametros.symbol}`);
            
            // Atualizar status para ativo
            await this.pool.query(`
                UPDATE trading_operations 
                SET status = 'active', opened_at = NOW()
                WHERE id = $1
            `, [ordem.operacao_id]);

            // Adicionar às operações ativas
            const operacao = await this.pool.query(`
                SELECT * FROM trading_operations WHERE id = $1
            `, [ordem.operacao_id]);

            this.operacoesAtivas.set(ordem.operacao_id, {
                ...operacao.rows[0],
                chaves: ordem.chaves
            });

            this.metricas.trades_executados++;
            console.log(`✅ Ordem ${ordem.operacao_id} executada com sucesso`);

        } catch (error) {
            console.error(`❌ Erro ao processar ordem ${ordem.operacao_id}:`, error.message);
            
            // Marcar como erro
            await this.pool.query(`
                UPDATE trading_operations 
                SET status = 'error' 
                WHERE id = $1
            `, [ordem.operacao_id]);
        }
    }

    async atualizarPrecosOperacoes() {
        for (const [id, operacao] of this.operacoesAtivas) {
            try {
                const precoAtual = await this.obterPrecoAtual(operacao.symbol, operacao.chaves);
                
                // Calcular PnL
                const pnl = this.calcularPnL(operacao, precoAtual);
                const pnlPercentage = (pnl / (operacao.size * operacao.entry_price)) * 100;

                // Atualizar no banco
                await this.pool.query(`
                    UPDATE trading_operations 
                    SET current_price = $1, pnl = $2, pnl_percentage = $3
                    WHERE id = $4
                `, [precoAtual, pnl, pnlPercentage, id]);

                // Atualizar cache local
                operacao.current_price = precoAtual;
                operacao.pnl = pnl;
                operacao.pnl_percentage = pnlPercentage;

            } catch (error) {
                console.error(`❌ Erro ao atualizar preço operação ${id}:`, error.message);
            }
        }
    }

    async processarSinal(dadosSinal) {
        try {
            console.log(`� Processando sinal: ${dadosSinal.symbol} ${dadosSinal.side}`);
            
            // Validações básicas
            if (!this.validarSinal(dadosSinal)) {
                return { sucesso: false, motivo: 'Sinal inválido' };
            }

            // Verificar janela de validação (30 segundos)
            const agora = new Date();
            const tempoLimite = new Date(dadosSinal.timestamp || agora.getTime() - 30000);
            if (agora - tempoLimite > 30000) {
                console.log('⏰ Sinal expirado - fora da janela de 30 segundos');
                return { sucesso: false, motivo: 'Sinal expirado' };
            }

            // Verificar Fear & Greed
            const fearGreed = await this.obterFearGreed();
            if (!this.validarFearGreed(dadosSinal.side, fearGreed)) {
                return { sucesso: false, motivo: `Sinal ${dadosSinal.side} bloqueado por F&G=${fearGreed}` };
            }

            // Buscar usuários ativos
            const usuariosAtivos = await this.obterUsuariosAtivos();
            console.log(`👥 ${usuariosAtivos.length} usuários ativos encontrados`);

            const resultados = [];
            for (const usuario of usuariosAtivos) {
                const resultado = await this.processarSinalUsuario(usuario, dadosSinal);
                resultados.push(resultado);
            }

            return {
                sucesso: true,
                processados: resultados.length,
                executados: resultados.filter(r => r.sucesso).length,
                detalhes: resultados
            };

        } catch (error) {
            console.error('❌ Erro ao processar sinal:', error.message);
            throw error;
        }
    }

    async executarOrdem(dadosOperacao) {
        try {
            console.log(`⚡ Executando ordem: ${dadosOperacao.symbol} ${dadosOperacao.side}`);

            // Salvar operação no banco primeiro
            const operacaoSalva = await this.criarOperacao(dadosOperacao);
            
            if (!operacaoSalva) {
                return { 
                    sucesso: false, 
                    erro: 'Falha ao salvar operação no banco' 
                };
            }

            // Tentar executar na exchange
            try {
                // Simular execução na Bybit (em produção usar API real)
                const resultadoExchange = await this.simularExecucaoBybit(dadosOperacao);
                
                if (resultadoExchange.sucesso) {
                    // Atualizar status para ativa
                    await this.pool.query(`
                        UPDATE trading_operations 
                        SET status = 'active', exchange_order_id = $1, opened_at = NOW()
                        WHERE id = $2
                    `, [resultadoExchange.order_id, operacaoSalva.id]);

                    // Adicionar ao cache de operações ativas
                    this.operacoesAtivas.set(operacaoSalva.id, {
                        ...operacaoSalva,
                        exchange_order_id: resultadoExchange.order_id,
                        chaves: dadosOperacao.chaves
                    });

                    this.metricas.operacoes_executadas++;
                    
                    return {
                        sucesso: true,
                        operacao_id: operacaoSalva.id,
                        exchange_order_id: resultadoExchange.order_id
                    };
                } else {
                    // Marcar como erro
                    await this.pool.query(`
                        UPDATE trading_operations 
                        SET status = 'error', error_message = $1
                        WHERE id = $2
                    `, [resultadoExchange.erro, operacaoSalva.id]);

                    return {
                        sucesso: false,
                        operacao_id: operacaoSalva.id,
                        erro: resultadoExchange.erro
                    };
                }

            } catch (exchangeError) {
                // Erro na comunicação com exchange
                await this.pool.query(`
                    UPDATE trading_operations 
                    SET status = 'error', error_message = $1
                    WHERE id = $2
                `, [exchangeError.message, operacaoSalva.id]);

                return {
                    sucesso: false,
                    operacao_id: operacaoSalva.id,
                    erro: exchangeError.message
                };
            }

        } catch (error) {
            console.error('❌ Erro crítico na execução:', error.message);
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    validarSinal(sinal) {
        // Validações básicas
        if (!sinal.symbol || !sinal.signal_type || !sinal.entry_price) {
            return false;
        }

        if (!['buy', 'sell'].includes(sinal.signal_type)) {
            return false;
        }

        if (sinal.entry_price <= 0) {
            return false;
        }

        return true;
    }

    async obterUsuariosAtivos() {
        try {
            const result = await this.pool.query(`
                SELECT DISTINCT u.id, u.plan_type, u.vip_status, u.balance_usd,
                       k.api_key, k.api_secret, k.is_testnet
                FROM users u
                INNER JOIN user_api_keys k ON u.id = k.user_id
                WHERE u.is_active = true AND k.is_active = true
                AND u.balance_usd > 10 -- Saldo mínimo
            `);

            return result.rows.map(row => ({
                id: row.id,
                plan_type: row.plan_type,
                vip_status: row.vip_status,
                balance_usd: parseFloat(row.balance_usd),
                chaves: {
                    api_key: row.api_key,
                    api_secret: row.api_secret,
                    is_testnet: row.is_testnet
                }
            }));

        } catch (error) {
            console.error('❌ Erro ao obter usuários ativos:', error.message);
            return [];
        }
    }

    async podeOperar(userId, symbol) {
        try {
            // Verificar se já tem operações ativas demais
            const operacoesAtivas = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM trading_operations 
                WHERE user_id = $1 AND status = 'active'
            `, [userId]);

            const totalAtivas = parseInt(operacoesAtivas.rows[0].count);
            
            // Limite baseado no plano (simplificado)
            const limiteOperacoes = 5; // Pode ser dinâmico baseado no plano
            
            return totalAtivas < limiteOperacoes;

        } catch (error) {
            console.error('❌ Erro ao verificar se pode operar:', error.message);
            return false;
        }
    }

    async simularExecucaoBybit(operacao) {
        // Simulação de execução (substituir por API real em produção)
        return new Promise((resolve) => {
            setTimeout(() => {
                // 90% de chance de sucesso na simulação
                const sucesso = Math.random() > 0.1;
                
                if (sucesso) {
                    resolve({
                        sucesso: true,
                        order_id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                } else {
                    resolve({
                        sucesso: false,
                        erro: 'Ordem rejeitada pela exchange (simulação)'
                    });
                }
            }, 500); // Simular latência
        });
    }

    calcularPnL(operacao, precoAtual) {
        const diferencaPreco = operacao.side === 'buy' 
            ? precoAtual - operacao.entry_price
            : operacao.entry_price - precoAtual;
        
        return diferencaPreco * operacao.size * operacao.leverage;
    }

    async verificarStopLossTakeProfit() {
        for (const [id, operacao] of this.operacoesAtivas) {
            try {
                const precoAtual = operacao.current_price || operacao.entry_price;
                let deveFechar = false;
                let motivo = '';

                // Verificar Stop Loss
                if (operacao.stop_loss) {
                    if (operacao.side === 'buy' && precoAtual <= operacao.stop_loss) {
                        deveFechar = true;
                        motivo = 'stop_loss';
                    } else if (operacao.side === 'sell' && precoAtual >= operacao.stop_loss) {
                        deveFechar = true;
                        motivo = 'stop_loss';
                    }
                }

                // Verificar Take Profit
                if (operacao.take_profit && !deveFechar) {
                    if (operacao.side === 'buy' && precoAtual >= operacao.take_profit) {
                        deveFechar = true;
                        motivo = 'take_profit';
                    } else if (operacao.side === 'sell' && precoAtual <= operacao.take_profit) {
                        deveFechar = true;
                        motivo = 'take_profit';
                    }
                }

                if (deveFechar) {
                    await this.fecharOperacao(id, motivo);
                }

            } catch (error) {
                console.error(`❌ Erro ao verificar SL/TP operação ${id}:`, error.message);
            }
        }
    }

    async fecharOperacao(operacaoId, motivo) {
        try {
            console.log(`🔒 Fechando operação ${operacaoId} por ${motivo}`);

            // Atualizar no banco
            await this.pool.query(`
                UPDATE trading_operations 
                SET status = 'closed', closed_at = NOW(),
                    metadata = COALESCE(metadata, '{}') || $1
                WHERE id = $2
            `, [JSON.stringify({ close_reason: motivo }), operacaoId]);

            // Remover das operações ativas
            const operacao = this.operacoesAtivas.get(operacaoId);
            this.operacoesAtivas.delete(operacaoId);

            // Atualizar métricas
            if (operacao && operacao.pnl > 0) {
                this.metricas.trades_lucrativos++;
                this.metricas.lucro_total += operacao.pnl;
            }

            console.log(`✅ Operação ${operacaoId} fechada com sucesso`);

        } catch (error) {
            console.error(`❌ Erro ao fechar operação ${operacaoId}:`, error.message);
        }
    }

    obterStatus() {
        return {
            id: this.id,
            nome: this.nome,
            tipo: this.tipo,
            status: this.status,
            metricas: {
                ...this.metricas,
                operacoes_ativas: this.operacoesAtivas.size,
                fila_ordens: this.filaOrdens.length
            }
        };
    }

    async finalizar() {
        console.log(`🔄 Finalizando ${this.nome}`);
        this.status = 'finalizado';
        await this.pool.end();
    }

    // ==========================================
    // MÉTODOS DE CONFORMIDADE COM REGRAS OPERACIONAIS
    // ==========================================

    async contarPosicoesAtivas(userId) {
        try {
            const result = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM trading_operations 
                WHERE user_id = $1 AND status = 'active'
            `, [userId]);
            
            return parseInt(result.rows[0].total || 0);
        } catch (error) {
            console.error('❌ Erro ao contar posições ativas:', error.message);
            return 0;
        }
    }

    async verificarBloqueioTicker(userId, symbol) {
        try {
            const result = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM bloqueio_ticker 
                WHERE user_id = $1 AND ticker = $2 AND blocked_until > NOW()
            `, [userId, symbol]);
            
            return parseInt(result.rows[0].total || 0) > 0;
        } catch (error) {
            console.error('❌ Erro ao verificar bloqueio ticker:', error.message);
            return false;
        }
    }

    async verificarPosicaoMesmoAtivo(userId, symbol) {
        try {
            const result = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM trading_operations 
                WHERE user_id = $1 AND symbol = $2 AND status = 'active'
            `, [userId, symbol]);
            
            return parseInt(result.rows[0].total || 0) > 0;
        } catch (error) {
            console.error('❌ Erro ao verificar posição mesmo ativo:', error.message);
            return false;
        }
    }

    async determinarModoOperacao(usuario) {
        try {
            // Regras para TESTNET:
            // 1. Não há saldo pré-pago suficiente
            // 2. Não há assinatura Stripe ativa  
            // 3. Não há crédito bônus disponível

            const saldoMinimo = usuario.plan_type.includes('Brasil') ? 60 : 20;
            
            const temSaldoSuficiente = usuario.prepaid_balance >= saldoMinimo;
            const temStripeAtivo = usuario.stripe_subscription_status === 'active';
            const temCreditoBonus = usuario.credit_bonus > 0;

            if (temSaldoSuficiente || temStripeAtivo || temCreditoBonus) {
                return 'REAL';
            } else {
                // Marcar usuário como modo TESTNET
                await this.pool.query(`
                    UPDATE users SET modo_testnet = true WHERE id = $1
                `, [usuario.id]);
                return 'TESTNET';
            }
        } catch (error) {
            console.error('❌ Erro ao determinar modo operação:', error.message);
            return 'TESTNET'; // Fallback seguro
        }
    }

    async calcularParametrosOperacaoConformeRegras(usuario, dadosSinal, modoOperacao) {
        try {
            // Obter configurações
            const configs = await this.obterConfiguracoesOperacionais();
            
            // ✅ ALAVANCAGEM PADRÃO = 5x (SEMPRE conforme especificação)
            const alavancagem = 5;
            
            // ✅ SL = 2 × alavancagem (SEMPRE) = 2 × 5 = 10%
            const stopLossPercent = 2 * alavancagem;
            
            // ✅ TP = 3 × alavancagem (SEMPRE) = 3 × 5 = 15%
            const takeProfitPercent = 3 * alavancagem;
            
            // ✅ Valor = 30% do saldo da conta (conforme regras)
            const percentualSaldo = 30;
            const valorOperacao = (usuario.balance_usd * percentualSaldo) / 100;

            console.log(`⚙️ Parâmetros calculados conforme regras:`);
            console.log(`   📊 Alavancagem: ${alavancagem}x`);
            console.log(`   🔻 Stop Loss: ${stopLossPercent}% (${alavancagem} × 2)`);
            console.log(`   🎯 Take Profit: ${takeProfitPercent}% (${alavancagem} × 3)`);
            console.log(`   💰 Valor operação: $${valorOperacao.toFixed(2)} (30% do saldo)`);

            return {
                alavancagem,
                stopLossPercent,
                takeProfitPercent,
                valorOperacao,
                modoOperacao
            };
        } catch (error) {
            console.error('❌ Erro ao calcular parâmetros:', error.message);
            // ✅ Parâmetros padrão SEMPRE conforme especificação
            return {
                alavancagem: 5,        // SEMPRE 5x
                stopLossPercent: 10,   // SEMPRE 2 × 5 = 10%
                takeProfitPercent: 15, // SEMPRE 3 × 5 = 15%
                valorOperacao: (usuario.balance_usd * 30) / 100, // SEMPRE 30%
                modoOperacao
            };
        }
    }

    async criarBloqueioTicker(userId, symbol) {
        try {
            await this.pool.query(`
                INSERT INTO bloqueio_ticker (user_id, ticker, blocked_until, reason)
                VALUES ($1, $2, NOW() + INTERVAL '2 hours', 'post_operation_block')
            `, [userId, symbol]);
            
            console.log(`🚫 Bloqueio criado: ${symbol} para usuário ${userId} por 2h`);
        } catch (error) {
            console.error('❌ Erro ao criar bloqueio ticker:', error.message);
        }
    }

    async obterFearGreedComFallback() {
        try {
            // Tentar obter da API
            // TODO: Implementar chamada real à API Fear & Greed
            // Em caso de erro, usar fallback = 50 (conforme regras)
            console.log('📊 Usando Fear & Greed fallback = 50 (conforme regras)');
            return 50;
        } catch (error) {
            console.error('❌ Erro ao obter Fear & Greed, usando fallback:', error.message);
            return 50; // Fallback obrigatório = 50
        }
    }

    async validarFearGreedConformeRegras(side, fearGreed) {
        try {
            // Regras Fear & Greed conforme especificação:
            // < 30: SOMENTE LONG
            // 30-80: LONG E SHORT  
            // > 80: SOMENTE SHORT
            
            if (fearGreed < 30 && side.toLowerCase() === 'sell') {
                console.log(`🚫 Bloqueando SHORT - F&G ${fearGreed} < 30 (somente LONG permitido)`);
                return false;
            }
            
            if (fearGreed > 80 && side.toLowerCase() === 'buy') {
                console.log(`🚫 Bloqueando LONG - F&G ${fearGreed} > 80 (somente SHORT permitido)`);
                return false;
            }
            
            console.log(`✅ Sinal ${side} permitido - F&G ${fearGreed} dentro das regras`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao validar Fear & Greed:', error.message);
            return true; // Em caso de erro, permitir (seguro)
        }
    }

    async obterConfiguracoesOperacionais() {
        try {
            const result = await this.pool.query(`
                SELECT config_key, config_value 
                FROM system_configurations 
                WHERE is_active = true
            `);
            
            const configs = {};
            result.rows.forEach(row => {
                configs[row.config_key] = isNaN(row.config_value) ? 
                    row.config_value : 
                    parseFloat(row.config_value);
            });
            
            return configs;
        } catch (error) {
            console.error('❌ Erro ao obter configurações:', error.message);
            return {}; // Retornar objeto vazio como fallback
        }
    }
}

// Inicializar se executado diretamente
if (require.main === module) {
    const componente = new TradingEngine();
    componente.inicializar().catch(console.error);
}

module.exports = TradingEngine;