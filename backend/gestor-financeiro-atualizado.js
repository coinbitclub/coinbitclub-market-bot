/**
 * 💰 GESTOR FINANCEIRO COMPLETO ATUALIZADO
 * Sistema avançado com compensação de créditos e upgrades/downgrades
 */

const { Pool } = require('pg');
// Stripe opcional - só inicializar se a chave estiver disponível
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

console.log('💰 GESTOR FINANCEIRO COMPLETO ATUALIZADO');
console.log('=======================================');

class GestorFinanceiroAtualizado {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.taxas = {
            stripe_percent: 2.9,
            stripe_fixed: 0.30,
            pix_percent: 0.0,
            ted_fixed: 8.50,
            withdrawal_min: 50.00,
            withdrawal_max: 50000.00,
            planos: {
                'premium': 97,
                'vip': 197
            }
        };
    }

    // ========================================
    // 1. SISTEMA DE CRÉDITOS E COMPENSAÇÃO DE AFILIADOS
    // ========================================

    async solicitarCompensacaoCredito(afiliadoId, valorComissao, motivo) {
        console.log(`💳 Processando compensação de crédito para afiliado ${afiliadoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar saldo de comissões disponível
            const saldoComissoes = await client.query(`
                SELECT COALESCE(SUM(commission_amount), 0) as saldo_total
                FROM affiliate_commissions 
                WHERE affiliate_id = $1 AND status = 'confirmed'
                AND (compensation_status IS NULL OR compensation_status = 'available')
            `, [afiliadoId]);

            const saldoDisponivel = parseFloat(saldoComissoes.rows[0].saldo_total);

            if (saldoDisponivel < valorComissao) {
                throw new Error(`Saldo insuficiente. Disponível: $${saldoDisponivel.toFixed(2)}, Solicitado: $${valorComissao.toFixed(2)}`);
            }

            // Criar solicitação de compensação
            const compensacao = await client.query(`
                INSERT INTO commission_compensations (
                    affiliate_id, requested_amount, compensation_type, status,
                    reason, requested_at
                ) VALUES ($1, $2, 'credit', 'pending', $3, NOW())
                RETURNING id
            `, [afiliadoId, valorComissao, motivo]);

            // Marcar comissões como reservadas para compensação
            await client.query(`
                WITH selected_commissions AS (
                    SELECT id, commission_amount,
                           SUM(commission_amount) OVER (ORDER BY created_at) as running_total
                    FROM affiliate_commissions 
                    WHERE affiliate_id = $2 AND status = 'confirmed'
                    AND (compensation_status IS NULL OR compensation_status = 'available')
                    ORDER BY created_at ASC
                )
                UPDATE affiliate_commissions 
                SET compensation_status = 'reserved', compensation_id = $1
                WHERE id IN (
                    SELECT id FROM selected_commissions 
                    WHERE running_total <= $3
                )
            `, [compensacao.rows[0].id, afiliadoId, valorComissao]);

            await client.query('COMMIT');

            console.log(`✅ Solicitação de compensação criada - ID: ${compensacao.rows[0].id}`);

            return {
                sucesso: true,
                compensacaoId: compensacao.rows[0].id,
                valorSolicitado: valorComissao,
                saldoAnterior: saldoDisponivel
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro na compensação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async aprovarCompensacaoCredito(compensacaoId, adminId) {
        console.log(`✅ Aprovando compensação de crédito ${compensacaoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar dados da compensação
            const compensacao = await client.query(`
                SELECT * FROM commission_compensations 
                WHERE id = $1 AND status = 'pending'
            `, [compensacaoId]);

            if (compensacao.rows.length === 0) {
                throw new Error('Compensação não encontrada ou já processada');
            }

            const comp = compensacao.rows[0];

            // Adicionar créditos ao afiliado
            await client.query(`
                INSERT INTO user_credits (
                    user_id, credit_amount, credit_type, source_type, source_id,
                    description, status, created_at, expires_at
                ) VALUES ($1, $2, 'commission_compensation', 'affiliate_compensation', $3, $4, 'active', NOW(), NOW() + INTERVAL '1 year')
            `, [
                comp.affiliate_id, comp.requested_amount, compensacaoId,
                `Compensação de comissões em créditos - ${comp.reason}`
            ]);

            // Atualizar status da compensação
            await client.query(`
                UPDATE commission_compensations 
                SET status = 'approved', approved_by = $1, approved_at = NOW()
                WHERE id = $2
            `, [adminId, compensacaoId]);

            // Marcar comissões como compensadas
            await client.query(`
                UPDATE affiliate_commissions 
                SET compensation_status = 'completed'
                WHERE compensation_id = $1
            `, [compensacaoId]);

            await client.query('COMMIT');

            console.log(`✅ Compensação aprovada - Créditos adicionados: $${comp.requested_amount}`);

            return {
                sucesso: true,
                creditosAdicionados: comp.requested_amount,
                afiliadoId: comp.affiliate_id
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro ao aprovar compensação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 2. GESTÃO DE PLANOS E UPGRADES/DOWNGRADES
    // ========================================

    async upgradeUsuarioPlano(userId, novoPlano, formaPagamento) {
        console.log(`⬆️ Upgrade de usuário ${userId} para plano ${novoPlano}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar plano atual
            const usuario = await client.query(`
                SELECT subscription_plan, subscription_status 
                FROM users WHERE id = $1
            `, [userId]);

            if (usuario.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const planoAtual = usuario.rows[0].subscription_plan || 'free';
            
            // Definir valores dos planos
            const precosPlanos = {
                'free': 0,
                'premium': 97,
                'vip': 197
            };

            const valorUpgrade = precosPlanos[novoPlano] - precosPlanos[planoAtual];

            if (valorUpgrade <= 0) {
                throw new Error('Plano selecionado não é um upgrade válido');
            }

            let transacaoId;

            // Processar pagamento baseado na forma
            if (formaPagamento.tipo === 'creditos') {
                // Usar créditos do usuário
                const creditos = await this.verificarCreditosUsuario(userId, client);
                
                if (creditos.saldoTotal < valorUpgrade) {
                    throw new Error(`Créditos insuficientes. Disponível: $${creditos.saldoTotal}, Necessário: $${valorUpgrade}`);
                }

                // Debitar créditos
                await this.debitarCreditos(userId, valorUpgrade, `Upgrade para plano ${novoPlano}`, client);
                
                transacaoId = `credit_${Date.now()}`;

            } else if (formaPagamento.tipo === 'stripe') {
                // Processar pagamento via Stripe
                const pagamento = await this.processarPagamentoStripe({
                    amount: valorUpgrade * 100, // centavos
                    currency: 'usd',
                    customer_id: formaPagamento.customer_id,
                    payment_method: formaPagamento.payment_method,
                    description: `Upgrade para plano ${novoPlano}`
                });

                if (!pagamento.sucesso) {
                    throw new Error(`Erro no pagamento: ${pagamento.erro}`);
                }

                transacaoId = pagamento.transacaoId;

            } else if (formaPagamento.tipo === 'prepago') {
                // Debitar saldo pré-pago
                const saldoPrepago = await this.verificarSaldoPrepago(userId, client);
                
                if (saldoPrepago < valorUpgrade) {
                    throw new Error(`Saldo pré-pago insuficiente. Disponível: $${saldoPrepago}, Necessário: $${valorUpgrade}`);
                }

                await this.debitarSaldoPrepago(userId, valorUpgrade, `Upgrade para plano ${novoPlano}`, client);
                
                transacaoId = `prepaid_${Date.now()}`;
            }

            // Atualizar plano do usuário
            await client.query(`
                UPDATE users 
                SET subscription_plan = $1, subscription_status = 'active',
                    subscription_updated_at = NOW()
                WHERE id = $2
            `, [novoPlano, userId]);

            // Registrar transação
            await client.query(`
                INSERT INTO financial_transactions (
                    user_id, type, amount, currency, status, transaction_id,
                    description, created_at, metadata
                ) VALUES ($1, 'subscription_upgrade', $2, 'USD', 'completed', $3, $4, NOW(), $5)
            `, [
                userId, valorUpgrade, transacaoId,
                `Upgrade de ${planoAtual} para ${novoPlano}`,
                JSON.stringify({ 
                    plano_anterior: planoAtual, 
                    plano_novo: novoPlano,
                    forma_pagamento: formaPagamento.tipo 
                })
            ]);

            await client.query('COMMIT');

            console.log(`✅ Upgrade realizado com sucesso - ${planoAtual} → ${novoPlano}`);

            return {
                sucesso: true,
                planoAnterior: planoAtual,
                planoNovo: novoPlano,
                valorPago: valorUpgrade,
                transacaoId: transacaoId
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro no upgrade: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async downgradeUsuarioPlano(userId, novoPlano, motivo) {
        console.log(`⬇️ Downgrade de usuário ${userId} para plano ${novoPlano}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar plano atual
            const usuario = await client.query(`
                SELECT subscription_plan, subscription_status 
                FROM users WHERE id = $1
            `, [userId]);

            const planoAtual = usuario.rows[0].subscription_plan;

            // Verificar se é downgrade válido
            const hierarquiaPlanos = ['free', 'premium', 'vip'];
            const indexAtual = hierarquiaPlanos.indexOf(planoAtual);
            const indexNovo = hierarquiaPlanos.indexOf(novoPlano);

            if (indexNovo >= indexAtual) {
                throw new Error('Plano selecionado não é um downgrade válido');
            }

            // Atualizar plano
            await client.query(`
                UPDATE users 
                SET subscription_plan = $1, subscription_status = 'active',
                    subscription_updated_at = NOW()
                WHERE id = $2
            `, [novoPlano, userId]);

            // Registrar mudança
            await client.query(`
                INSERT INTO financial_transactions (
                    user_id, type, amount, currency, status, description, created_at, metadata
                ) VALUES ($1, 'subscription_downgrade', 0, 'USD', 'completed', $2, NOW(), $3)
            `, [
                userId, 
                `Downgrade de ${planoAtual} para ${novoPlano}: ${motivo}`,
                JSON.stringify({ plano_anterior: planoAtual, plano_novo: novoPlano, motivo: motivo })
            ]);

            await client.query('COMMIT');

            console.log(`✅ Downgrade realizado - ${planoAtual} → ${novoPlano}`);

            return {
                sucesso: true,
                planoAnterior: planoAtual,
                planoNovo: novoPlano
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro no downgrade: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 3. GESTÃO DE CRÉDITOS
    // ========================================

    async verificarCreditosUsuario(userId, client) {
        const creditos = await client.query(`
            SELECT COALESCE(SUM(credit_amount), 0) as saldo_total
            FROM user_credits 
            WHERE user_id = $1 AND status = 'active' 
            AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId]);

        return {
            saldoTotal: parseFloat(creditos.rows[0].saldo_total)
        };
    }

    async debitarCreditos(userId, valor, descricao, client) {
        // Buscar créditos disponíveis em ordem de expiração
        const creditos = await client.query(`
            SELECT id, credit_amount, expires_at
            FROM user_credits 
            WHERE user_id = $1 AND status = 'active' 
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY expires_at ASC NULLS LAST
        `, [userId]);

        let valorRestante = valor;
        
        for (const credito of creditos.rows) {
            if (valorRestante <= 0) break;

            const valorCredito = parseFloat(credito.credit_amount);
            const valorADebitar = Math.min(valorRestante, valorCredito);

            if (valorADebitar >= valorCredito) {
                // Usar todo o crédito
                await client.query(`
                    UPDATE user_credits 
                    SET status = 'used', used_at = NOW(), used_description = $1
                    WHERE id = $2
                `, [descricao, credito.id]);
            } else {
                // Usar parcialmente
                await client.query(`
                    UPDATE user_credits 
                    SET credit_amount = credit_amount - $1
                    WHERE id = $2
                `, [valorADebitar, credito.id]);

                // Criar registro do uso parcial
                await client.query(`
                    INSERT INTO credit_usage_log (
                        credit_id, user_id, amount_used, description, created_at
                    ) VALUES ($1, $2, $3, $4, NOW())
                `, [credito.id, userId, valorADebitar, descricao]);
            }

            valorRestante -= valorADebitar;
        }

        if (valorRestante > 0) {
            throw new Error(`Créditos insuficientes. Faltam $${valorRestante.toFixed(2)}`);
        }
    }

    async verificarSaldoPrepago(userId, client) {
        const saldo = await client.query(`
            SELECT COALESCE(prepaid_balance, 0) as saldo
            FROM users WHERE id = $1
        `, [userId]);

        return parseFloat(saldo.rows[0]?.saldo || 0);
    }

    async debitarSaldoPrepago(userId, valor, descricao, client) {
        const resultado = await client.query(`
            UPDATE users 
            SET prepaid_balance = prepaid_balance - $1
            WHERE id = $2 AND prepaid_balance >= $1
            RETURNING prepaid_balance
        `, [valor, userId]);

        if (resultado.rows.length === 0) {
            throw new Error('Saldo pré-pago insuficiente');
        }

        // Registrar movimentação
        await client.query(`
            INSERT INTO financial_transactions (
                user_id, type, amount, currency, status, description, created_at
            ) VALUES ($1, 'prepaid_debit', $2, 'USD', 'completed', $3, NOW())
        `, [userId, valor, descricao]);
    }

    // ========================================
    // 4. PROCESSAMENTO STRIPE
    // ========================================

    async processarPagamentoStripe(dadosPagamento) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: dadosPagamento.amount,
                currency: dadosPagamento.currency,
                customer: dadosPagamento.customer_id,
                payment_method: dadosPagamento.payment_method,
                description: dadosPagamento.description,
                confirm: true,
                return_url: process.env.STRIPE_RETURN_URL
            });

            return {
                sucesso: paymentIntent.status === 'succeeded',
                transacaoId: paymentIntent.id,
                status: paymentIntent.status
            };

        } catch (error) {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }
}

module.exports = GestorFinanceiroAtualizado;
