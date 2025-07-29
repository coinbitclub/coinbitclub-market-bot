/**
 * 🤝 GESTOR DE AFILIADOS COMPLETO
 * Sistema completo para programa de afiliação com comissões e pagamentos
 * Conforme especificação técnica com percentuais e estruturas de MLM
 */

const { Pool } = require('pg');
const crypto = require('crypto');

console.log('🤝 GESTOR DE AFILIADOS COMPLETO');
console.log('==============================');

class GestorAfiliados {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.configuracoes = {
            comissoes: {
                afiliado_normal: 0.015,      // 1.5% para afiliados normais
                afiliado_vip: 0.05,          // 5% para afiliados VIP
                minimo_payout: 50.00,        // Mínimo R$50 ou $50 para saque
                taxa_saque_brasil: 5.00,     // R$5 taxa saque Brasil
                taxa_saque_internacional: 2.00 // USD$2 taxa saque internacional
            },
            bonificacoes: {
                // Funções prontas mas não ativadas ainda
                primeiro_indicado: 0.00,        // Desabilitado
                meta_mensal_5: 0.00,            // Desabilitado
                meta_mensal_10: 0.00,           // Desabilitado
                meta_mensal_20: 0.00,           // Desabilitado
                lideranca_equipe: 0.00,         // Desabilitado
                bonificacoes_ativas: false      // Flag principal desabilitada
            },
            niveis: {
                normal: { nome: 'Afiliado Normal', comissao: 0.015 },
                vip: { nome: 'Afiliado VIP', comissao: 0.05 }
            },
            validacao: {
                codigo_length: 8,
                link_expiry_days: 365,
                min_volume_ativacao: 100.00
            }
        };

