/**
 * 🤝 GESTOR DE AFILIADOS AVANÇADO
 * Sistema com vinculação em 48h e controle de comissões
 */

const { Pool } = require('pg');

console.log('🤝 GESTOR DE AFILIADOS AVANÇADO');
console.log('===============================');

class GestorAfiliadosAvancado {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.prazoCapturaHoras = 48; // 48 horas para vincular usuário
    }

    // ========================================
    // 1. VINCULAÇÃO DE USUÁRIOS EM 48H
    // ========================================

    async solicitarVinculacaoUsuario(afiliadoId, userId, codigoReferencia = null) {
        console.log(`🔗 Solicitando vinculação do usuário ${userId} ao afiliado ${afiliadoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Verificar se usuário existe e foi criado há menos de 48h
            const usuario = await client.query(`
                SELECT id, created_at, email, username
                FROM users 
                WHERE id = $1 AND created_at > NOW() - INTERVAL '48 hours'
            `, [userId]);

            if (usuario.rows.length === 0) {
                throw new Error('Usuário não encontrado ou criado há mais de 48 horas');
            }

            // Verificar se usuário já tem afiliado
            const vinculacaoExistente = await client.query(`
                SELECT affiliate_id, status
                FROM user_affiliations 
                WHERE user_id = $1 AND status IN ('active', 'pending')
            `, [userId]);

            if (vinculacaoExistente.rows.length > 0) {
                throw new Error('Usuário já possui vinculação ativa ou pendente');
            }

            // Verificar se afiliado existe e está ativo
            const afiliado = await client.query(`
                SELECT user_id, status, commission_rate
                FROM affiliates 
                WHERE user_id = $1 AND status = 'active'
            `, [afiliadoId]);

            if (afiliado.rows.length === 0) {
                throw new Error('Afiliado não encontrado ou não está ativo');
            }

            // Criar solicitação de vinculação
            const vinculacao = await client.query(`
                INSERT INTO affiliate_link_requests (
                    affiliate_id, user_id, reference_code, status, 
                    requested_at, expires_at
                ) VALUES ($1, $2, $3, 'pending', NOW(), NOW() + INTERVAL '7 days')
                RETURNING id
            `, [afiliadoId, userId, codigoReferencia || `REF_${Date.now()}`]);

            // Criar notificação para admin aprovar
            await client.query(`
                INSERT INTO admin_notifications (
                    type, title, message, data, status, created_at
                ) VALUES ($1, $2, $3, $4, 'pending', NOW())
            `, [
                'affiliate_link_request',
                'Nova solicitação de vinculação',
                `Afiliado ${afiliadoId} solicitou vinculação do usuário ${userId} (${usuario.rows[0].email})`,
                JSON.stringify({
                    affiliate_id: afiliadoId,
                    user_id: userId,
                    request_id: vinculacao.rows[0].id,
                    user_created_at: usuario.rows[0].created_at
                })
            ]);

            await client.query('COMMIT');

            console.log(`✅ Solicitação de vinculação criada - ID: ${vinculacao.rows[0].id}`);

            return {
                sucesso: true,
                solicitacaoId: vinculacao.rows[0].id,
                prazoAprovacao: '7 dias',
                status: 'pending'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro na solicitação de vinculação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async aprovarVinculacaoUsuario(solicitacaoId, adminId) {
        console.log(`✅ Aprovando vinculação ${solicitacaoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar solicitação
            const solicitacao = await client.query(`
                SELECT * FROM affiliate_link_requests 
                WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
            `, [solicitacaoId]);

            if (solicitacao.rows.length === 0) {
                throw new Error('Solicitação não encontrada, já processada ou expirada');
            }

            const sol = solicitacao.rows[0];

            // Verificar novamente se usuário ainda pode ser vinculado
            const usuario = await client.query(`
                SELECT created_at FROM users 
                WHERE id = $1 AND created_at > NOW() - INTERVAL '48 hours'
            `, [sol.user_id]);

            if (usuario.rows.length === 0) {
                // Rejeitar automaticamente se passou de 48h
                await client.query(`
                    UPDATE affiliate_link_requests 
                    SET status = 'rejected', processed_at = NOW(), processed_by = $1,
                        rejection_reason = 'Prazo de 48h expirado'
                    WHERE id = $2
                `, [adminId, solicitacaoId]);

                throw new Error('Prazo de 48 horas expirado para vinculação');
            }

            // Verificar se usuário não foi vinculado a outro afiliado
            const outraVinculacao = await client.query(`
                SELECT affiliate_id FROM user_affiliations 
                WHERE user_id = $1 AND status = 'active'
            `, [sol.user_id]);

            if (outraVinculacao.rows.length > 0) {
                await client.query(`
                    UPDATE affiliate_link_requests 
                    SET status = 'rejected', processed_at = NOW(), processed_by = $1,
                        rejection_reason = 'Usuário já vinculado a outro afiliado'
                    WHERE id = $2
                `, [adminId, solicitacaoId]);

                throw new Error('Usuário já foi vinculado a outro afiliado');
            }

            // Criar vinculação ativa
            await client.query(`
                INSERT INTO user_affiliations (
                    user_id, affiliate_id, status, linked_at, 
                    commission_eligible, reference_code
                ) VALUES ($1, $2, 'active', NOW(), true, $3)
            `, [sol.user_id, sol.affiliate_id, sol.reference_code]);

            // Atualizar solicitação
            await client.query(`
                UPDATE affiliate_link_requests 
                SET status = 'approved', processed_at = NOW(), processed_by = $1
                WHERE id = $2
            `, [adminId, solicitacaoId]);

            await client.query('COMMIT');

            console.log(`✅ Vinculação aprovada - Usuário ${sol.user_id} → Afiliado ${sol.affiliate_id}`);

            return {
                sucesso: true,
                userId: sol.user_id,
                afiliadoId: sol.affiliate_id,
                vinculadoEm: new Date()
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro ao aprovar vinculação: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 2. CONTROLE DE COMISSÕES INTELIGENTE
    // ========================================

    async calcularComissaoOperacao(userId, lucroOperacao) {
        console.log(`💰 Calculando comissão para operação do usuário ${userId}`);

        const client = await this.pool.connect();
        try {
            // Buscar vinculação do usuário
            const vinculacao = await client.query(`
                SELECT ua.affiliate_id, a.commission_rate, a.status as affiliate_status,
                       ua.commission_eligible, ua.linked_at
                FROM user_affiliations ua
                JOIN affiliates a ON ua.affiliate_id = a.user_id
                WHERE ua.user_id = $1 AND ua.status = 'active'
            `, [userId]);

            if (vinculacao.rows.length === 0) {
                return {
                    temAfiliado: false,
                    comissao: 0,
                    motivo: 'Usuário sem afiliado'
                };
            }

            const vinc = vinculacao.rows[0];

            // Verificar se afiliado ainda está ativo
            if (vinc.affiliate_status !== 'active') {
                return {
                    temAfiliado: true,
                    comissao: 0,
                    motivo: 'Afiliado não está ativo',
                    afiliadoId: vinc.affiliate_id
                };
            }

            // Verificar se comissão está habilitada
            if (!vinc.commission_eligible) {
                return {
                    temAfiliado: true,
                    comissao: 0,
                    motivo: 'Comissão desabilitada para este usuário',
                    afiliadoId: vinc.affiliate_id
                };
            }

            // Calcular comissão
            const taxaComissao = vinc.commission_rate || 0.015; // 1.5% padrão
            const valorComissao = lucroOperacao * taxaComissao;

            return {
                temAfiliado: true,
                comissao: valorComissao,
                taxaComissao: taxaComissao,
                afiliadoId: vinc.affiliate_id,
                motivo: 'Comissão calculada com sucesso'
            };

        } catch (error) {
            console.error(`❌ Erro ao calcular comissão: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    async registrarComissao(afiliadoId, userId, valorComissao, lucroOrigem, operacaoId) {
        console.log(`📝 Registrando comissão de ${valorComissao} para afiliado ${afiliadoId}`);

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Registrar comissão
            const comissao = await client.query(`
                INSERT INTO affiliate_commissions (
                    affiliate_id, user_id, commission_amount, commission_rate,
                    source_operation_profit, source_operation_id, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
                RETURNING id
            `, [
                afiliadoId, userId, valorComissao, 
                valorComissao / lucroOrigem, // taxa calculada
                lucroOrigem, operacaoId
            ]);

            // Atualizar estatísticas do afiliado
            await client.query(`
                UPDATE affiliates 
                SET total_commissions = total_commissions + $1,
                    pending_commissions = pending_commissions + $1,
                    last_commission_at = NOW()
                WHERE user_id = $2
            `, [valorComissao, afiliadoId]);

            await client.query('COMMIT');

            console.log(`✅ Comissão registrada - ID: ${comissao.rows[0].id}`);

            return {
                sucesso: true,
                comissaoId: comissao.rows[0].id,
                valor: valorComissao
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Erro ao registrar comissão: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 3. VISUALIZAÇÃO DE POSSIBILIDADES DE VINCULAÇÃO
    // ========================================

    async listarUsuariosVinculaveis(afiliadoId) {
        console.log(`👥 Listando usuários vinculáveis para afiliado ${afiliadoId}`);

        const client = await this.pool.connect();
        try {
            // Buscar usuários criados nas últimas 48h sem afiliado
            const usuarios = await client.query(`
                SELECT 
                    u.id, u.username, u.email, u.created_at,
                    EXTRACT(EPOCH FROM (NOW() - u.created_at))/3600 as horas_desde_criacao,
                    CASE 
                        WHEN ua.user_id IS NOT NULL THEN 'JÁ VINCULADO'
                        WHEN alr.user_id IS NOT NULL THEN 'SOLICITAÇÃO PENDENTE'
                        ELSE 'DISPONÍVEL'
                    END as status_vinculacao
                FROM users u
                LEFT JOIN user_affiliations ua ON u.id = ua.user_id AND ua.status = 'active'
                LEFT JOIN affiliate_link_requests alr ON u.id = alr.user_id AND alr.status = 'pending'
                WHERE u.created_at > NOW() - INTERVAL '48 hours'
                AND u.role = 'user'
                ORDER BY u.created_at DESC
            `);

            const usuariosDisponiveis = usuarios.rows.filter(u => u.status_vinculacao === 'DISPONÍVEL');
            const usuariosComSolicitacao = usuarios.rows.filter(u => u.status_vinculacao === 'SOLICITAÇÃO PENDENTE');

            return {
                usuariosDisponiveis: usuariosDisponiveis,
                usuariosComSolicitacao: usuariosComSolicitacao,
                totalUsuarios48h: usuarios.rows.length,
                estatisticas: {
                    disponiveis: usuariosDisponiveis.length,
                    pendentes: usuariosComSolicitacao.length,
                    jaVinculados: usuarios.rows.filter(u => u.status_vinculacao === 'JÁ VINCULADO').length
                }
            };

        } catch (error) {
            console.error(`❌ Erro ao listar usuários: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 4. RELATÓRIOS E DASHBOARDS
    // ========================================

    async obterDashboardAfiliado(afiliadoId) {
        const client = await this.pool.connect();
        try {
            // Estatísticas gerais
            const stats = await client.query(`
                SELECT 
                    COUNT(DISTINCT ua.user_id) as usuarios_vinculados,
                    COALESCE(SUM(ac.commission_amount), 0) as comissoes_total,
                    COALESCE(SUM(CASE WHEN ac.status = 'confirmed' THEN ac.commission_amount ELSE 0 END), 0) as comissoes_confirmadas,
                    COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.commission_amount ELSE 0 END), 0) as comissoes_pendentes
                FROM affiliates a
                LEFT JOIN user_affiliations ua ON a.user_id = ua.affiliate_id AND ua.status = 'active'
                LEFT JOIN affiliate_commissions ac ON a.user_id = ac.affiliate_id
                WHERE a.user_id = $1
                GROUP BY a.user_id
            `, [afiliadoId]);

            // Comissões recentes
            const comissoesRecentes = await client.query(`
                SELECT 
                    ac.id, ac.commission_amount, ac.status, ac.created_at,
                    u.username, u.email, ac.source_operation_profit
                FROM affiliate_commissions ac
                JOIN users u ON ac.user_id = u.id
                WHERE ac.affiliate_id = $1
                ORDER BY ac.created_at DESC
                LIMIT 10
            `, [afiliadoId]);

            // Solicitações de vinculação pendentes
            const solicitacoesPendentes = await client.query(`
                SELECT 
                    alr.id, alr.requested_at, alr.expires_at,
                    u.username, u.email, u.created_at
                FROM affiliate_link_requests alr
                JOIN users u ON alr.user_id = u.id
                WHERE alr.affiliate_id = $1 AND alr.status = 'pending'
                ORDER BY alr.requested_at DESC
            `, [afiliadoId]);

            return {
                estatisticas: stats.rows[0] || {
                    usuarios_vinculados: 0,
                    comissoes_total: 0,
                    comissoes_confirmadas: 0,
                    comissoes_pendentes: 0
                },
                comissoesRecentes: comissoesRecentes.rows,
                solicitacoesPendentes: solicitacoesPendentes.rows
            };

        } catch (error) {
            console.error(`❌ Erro no dashboard: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = GestorAfiliadosAvancado;
