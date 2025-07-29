/**
 * 💰 GESTOR FINANCEIRO COMPLETO
 * Sistema completo para administrar e controlar ordens de pagamento e recebimento
 */

const { Pool } = require('pg');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('💰 GESTOR FINANCEIRO - PAGAMENTOS E RECEBIMENTOS');
console.log('===============================================');

class GestorFinanceiro {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.taxas = {
            stripe_percent: 2.9,        // 2.9% + R$0.30 por transação
            stripe_fixed: 0.30,
            pix_percent: 0.0,           // PIX sem taxa
            ted_fixed: 8.50,            // TED R$8.50
            trading_commission: 10,     // 10% comissão sobre lucros
            affiliate_commission: 30,   // 30% comissão afiliados
            withdrawal_min: 50.00,      // Saque mínimo R$50
            withdrawal_max: 50000.00    // Saque máximo R$50k/dia
        };

        this.estatisticas = {
            total_deposits: 0,
            total_withdrawals: 0,
            total_commissions: 0,
            pending_payments: 0
        };
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            console.log('   Dados:', JSON.stringify(dados, null, 2));
        }

        // Salvar no banco para auditoria financeira
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO financial_logs (timestamp, level, message, data, created_at)
                VALUES ($1, $2, $3, $4, NOW());
            `, [timestamp, nivel, mensagem, JSON.stringify(dados)]);
            client.release();
        } catch (error) {
            // Não quebrar por erro de log
        }
    }

    // ========================================
    // 1. GESTÃO DE DEPÓSITOS
    // ========================================

    async processarDeposito(userId, valor, metodoPagamento, dadosTransacao = {}) {
        await this.log('info', `Processando depósito para usuário ${userId}`, {
            valor,
            metodo: metodoPagamento,
            dados: dadosTransacao
        });

        const client = await this.pool.connect();
        try {
            // Validar valor mínimo
            if (valor < 10) {
                throw new Error('Valor mínimo para depósito é R$ 10,00');
            }

            // Criar registro de transação pendente
            const transacao = await client.query(`
                INSERT INTO transactions (
                    user_id, type, amount, method, status, 
                    transaction_data, created_at
                ) VALUES ($1, 'deposit', $2, $3, 'pending', $4, NOW())
                RETURNING *;
            `, [userId, valor, metodoPagamento, JSON.stringify(dadosTransacao)]);

            const transacaoId = transacao.rows[0].id;

            // Processar baseado no método
            let resultado;
            switch (metodoPagamento.toLowerCase()) {
                case 'stripe':
                case 'credit_card':
                    resultado = await this.processarStripe(transacaoId, valor, dadosTransacao);
                    break;
                case 'pix':
                    resultado = await this.processarPIX(transacaoId, valor, dadosTransacao);
                    break;
                case 'ted':
                case 'bank_transfer':
                    resultado = await this.processarTED(transacaoId, valor, dadosTransacao);
                    break;
                default:
                    throw new Error(`Método de pagamento ${metodoPagamento} não suportado`);
            }

            // Atualizar status da transação
            await client.query(`
                UPDATE transactions 
                SET status = $1, external_id = $2, updated_at = NOW()
                WHERE id = $3;
            `, [resultado.status, resultado.external_id, transacaoId]);

            if (resultado.status === 'approved') {
                await this.creditarSaldoUsuario(userId, valor, transacaoId, client);
            }

            this.estatisticas.total_deposits += valor;

            await this.log('info', `Depósito processado com sucesso`, {
                transaction_id: transacaoId,
                status: resultado.status,
                external_id: resultado.external_id
            });

            return {
                sucesso: true,
                transaction_id: transacaoId,
                status: resultado.status,
                external_id: resultado.external_id,
                valor_creditado: resultado.status === 'approved' ? valor : 0
            };

        } catch (error) {
            await this.log('error', 'Erro no processamento de depósito', {
                user_id: userId,
                valor,
                metodo: metodoPagamento,
                erro: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async processarStripe(transacaoId, valor, dados) {
        try {
            // Calcular taxa Stripe
            const taxaValor = (valor * this.taxas.stripe_percent / 100) + this.taxas.stripe_fixed;
            const valorLiquido = valor - taxaValor;

            // Simular processamento Stripe (em produção, usar Stripe API real)
            const paymentIntent = {
                id: `pi_stripe_${Date.now()}`,
                status: 'succeeded', // ou 'pending', 'failed'
                amount: Math.round(valor * 100), // Stripe usa centavos
                currency: 'brl'
            };

            await this.log('info', `Transação Stripe processada`, {
                payment_intent: paymentIntent.id,
                valor_bruto: valor,
                taxa: taxaValor,
                valor_liquido: valorLiquido
            });

            return {
                status: 'approved',
                external_id: paymentIntent.id,
                valor_liquido: valorLiquido,
                taxa_aplicada: taxaValor
            };

        } catch (error) {
            await this.log('error', 'Erro no processamento Stripe', { erro: error.message });
            return {
                status: 'failed',
                external_id: null,
                erro: error.message
            };
        }
    }

    async processarPIX(transacaoId, valor, dados) {
        try {
            // PIX sem taxa conforme configuração
            const pixId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Simular processamento PIX (em produção, integrar com gateway PIX)
            const statusPIX = Math.random() > 0.1 ? 'approved' : 'pending'; // 90% aprovação

            await this.log('info', `Transação PIX processada`, {
                pix_id: pixId,
                valor,
                status: statusPIX
            });

            return {
                status: statusPIX,
                external_id: pixId,
                valor_liquido: valor, // PIX sem taxa
                taxa_aplicada: 0
            };

        } catch (error) {
            await this.log('error', 'Erro no processamento PIX', { erro: error.message });
            return {
                status: 'failed',
                external_id: null,
                erro: error.message
            };
        }
    }

    async processarTED(transacaoId, valor, dados) {
        try {
            const tedId = `ted_${Date.now()}`;
            
            // TED sempre pendente para verificação manual
            await this.log('info', `TED registrada para verificação manual`, {
                ted_id: tedId,
                valor,
                dados_bancarios: dados
            });

            return {
                status: 'pending',
                external_id: tedId,
                valor_liquido: valor - this.taxas.ted_fixed,
                taxa_aplicada: this.taxas.ted_fixed
            };

        } catch (error) {
            return {
                status: 'failed',
                external_id: null,
                erro: error.message
            };
        }
    }

    // ========================================
    // 2. GESTÃO DE SAQUES
    // ========================================

    async processarSaque(userId, valor, metodoPagamento, dadosBancarios) {
        await this.log('info', `Processando saque para usuário ${userId}`, {
            valor,
            metodo: metodoPagamento
        });

        const client = await this.pool.connect();
        try {
            // Validações
            if (valor < this.taxas.withdrawal_min) {
                throw new Error(`Valor mínimo para saque é R$ ${this.taxas.withdrawal_min}`);
            }

            if (valor > this.taxas.withdrawal_max) {
                throw new Error(`Valor máximo para saque é R$ ${this.taxas.withdrawal_max}`);
            }

            // Verificar saldo do usuário
            const saldo = await this.obterSaldoUsuario(userId, client);
            if (saldo.saldo_disponivel < valor) {
                throw new Error('Saldo insuficiente para saque');
            }

            // Verificar limite diário
            const saquesHoje = await client.query(`
                SELECT COALESCE(SUM(amount), 0) as total_hoje
                FROM transactions 
                WHERE user_id = $1 AND type = 'withdrawal' 
                AND DATE(created_at) = CURRENT_DATE
                AND status IN ('approved', 'pending');
            `, [userId]);

            if (parseFloat(saquesHoje.rows[0].total_hoje) + valor > this.taxas.withdrawal_max) {
                throw new Error('Limite diário de saque excedido');
            }

            // Criar transação de saque
            const transacao = await client.query(`
                INSERT INTO transactions (
                    user_id, type, amount, method, status,
                    bank_data, created_at
                ) VALUES ($1, 'withdrawal', $2, $3, 'pending', $4, NOW())
                RETURNING *;
            `, [userId, valor, metodoPagamento, JSON.stringify(dadosBancarios)]);

            // Bloquear saldo do usuário
            await this.bloquearSaldoUsuario(userId, valor, transacao.rows[0].id, client);

            this.estatisticas.total_withdrawals += valor;
            this.estatisticas.pending_payments++;

            await this.log('info', `Saque criado e aguardando aprovação`, {
                transaction_id: transacao.rows[0].id,
                valor,
                metodo: metodoPagamento
            });

            return {
                sucesso: true,
                transaction_id: transacao.rows[0].id,
                status: 'pending',
                valor,
                prazo_processamento: this.obterPrazoProcessamento(metodoPagamento)
            };

        } catch (error) {
            await this.log('error', 'Erro no processamento de saque', {
                user_id: userId,
                valor,
                erro: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    async aprovarSaque(transactionId, adminId) {
        const client = await this.pool.connect();
        try {
            const transacao = await client.query(`
                SELECT * FROM transactions WHERE id = $1 AND type = 'withdrawal' AND status = 'pending';
            `, [transactionId]);

            if (transacao.rows.length === 0) {
                throw new Error('Transação não encontrada ou já processada');
            }

            const tx = transacao.rows[0];

            // Executar o saque (integração com banco/PIX)
            const resultado = await this.executarSaque(tx);

            // Atualizar status
            await client.query(`
                UPDATE transactions 
                SET status = $1, approved_by = $2, approved_at = NOW(), external_id = $3
                WHERE id = $4;
            `, ['approved', adminId, resultado.external_id, transactionId]);

            // Debitar saldo definitivamente
            await this.debitarSaldoUsuario(tx.user_id, tx.amount, transactionId, client);

            this.estatisticas.pending_payments--;

            await this.log('info', `Saque aprovado e executado`, {
                transaction_id: transactionId,
                admin_id: adminId,
                external_id: resultado.external_id
            });

            return {
                sucesso: true,
                external_id: resultado.external_id,
                status: 'approved'
            };

        } catch (error) {
            await this.log('error', 'Erro na aprovação de saque', { erro: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 3. GESTÃO DE COMISSÕES
    // ========================================

    async calcularComissaoTrading(userId, lucroOperacao, client = null) {
        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            if (lucroOperacao <= 0) {
                return { comissao: 0, descricao: 'Sem comissão em operação sem lucro' };
            }

            const comissao = lucroOperacao * (this.taxas.trading_commission / 100);

            // Registrar comissão
            await clientLocal.query(`
                INSERT INTO commissions (
                    user_id, type, amount, operation_profit, percentage_applied, created_at
                ) VALUES ($1, 'trading', $2, $3, $4, NOW());
            `, [userId, comissao, lucroOperacao, this.taxas.trading_commission]);

            this.estatisticas.total_commissions += comissao;

            await this.log('info', `Comissão trading calculada`, {
                user_id: userId,
                lucro_operacao: lucroOperacao,
                comissao,
                percentual: this.taxas.trading_commission
            });

            return {
                comissao,
                lucro_liquido: lucroOperacao - comissao,
                percentual: this.taxas.trading_commission,
                descricao: `Comissão ${this.taxas.trading_commission}% sobre lucro`
            };

        } catch (error) {
            await this.log('error', 'Erro no cálculo de comissão trading', { erro: error.message });
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    async calcularComissaoAfiliado(afiliadoId, vendaValor, client = null) {
        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            const comissao = vendaValor * (this.taxas.affiliate_commission / 100);

            // Registrar comissão de afiliado
            await clientLocal.query(`
                INSERT INTO commissions (
                    user_id, type, amount, source_amount, percentage_applied, created_at
                ) VALUES ($1, 'affiliate', $2, $3, $4, NOW());
            `, [afiliadoId, comissao, vendaValor, this.taxas.affiliate_commission]);

            // Creditar na conta do afiliado
            await this.creditarSaldoUsuario(afiliadoId, comissao, null, clientLocal);

            this.estatisticas.total_commissions += comissao;

            await this.log('info', `Comissão afiliado calculada e creditada`, {
                afiliado_id: afiliadoId,
                venda_valor: vendaValor,
                comissao,
                percentual: this.taxas.affiliate_commission
            });

            return {
                comissao,
                percentual: this.taxas.affiliate_commission,
                creditado: true
            };

        } catch (error) {
            await this.log('error', 'Erro no cálculo de comissão afiliado', { erro: error.message });
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    // ========================================
    // 4. GESTÃO DE SALDOS
    // ========================================

    async obterSaldoUsuario(userId, client = null) {
        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            const saldo = await clientLocal.query(`
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as saldo_total,
                    COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'available' THEN amount ELSE 0 END), 0) as saldo_disponivel,
                    COALESCE(SUM(CASE WHEN status = 'blocked' THEN amount ELSE 0 END), 0) as saldo_bloqueado
                FROM user_balances 
                WHERE user_id = $1;
            `, [userId]);

            return saldo.rows[0];

        } catch (error) {
            await this.log('error', 'Erro ao obter saldo do usuário', { erro: error.message });
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    async creditarSaldoUsuario(userId, valor, transactionId, client = null) {
        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            await clientLocal.query(`
                INSERT INTO user_balances (
                    user_id, type, amount, status, transaction_id, description, created_at
                ) VALUES ($1, 'credit', $2, 'available', $3, $4, NOW());
            `, [userId, valor, transactionId, `Crédito - Transação ${transactionId}`]);

            await this.log('info', `Saldo creditado para usuário ${userId}`, {
                valor,
                transaction_id: transactionId
            });

        } catch (error) {
            await this.log('error', 'Erro ao creditar saldo', { erro: error.message });
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    async debitarSaldoUsuario(userId, valor, transactionId, client = null) {
        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            await clientLocal.query(`
                INSERT INTO user_balances (
                    user_id, type, amount, status, transaction_id, description, created_at
                ) VALUES ($1, 'debit', $2, 'processed', $3, $4, NOW());
            `, [userId, valor, transactionId, `Débito - Transação ${transactionId}`]);

            await this.log('info', `Saldo debitado para usuário ${userId}`, {
                valor,
                transaction_id: transactionId
            });

        } catch (error) {
            await this.log('error', 'Erro ao debitar saldo', { erro: error.message });
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    async bloquearSaldoUsuario(userId, valor, transactionId, client = null) {
        const clientLocal = client || await this.pool.connect();
        const deveLiberar = !client;

        try {
            await clientLocal.query(`
                INSERT INTO user_balances (
                    user_id, type, amount, status, transaction_id, description, created_at
                ) VALUES ($1, 'debit', $2, 'blocked', $3, $4, NOW());
            `, [userId, valor, transactionId, `Bloqueio - Saque ${transactionId}`]);

            await this.log('info', `Saldo bloqueado para usuário ${userId}`, {
                valor,
                transaction_id: transactionId
            });

        } catch (error) {
            await this.log('error', 'Erro ao bloquear saldo', { erro: error.message });
            throw error;
        } finally {
            if (deveLiberar) {
                clientLocal.release();
            }
        }
    }

    // ========================================
    // 5. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    async gerarRelatorioFinanceiro(periodo = '30d') {
        const client = await this.pool.connect();
        try {
            const intervalo = periodo === '7d' ? '7 days' : 
                             periodo === '30d' ? '30 days' : '1 year';

            const relatorio = await client.query(`
                SELECT 
                    type,
                    method,
                    status,
                    COUNT(*) as total_transacoes,
                    SUM(amount) as valor_total,
                    AVG(amount) as valor_medio
                FROM transactions 
                WHERE created_at >= NOW() - INTERVAL '${intervalo}'
                GROUP BY type, method, status
                ORDER BY type, method, status;
            `);

            const comissoes = await client.query(`
                SELECT 
                    type,
                    COUNT(*) as total_comissoes,
                    SUM(amount) as valor_total_comissoes
                FROM commissions 
                WHERE created_at >= NOW() - INTERVAL '${intervalo}'
                GROUP BY type;
            `);

            return {
                periodo,
                transacoes: relatorio.rows,
                comissoes: comissoes.rows,
                estatisticas: this.estatisticas,
                gerado_em: new Date().toISOString()
            };

        } catch (error) {
            await this.log('error', 'Erro ao gerar relatório financeiro', { erro: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 6. UTILITÁRIOS
    // ========================================

    obterPrazoProcessamento(metodo) {
        const prazos = {
            'pix': '1-2 horas',
            'ted': '1-2 dias úteis',
            'bank_transfer': '1-3 dias úteis',
            'stripe': 'Imediato'
        };
        return prazos[metodo.toLowerCase()] || '1-3 dias úteis';
    }

    async executarSaque(transacao) {
        // Simular execução do saque (integração real com bancos/PIX)
        const externalId = `saque_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Aqui seria a integração real com gateway de pagamentos
        return {
            external_id: externalId,
            status: 'executed'
        };
    }

    async parar() {
        console.log('🛑 Parando Gestor Financeiro...');
        await this.pool.end();
        console.log('✅ Gestor Financeiro parado');
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorFinanceiro();
    
    console.log('💰 Gestor Financeiro ativo...');
    console.log('📊 Configurações de taxas:', gestor.taxas);

    // Cleanup graceful
    process.on('SIGINT', async () => {
        await gestor.parar();
        process.exit(0);
    });
}

module.exports = GestorFinanceiro;
