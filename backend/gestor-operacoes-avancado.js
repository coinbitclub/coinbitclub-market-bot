/**
 * 🚀 GESTOR DE OPERAÇÕES DE TRADING AVANÇADO
 * Sistema completo de abertura/fechamento de ordens com controle de intervalo
 */

const { Pool } = require('pg');

console.log('⚡ GESTOR DE OPERAÇÕES DE TRADING AVANÇADO');
console.log('=========================================');

class GestorOperacoes {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.intervaloMinimo = 2 * 60 * 60 * 1000; // 2 horas em ms
    }

    // ========================================
    // GESTÃO DE OPERAÇÕES COM CONTROLE DE INTERVALO
    // ========================================

    async podeAbrirOperacao(userId, symbol) {
        console.log(`🔍 Verificando se usuário ${userId} pode abrir operação em ${symbol}`);

        const client = await this.pool.connect();
        try {
            // 1. Verificar limite de 2 operações simultâneas
            const operacoesAtivas = await client.query(`
                SELECT COUNT(*) as total 
                FROM trading_operations 
                WHERE user_id = $1 AND status IN ('open', 'pending') AND closed_at IS NULL
            `, [userId]);

            if (parseInt(operacoesAtivas.rows[0].total) >= 2) {
                return {
                    pode: false,
                    motivo: 'Limite de 2 operações simultâneas atingido',
                    codigo: 'MAX_OPERATIONS_REACHED'
                };
            }

            // 2. Verificar intervalo de 2h para mesma moeda
            const ultimaOperacao = await client.query(`
                SELECT created_at, symbol 
                FROM trading_operations 
                WHERE user_id = $1 AND symbol = $2 
                ORDER BY created_at DESC 
                LIMIT 1
            `, [userId, symbol]);

            if (ultimaOperacao.rows.length > 0) {
                const tempoUltimaOperacao = new Date(ultimaOperacao.rows[0].created_at);
                const agora = new Date();
                const diferencaTempo = agora - tempoUltimaOperacao;

                if (diferencaTempo < this.intervaloMinimo) {
                    const tempoRestante = Math.ceil((this.intervaloMinimo - diferencaTempo) / (60 * 1000)); // em minutos
                    
                    return {
                        pode: false,
                        motivo: `Aguarde ${tempoRestante} minutos para nova operação em ${symbol}`,
                        codigo: 'INTERVAL_NOT_REACHED',
                        tempoRestante: tempoRestante
                    };
                }
            }

            // 3. Verificar saldo suficiente
            const saldoSuficiente = await this.verificarSaldoSuficiente(userId, symbol, client);
            if (!saldoSuficiente.suficiente) {
                return {
                    pode: false,
                    motivo: 'Saldo insuficiente para abertura de operação',
                    codigo: 'INSUFFICIENT_BALANCE',
                    saldoNecessario: saldoSuficiente.necessario,
                    saldoDisponivel: saldoSuficiente.disponivel
                };
            }

            return {
                pode: true,
                motivo: 'Operação pode ser aberta',
                codigo: 'OPERATION_ALLOWED'
            };

        } catch (error) {
            console.error(`❌ Erro ao verificar permissão de operação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async abrirOperacao(userId, dadosOperacao) {
        console.log(`📈 Abrindo operação para usuário ${userId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar se pode abrir operação
            const permissao = await this.podeAbrirOperacao(userId, dadosOperacao.symbol);
            if (!permissao.pode) {
                throw new Error(permissao.motivo);
            }

            // Criar registro da operação
            const operacao = await client.query(`
                INSERT INTO trading_operations (
                    user_id, symbol, side, entry_price, quantity, leverage,
                    take_profit, stop_loss, exchange_name, order_id, status,
                    created_at, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
                RETURNING id, created_at
            `, [
                userId, dadosOperacao.symbol, dadosOperacao.side,
                dadosOperacao.entryPrice, dadosOperacao.quantity, dadosOperacao.leverage,
                dadosOperacao.takeProfit, dadosOperacao.stopLoss, dadosOperacao.exchange,
                dadosOperacao.orderId, 'open', JSON.stringify(dadosOperacao.metadata || {})
            ]);

            // Registrar movimentação financeira
            await client.query(`
                INSERT INTO financial_transactions (
                    user_id, type, amount, currency, status, operation_id,
                    description, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [
                userId, 'trading_investment', dadosOperacao.investmentAmount,
                dadosOperacao.currency || 'USDT', 'completed', operacao.rows[0].id,
                `Investimento em operação ${dadosOperacao.symbol} ${dadosOperacao.side}`
            ]);

            await client.query('COMMIT');

            console.log(`✅ Operação aberta com sucesso - ID: ${operacao.rows[0].id}`);

            return {
                sucesso: true,
                operacaoId: operacao.rows[0].id,
                criadaEm: operacao.rows[0].created_at
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro ao abrir operação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async fecharOperacao(operacaoId, precoSaida, motivo = 'manual') {
        console.log(`📉 Fechando operação ${operacaoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar dados da operação
            const operacao = await client.query(`
                SELECT * FROM trading_operations 
                WHERE id = $1 AND status = 'open'
            `, [operacaoId]);

            if (operacao.rows.length === 0) {
                throw new Error('Operação não encontrada ou já fechada');
            }

            const op = operacao.rows[0];

            // Calcular resultado
            const resultado = this.calcularResultadoOperacao(op, precoSaida);

            // Atualizar operação
            await client.query(`
                UPDATE trading_operations 
                SET status = 'closed', exit_price = $1, closed_at = NOW(),
                    profit_loss = $2, profit_loss_percentage = $3, close_reason = $4
                WHERE id = $5
            `, [precoSaida, resultado.lucro, resultado.percentual, motivo, operacaoId]);

            // Registrar resultado financeiro
            await client.query(`
                INSERT INTO financial_transactions (
                    user_id, type, amount, currency, status, operation_id,
                    description, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `, [
                op.user_id, resultado.lucro > 0 ? 'trading_profit' : 'trading_loss',
                Math.abs(resultado.lucro), op.symbol.includes('USDT') ? 'USDT' : 'USD',
                'completed', operacaoId,
                `${resultado.lucro > 0 ? 'Lucro' : 'Prejuízo'} da operação ${op.symbol}`
            ]);

            // Se houve lucro, calcular comissões de afiliados
            if (resultado.lucro > 0) {
                await this.processarComissoesAfiliados(op.user_id, resultado.lucro, client);
            }

            await client.query('COMMIT');

            console.log(`✅ Operação fechada - Resultado: ${resultado.lucro > 0 ? '+' : ''}${resultado.lucro} (${resultado.percentual.toFixed(2)}%)`);

            return {
                sucesso: true,
                resultado: resultado
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro ao fechar operação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    calcularResultadoOperacao(operacao, precoSaida) {
        const precoEntrada = parseFloat(operacao.entry_price);
        const quantidade = parseFloat(operacao.quantity);
        const alavancagem = parseFloat(operacao.leverage);

        let percentualVariacao;
        if (operacao.side === 'BUY' || operacao.side === 'LONG') {
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

    async processarComissoesAfiliados(userId, lucro, client) {
        // Buscar afiliado do usuário
        const afiliado = await client.query(`
            SELECT affiliate_id FROM user_affiliations 
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        if (afiliado.rows.length > 0) {
            const afiliadoId = afiliado.rows[0].affiliate_id;
            
            // Buscar configuração de comissão do afiliado
            const configAfiliado = await client.query(`
                SELECT commission_rate FROM affiliates 
                WHERE user_id = $1 AND status = 'active'
            `, [afiliadoId]);

            if (configAfiliado.rows.length > 0) {
                const taxaComissao = configAfiliado.rows[0].commission_rate || 0.015; // 1.5% padrão
                const comissao = lucro * taxaComissao;

                // Registrar comissão
                await client.query(`
                    INSERT INTO affiliate_commissions (
                        affiliate_id, user_id, commission_amount, commission_rate,
                        source_operation_profit, status, created_at
                    ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
                `, [afiliadoId, userId, comissao, taxaComissao, lucro]);

                console.log(`💰 Comissão de ${comissao.toFixed(2)} registrada para afiliado ${afiliadoId}`);
            }
        }
    }

    async verificarSaldoSuficiente(userId, symbol, client) {
        const baseCurrency = symbol.includes('USDT') ? 'USDT' : 'USD';
        
        const saldo = await client.query(`
            SELECT free_balance FROM user_balances 
            WHERE user_id = $1 AND asset = $2
        `, [userId, baseCurrency]);

        const saldoDisponivel = saldo.rows[0]?.free_balance || 0;
        const saldoNecessario = 50; // Mínimo $50 por operação

        return {
            suficiente: saldoDisponivel >= saldoNecessario,
            disponivel: saldoDisponivel,
            necessario: saldoNecessario
        };
    }

    // ========================================
    // RELATÓRIOS E MONITORAMENTO
    // ========================================

    async obterOperacoesUsuario(userId, limite = 50) {
        const client = await this.pool.connect();
        try {
            const operacoes = await client.query(`
                SELECT 
                    id, symbol, side, entry_price, exit_price, quantity, leverage,
                    take_profit, stop_loss, profit_loss, profit_loss_percentage,
                    status, created_at, closed_at, close_reason, exchange_name
                FROM trading_operations 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `, [userId, limite]);

            return operacoes.rows;

        } catch (error) {
            console.error(`❌ Erro ao buscar operações: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async obterEstatisticasUsuario(userId) {
        const client = await this.pool.connect();
        try {
            const stats = await client.query(`
                SELECT 
                    COUNT(*) as total_operacoes,
                    COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as operacoes_lucro,
                    COUNT(CASE WHEN profit_loss < 0 THEN 1 END) as operacoes_prejuizo,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as operacoes_abertas,
                    COALESCE(SUM(profit_loss), 0) as lucro_total,
                    COALESCE(AVG(profit_loss_percentage), 0) as retorno_medio
                FROM trading_operations 
                WHERE user_id = $1
            `, [userId]);

            const resultado = stats.rows[0];
            const totalOps = parseInt(resultado.total_operacoes);
            const opsLucro = parseInt(resultado.operacoes_lucro);

            return {
                ...resultado,
                taxa_acerto: totalOps > 0 ? (opsLucro / totalOps * 100).toFixed(2) : 0,
                pode_operar: parseInt(resultado.operacoes_abertas) < 2
            };

        } catch (error) {
            console.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = GestorOperacoes;