        this.estatisticas = {
            afiliados_ativos: 0,
            total_comissoes_pagas: 0,
            indicacoes_mes: 0,
            volume_gerado: 0
        };
    }

    // ========================================
    // 1. REGISTRO E ATIVAÇÃO DE AFILIADOS
    // ========================================

    async ativarAfiliado(userId, tipoAfiliado = 'normal') {
        console.log(`🤝 Ativando afiliado: ${userId} (${tipoAfiliado})`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar se usuário existe e não é afiliado
            const usuario = await client.query(`
                SELECT id, username, email, country FROM users WHERE id = $1;
            `, [userId]);

            if (usuario.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            // Verificar se já é afiliado
            const jafiliado = await client.query(`
                SELECT id FROM affiliates WHERE user_id = $1;
            `, [userId]);

            if (jafiliado.rows.length > 0) {
                throw new Error('Usuário já é afiliado');
            }

            // Validar tipo de afiliado
            if (!['normal', 'vip'].includes(tipoAfiliado)) {
                throw new Error('Tipo de afiliado inválido. Use: normal ou vip');
            }

            // Gerar código único de afiliado
            const codigoAfiliado = await this.gerarCodigoUnico(client);

            // Criar registro de afiliado
            const afiliado = await client.query(`
                INSERT INTO affiliates (
                    user_id, affiliate_code, affiliate_type, commission_rate,
                    status, total_referrals, total_commissions, created_at
                ) VALUES ($1, $2, $3, $4, 'active', 0, 0, NOW())
                RETURNING id;
            `, [
                userId,
                codigoAfiliado,
                tipoAfiliado,
                this.configuracoes.niveis[tipoAfiliado].comissao
            ]);

            // Criar estatísticas iniciais
            await client.query(`
                INSERT INTO affiliate_stats (
                    affiliate_id, month_year, referrals_count, 
                    commissions_earned, bonuses_earned, created_at
                ) VALUES ($1, $2, 0, 0, 0, NOW());
            `, [afiliado.rows[0].id, this.getMesAno()]);

            await client.query('COMMIT');

            console.log(`✅ Afiliado ${tipoAfiliado} ativado: ${usuario.rows[0].username} (código: ${codigoAfiliado})`);

            this.estatisticas.afiliados_ativos++;

            return {
                success: true,
                affiliate_id: afiliado.rows[0].id,
                affiliate_code: codigoAfiliado,
                affiliate_type: tipoAfiliado,
                commission_rate: this.configuracoes.niveis[tipoAfiliado].comissao,
                referral_link: this.gerarLinkReferencia(codigoAfiliado)
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao ativar afiliado:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async gerarCodigoUnico(client) {
        let codigo;
        let tentativas = 0;
        
        do {
            codigo = crypto.randomBytes(4).toString('hex').toUpperCase();
            tentativas++;
            
            const existe = await client.query(`
                SELECT id FROM affiliates WHERE affiliate_code = $1;
            `, [codigo]);
            
            if (existe.rows.length === 0) {
                break;
            }
            
            if (tentativas > 10) {
                throw new Error('Erro ao gerar código único');
            }
        } while (true);
        
        return codigo;
    }

    async construirUplineStructure(indicadoPorId, client) {
        const upline = await client.query(`
            SELECT 
                user_id as level_1,
                upline_level_1 as level_2,
                upline_level_2 as level_3
            FROM affiliates 
            WHERE user_id = $1;
        `, [indicadoPorId]);

        if (upline.rows.length === 0) {
            return { level_1: indicadoPorId, level_2: null, level_3: null };
        }

        return upline.rows[0];
    }

    // ========================================
    // 2. PROCESSAMENTO DE COMISSÕES
    // ========================================

    async processarComissaoAfiliacao(userId, operacaoId, lucroOperacao) {
        console.log(`💰 Processando comissão de afiliação para operação ${operacaoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar usuário e seu afiliado indicador
            const usuario = await client.query(`
                SELECT 
                    u.id, u.referred_by, u.country,
                    a.id as affiliate_id, a.affiliate_type, a.commission_rate
                FROM users u
                LEFT JOIN affiliates a ON u.referred_by = a.user_id
                WHERE u.id = $1 AND u.referred_by IS NOT NULL;
            `, [userId]);

            if (usuario.rows.length === 0 || !usuario.rows[0].referred_by) {
                console.log('Usuário não tem afiliado indicador');
                await client.query('COMMIT');
                return { comissoes_processadas: 0 };
            }

            const dadosUsuario = usuario.rows[0];
            const percentualComissao = dadosUsuario.commission_rate;
            const valorComissao = lucroOperacao * percentualComissao;

            // Registrar comissão para o afiliado
            const comissao = await client.query(`
                INSERT INTO affiliate_commissions (
                    affiliate_id, referral_user_id, operation_id,
                    commission_rate, commission_amount, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
                RETURNING id;
            `, [
                dadosUsuario.affiliate_id, userId, operacaoId,
                percentualComissao, valorComissao
            ]);

            // Atualizar saldo do afiliado
            await this.adicionarSaldoAfiliado(dadosUsuario.referred_by, valorComissao, client);

            // Atualizar estatísticas
            await this.atualizarEstatisticasAfiliado(dadosUsuario.affiliate_id, valorComissao, client);

            await client.query('COMMIT');

            console.log(`💰 Comissão processada: ${valorComissao} (${(percentualComissao * 100)}%) para afiliado ${dadosUsuario.affiliate_type}`);

            return {
                comissoes_processadas: 1,
                detalhes: [{
                    affiliate_id: dadosUsuario.referred_by,
                    tipo: dadosUsuario.affiliate_type,
                    valor: valorComissao,
                    commission_id: comissao.rows[0].id
                }]
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao processar comissão de afiliação:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async adicionarSaldoAfiliado(userId, valor, client) {
        // Buscar ou criar saldo de afiliado
        const saldo = await client.query(`
            SELECT id, balance FROM affiliate_balances 
            WHERE user_id = $1;
        `, [userId]);

        if (saldo.rows.length === 0) {
            // Criar novo saldo
            await client.query(`
                INSERT INTO affiliate_balances (
                    user_id, balance, total_earned, 
                    total_withdrawn, updated_at
                ) VALUES ($1, $2, $2, 0, NOW());
            `, [userId, valor]);
        } else {
            // Atualizar saldo existente
            await client.query(`
                UPDATE affiliate_balances 
                SET 
                    balance = balance + $1,
                    total_earned = total_earned + $1,
                    updated_at = NOW()
                WHERE user_id = $2;
            `, [valor, userId]);
        }
    }

    // ========================================
    // 3. SISTEMA DE BONIFICAÇÕES
    // ========================================

    async processarBonusPrimeiroIndicado(afiliadoId, novoIndicadoId, client) {
        // Verificar se é o primeiro indicado
        const contadorIndicados = await client.query(`
            SELECT total_referrals FROM affiliates WHERE user_id = $1;
        `, [afiliadoId]);

        if (contadorIndicados.rows[0]?.total_referrals === 0) {
            const valorBonus = this.configuracoes.bonificacoes.primeiro_indicado;

            // Aplicar bônus
            await client.query(`
                INSERT INTO affiliate_bonuses (
                    affiliate_id, bonus_type, amount, 
                    description, reference_id, created_at
                ) VALUES (
                    (SELECT id FROM affiliates WHERE user_id = $1),
                    'first_referral', $2, $3, $4, NOW()
                );
            `, [
                afiliadoId,
                valorBonus,
                'Bônus primeiro indicado',
                novoIndicadoId
            ]);

            await this.adicionarSaldoAfiliado(afiliadoId, valorBonus, client);

            console.log(`🎁 Bônus primeiro indicado: ${valorBonus} para afiliado ${afiliadoId}`);
        }
    }

    async verificarMetasMensais() {
        console.log('🎯 Verificando metas mensais de afiliados... (FUNÇÃO DESABILITADA)');

        // Função preparada mas não ativa conforme solicitado
        if (!this.configuracoes.bonificacoes.bonificacoes_ativas) {
            console.log('⚠️ Bonificações por metas estão desabilitadas');
            return;
        }

        const client = await this.pool.connect();
        try {
            const mesAtual = this.getMesAno();

            // Buscar afiliados com metas atingidas
            const metasAtingidas = await client.query(`
                SELECT 
                    a.user_id, a.id as affiliate_id,
                    COUNT(r.id) as indicados_mes
                FROM affiliates a
                LEFT JOIN users r ON r.referred_by = a.user_id
                    AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY a.user_id, a.id
                HAVING COUNT(r.id) >= 5;
            `);

            console.log(`📊 ${metasAtingidas.rows.length} afiliados com metas (sistema desabilitado)`);

        } catch (error) {
            console.error('Erro ao verificar metas mensais:', error.message);
        } finally {
            client.release();
        }
    }

    async aplicarBonusMeta(dadosMeta, mesAno, client) {
        const indicados = dadosMeta.indicados_mes;
        let valorBonus = 0;
        let tipoBonus = '';

        // Determinar bônus baseado na quantidade
        if (indicados >= 20) {
            valorBonus = this.configuracoes.bonificacoes.meta_mensal_20;
            tipoBonus = 'monthly_20';
        } else if (indicados >= 10) {
            valorBonus = this.configuracoes.bonificacoes.meta_mensal_10;
            tipoBonus = 'monthly_10';
        } else if (indicados >= 5) {
            valorBonus = this.configuracoes.bonificacoes.meta_mensal_5;
            tipoBonus = 'monthly_5';
        }

        if (valorBonus > 0) {
            // Verificar se já recebeu o bônus este mês
            const bonusExistente = await client.query(`
                SELECT id FROM affiliate_bonuses 
                WHERE affiliate_id = $1 
                AND bonus_type = $2
                AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
            `, [dadosMeta.affiliate_id, tipoBonus]);

            if (bonusExistente.rows.length === 0) {
                // Aplicar bônus
                await client.query(`
                    INSERT INTO affiliate_bonuses (
                        affiliate_id, bonus_type, amount,
                        description, reference_id, created_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW());
                `, [
                    dadosMeta.affiliate_id,
                    tipoBonus,
                    valorBonus,
                    `Bônus meta mensal: ${indicados} indicados`,
                    indicados
                ]);

                await this.adicionarSaldoAfiliado(dadosMeta.user_id, valorBonus, client);

                console.log(`🎯 Bônus meta ${indicados} indicados: ${valorBonus} para afiliado ${dadosMeta.user_id}`);
            }
        }
    }

    // ========================================
    // 4. SISTEMA DE RANKING
    // ========================================

    async atualizarRankingAfiliados() {
        console.log('🏆 Sistema de ranking removido - apenas 2 tipos: Normal e VIP');

        // Função removida pois agora só existem 2 tipos fixos de afiliados
        // Normal (1.5%) e VIP (5%) - sem ranking dinâmico
        return;
    }

    calcularRanking(totalIndicados, volumeComissoes) {
        // Função removida - sem ranking dinâmico
        return 'normal';
    }

    // ========================================
    // 5. SAQUES E PAGAMENTOS
    // ========================================

    async solicitarSaqueAfiliado(userId, valor, metodoPagamento) {
        console.log(`💸 Solicitação de saque: ${valor} para afiliado ${userId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar dados do usuário e saldo
            const dadosUsuario = await client.query(`
                SELECT 
                    u.country, u.username,
                    ab.balance
                FROM users u
                JOIN affiliate_balances ab ON u.id = ab.user_id
                WHERE u.id = $1;
            `, [userId]);

            if (dadosUsuario.rows.length === 0) {
                throw new Error('Usuário ou saldo não encontrado');
            }

            const usuario = dadosUsuario.rows[0];
            const saldoDisponivel = parseFloat(usuario.balance);

            // Verificar saldo suficiente
            if (saldoDisponivel < valor) {
                throw new Error('Saldo insuficiente');
            }

            // Verificar valor mínimo
            if (valor < this.configuracoes.comissoes.minimo_payout) {
                throw new Error(`Valor mínimo para saque: ${this.configuracoes.comissoes.minimo_payout}`);
            }

            // Calcular taxa conforme país
            const taxaSaque = usuario.country === 'BR' ? 
                this.configuracoes.comissoes.taxa_saque_brasil :
                this.configuracoes.comissoes.taxa_saque_internacional;

            const valorLiquido = valor - taxaSaque;

            if (valorLiquido <= 0) {
                throw new Error('Valor insuficiente para cobrir taxa de saque');
            }

            // Criar solicitação de saque
            const saque = await client.query(`
                INSERT INTO affiliate_withdrawals (
                    user_id, requested_amount, fee_amount, net_amount,
                    payment_method, country, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
                RETURNING id;
            `, [userId, valor, taxaSaque, valorLiquido, metodoPagamento, usuario.country]);

            // Descontar do saldo
            await client.query(`
                UPDATE affiliate_balances 
                SET balance = balance - $1, updated_at = NOW()
                WHERE user_id = $2;
            `, [valor, userId]);

            await client.query('COMMIT');

            console.log(`✅ Saque solicitado: ${valorLiquido} (líquido) para afiliado ${usuario.username}`);
            console.log(`💳 Taxa aplicada: ${usuario.country === 'BR' ? 'R$' : '$'}${taxaSaque}`);

            return {
                success: true,
                withdrawal_id: saque.rows[0].id,
                requested_amount: valor,
                fee_amount: taxaSaque,
                net_amount: valorLiquido,
                country: usuario.country,
                status: 'pending'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao solicitar saque:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async processarSaquesAfiliados() {
        console.log('💸 Processando saques de afiliados pendentes...');

        const client = await this.pool.connect();
        try {
            const saquesPendentes = await client.query(`
                SELECT 
                    aw.id, aw.user_id, aw.net_amount, aw.payment_method,
                    u.email, u.username
                FROM affiliate_withdrawals aw
                JOIN users u ON aw.user_id = u.id
                WHERE aw.status = 'pending'
                AND aw.created_at <= NOW() - INTERVAL '24 hours'
                ORDER BY aw.created_at ASC
                LIMIT 10;
            `);

            for (const saque of saquesPendentes.rows) {
                await this.processarSaqueIndividual(saque, client);
            }

            console.log(`✅ ${saquesPendentes.rows.length} saques processados`);

        } catch (error) {
            console.error('Erro ao processar saques:', error.message);
        } finally {
            client.release();
        }
    }

    async processarSaqueIndividual(dadosSaque, client) {
        try {
            // Simular processamento de pagamento
            const resultadoPagamento = await this.simularPagamentoAfiliado(dadosSaque);

            // Atualizar status do saque
            await client.query(`
                UPDATE affiliate_withdrawals 
                SET 
                    status = $1,
                    payment_reference = $2,
                    processed_at = NOW()
                WHERE id = $3;
            `, [
                resultadoPagamento.success ? 'completed' : 'failed',
                resultadoPagamento.reference,
                dadosSaque.id
            ]);

            // Se falhou, restaurar saldo
            if (!resultadoPagamento.success) {
                await client.query(`
                    UPDATE affiliate_balances 
                    SET balance = balance + $1, updated_at = NOW()
                    WHERE user_id = $2;
                `, [dadosSaque.net_amount, dadosSaque.user_id]);
            } else {
                // Atualizar total sacado
                await client.query(`
                    UPDATE affiliate_balances 
                    SET total_withdrawn = total_withdrawn + $1, updated_at = NOW()
                    WHERE user_id = $2;
                `, [dadosSaque.net_amount, dadosSaque.user_id]);
            }

            console.log(`💸 Saque ${resultadoPagamento.success ? 'aprovado' : 'rejeitado'}: ${dadosSaque.net_amount} para ${dadosSaque.username}`);

        } catch (error) {
            console.error(`Erro ao processar saque individual ${dadosSaque.id}:`, error.message);
        }
    }

    async simularPagamentoAfiliado(dadosSaque) {
        // Simular processamento (95% sucesso)
        const sucesso = Math.random() > 0.05;
        
        return {
            success: sucesso,
            reference: sucesso ? `PAY_${Date.now()}` : null,
            error: sucesso ? null : 'Dados bancários inválidos'
        };
    }

    // ========================================
    // 6. UTILITÁRIOS E RELATÓRIOS
    // ========================================

    gerarLinkReferencia(codigoAfiliado) {
        const baseUrl = process.env.FRONTEND_URL || 'https://coinbitclub.com';
        return `${baseUrl}/register?ref=${codigoAfiliado}`;
    }

    getMesAno() {
        const agora = new Date();
        return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    }

    async atualizarContadoresUpline(afiliadoId, client) {
        await client.query(`
            UPDATE affiliates 
            SET total_referrals = total_referrals + 1
            WHERE user_id = $1;
        `, [afiliadoId]);
    }

    async atualizarEstatisticasAfiliado(afiliadoId, valorComissao, client) {
        const mesAno = this.getMesAno();

        await client.query(`
            INSERT INTO affiliate_stats (
                affiliate_id, month_year, referrals_count, 
                commissions_earned, bonuses_earned, created_at
            ) VALUES ($1, $2, 0, $3, 0, NOW())
            ON CONFLICT (affiliate_id, month_year)
            DO UPDATE SET 
                commissions_earned = affiliate_stats.commissions_earned + $3,
                updated_at = NOW();
        `, [afiliadoId, mesAno, valorComissao]);
    }

    async obterRelatorioAfiliado(userId, periodo = '30days') {
        const client = await this.pool.connect();
        try {
            const intervalos = {
                '7days': '7 days',
                '30days': '30 days',
                '90days': '90 days'
            };

            const intervalo = intervalos[periodo] || '30 days';

            // Dados básicos do afiliado
            const afiliado = await client.query(`
                SELECT 
                    a.affiliate_code, a.rank_level, a.total_referrals,
                    a.total_commissions, ab.balance, ab.total_earned,
                    ab.total_withdrawn
                FROM affiliates a
                LEFT JOIN affiliate_balances ab ON a.user_id = ab.user_id
                WHERE a.user_id = $1;
            `, [userId]);

            // Comissões do período
            const comissoes = await client.query(`
                SELECT 
                    level, SUM(final_amount) as total,
                    COUNT(*) as operations_count
                FROM affiliate_commissions ac
                JOIN affiliates a ON ac.affiliate_id = a.id
                WHERE a.user_id = $1
                AND ac.created_at >= NOW() - INTERVAL '${intervalo}'
                GROUP BY level;
            `, [userId]);

            // Indicados recentes
            const indicados = await client.query(`
                SELECT 
                    u.username, u.created_at, u.status
                FROM users u
                WHERE u.referred_by = $1
                AND u.created_at >= NOW() - INTERVAL '${intervalo}'
                ORDER BY u.created_at DESC;
            `, [userId]);

            return {
                periodo,
                dados_afiliado: afiliado.rows[0] || null,
                comissoes_por_nivel: comissoes.rows,
                indicados_recentes: indicados.rows,
                link_referencia: afiliado.rows[0] ? 
                    this.gerarLinkReferencia(afiliado.rows[0].affiliate_code) : null
            };

        } finally {
            client.release();
        }
    }

    obterStatus() {
        return {
            estatisticas: this.estatisticas,
            tipos_afiliados: {
                normal: { comissao: '1.5%', descricao: 'Afiliado Normal' },
                vip: { comissao: '5%', descricao: 'Afiliado VIP' }
            },
            taxas_saque: {
                brasil: 'R$ 5,00',
                internacional: 'USD 2,00'
            },
            bonificacoes_status: 'DESABILITADAS (funções prontas)',
            configuracoes_ativas: Object.keys(this.configuracoes)
        };
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestorAfiliados = new GestorAfiliados();
    
    console.log('✅ Gestor de Afiliados iniciado');
    console.log('📊 Status:', gestorAfiliados.obterStatus());
    
    // Verificações automáticas (apenas saques - metas desabilitadas)
    setInterval(async () => {
        try {
            await gestorAfiliados.processarSaquesAfiliados();
            // Metas e ranking removidos conforme solicitação
            console.log('✅ Verificação automática de saques concluída');
        } catch (error) {
            console.error('Erro nas verificações automáticas:', error.message);
        }
    }, 24 * 60 * 60 * 1000); // Diário
}

module.exports = GestorAfiliados;
