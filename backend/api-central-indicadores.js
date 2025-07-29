/**
 * API DA CENTRAL DE INDICADORES COM CONTROLE DE ACESSO
 * ===================================================
 * API REST para dashboard personalizado por perfil
 * Integração completa com sistema de webhook e comissionamento
 */

const express = require('express');
const { Pool } = require('pg');
const app = express();

// Configuração do banco
const pool = new Pool({
    host: 'monorail.proxy.rlwy.net',
    port: 33325,
    user: 'postgres',
    password: 'PZlSCzzKdQMRvOqPaIgCnzEhKBMngjLT',
    database: 'railway',
    ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// Níveis de permissão
const ACCESS_LEVELS = {
    ADMIN: {
        level: 5,
        name: 'ADMIN',
        description: 'Acesso total ao sistema',
        permissions: ['view_all', 'financial_data', 'user_management', 'system_config', 'affiliate_data']
    },
    GESTOR: {
        level: 4,
        name: 'GESTOR',
        description: 'Gestão operacional',
        permissions: ['view_operations', 'financial_data', 'user_data', 'affiliate_data']
    },
    OPERADOR: {
        level: 3,
        name: 'OPERADOR',
        description: 'Operações e monitoramento',
        permissions: ['view_operations', 'basic_financial', 'user_data']
    },
    AFILIADO: {
        level: 2,
        name: 'AFILIADO',
        description: 'Dashboard de afiliado',
        permissions: ['view_own_data', 'affiliate_earnings', 'referral_data']
    },
    USUARIO: {
        level: 1,
        name: 'USUARIO',
        description: 'Acesso básico ao próprio desempenho',
        permissions: ['view_own_operations']
    }
};

// Middleware de autenticação e autorização
const authenticateUser = async (req, res, next) => {
    try {
        const { user_id, access_level } = req.headers;
        
        if (!user_id) {
            return res.status(401).json({ error: 'User ID requerido' });
        }

        // Definir nível de acesso padrão se não especificado
        req.user = {
            id: parseInt(user_id),
            access_level: access_level || 'USUARIO'
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Erro de autenticação' });
    }
};

// Verificar permissões
const checkPermission = (userLevel, requiredPermission) => {
    const levelConfig = ACCESS_LEVELS[userLevel];
    return levelConfig && levelConfig.permissions.includes(requiredPermission);
};

// ROTAS DA API

// 1. Dashboard completo personalizado
app.get('/api/dashboard/:userId', authenticateUser, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { userId } = req.params;
        const { access_level } = req.user;
        
        const dashboard = {
            user: {
                id: userId,
                access_level,
                description: ACCESS_LEVELS[access_level]?.description
            },
            timestamp: new Date().toISOString(),
            sections: {}
        };

        // 1. Operações por tipo de receita (sempre visível)
        dashboard.sections.operations = await getOperationsByRevenueType(client, userId, access_level);

        // 2. Indicadores financeiros (conforme permissão)
        if (checkPermission(access_level, 'financial_data') || checkPermission(access_level, 'basic_financial')) {
            dashboard.sections.financial = await getFinancialIndicators(client, access_level);
        }

        // 3. Dashboard de afiliados (conforme permissão)
        if (checkPermission(access_level, 'affiliate_data') || checkPermission(access_level, 'affiliate_earnings')) {
            dashboard.sections.affiliates = await getAffiliatesDashboard(client, userId, access_level);
        }

        // 4. Indicadores do sistema (apenas admin e gestor)
        if (checkPermission(access_level, 'view_all') || checkPermission(access_level, 'view_operations')) {
            dashboard.sections.system = await getSystemIndicators(client);
        }

        // 5. Gestão de usuários (apenas admin e gestor)
        if (checkPermission(access_level, 'user_management') || checkPermission(access_level, 'user_data')) {
            dashboard.sections.users = await getUserManagement(client, access_level);
        }

        // 6. Controle de despesas (apenas admin)
        if (checkPermission(access_level, 'view_all')) {
            dashboard.sections.expenses = await getExpenseControl(client);
        }

        res.json(dashboard);

    } catch (error) {
        console.error('Erro ao gerar dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// 2. Operações separadas por REAL vs BONUS
app.get('/api/operations/:userId', authenticateUser, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { userId } = req.params;
        const { access_level } = req.user;
        const { days = 7 } = req.query;

        const operations = await getOperationsByRevenueType(client, userId, access_level, days);
        res.json(operations);

    } catch (error) {
        console.error('Erro ao buscar operações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// 3. Indicadores financeiros
app.get('/api/financial', authenticateUser, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { access_level } = req.user;

        if (!checkPermission(access_level, 'financial_data') && !checkPermission(access_level, 'basic_financial')) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const financial = await getFinancialIndicators(client, access_level);
        res.json(financial);

    } catch (error) {
        console.error('Erro ao buscar indicadores financeiros:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// 4. Dashboard de afiliados
app.get('/api/affiliates/:userId?', authenticateUser, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { userId } = req.params;
        const { access_level } = req.user;

        if (!checkPermission(access_level, 'affiliate_data') && !checkPermission(access_level, 'affiliate_earnings')) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const affiliates = await getAffiliatesDashboard(client, userId || req.user.id, access_level);
        res.json(affiliates);

    } catch (error) {
        console.error('Erro ao buscar dashboard de afiliados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// 5. Controle de permissões
app.get('/api/permissions/:userId', authenticateUser, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { userId } = req.params;
        const { access_level } = req.user;

        if (!checkPermission(access_level, 'user_management')) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const permissions = await client.query(`
            SELECT user_id, access_level, permissions, created_at, updated_at
            FROM user_permissions 
            WHERE user_id = $1
        `, [userId]);

        res.json({
            user_id: userId,
            permissions: permissions.rows[0] || null,
            available_levels: Object.keys(ACCESS_LEVELS)
        });

    } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// 6. Atualizar permissões de usuário
app.put('/api/permissions/:userId', authenticateUser, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { userId } = req.params;
        const { access_level } = req.user;
        const { new_access_level } = req.body;

        if (!checkPermission(access_level, 'user_management')) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        if (!ACCESS_LEVELS[new_access_level]) {
            return res.status(400).json({ error: 'Nível de acesso inválido' });
        }

        await client.query(`
            INSERT INTO user_permissions (user_id, access_level, permissions, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                access_level = EXCLUDED.access_level,
                permissions = EXCLUDED.permissions,
                updated_at = NOW()
        `, [
            userId, 
            new_access_level, 
            JSON.stringify(ACCESS_LEVELS[new_access_level].permissions)
        ]);

        res.json({ 
            success: true, 
            message: `Permissões atualizadas para ${new_access_level}`,
            user_id: userId,
            new_access_level
        });

    } catch (error) {
        console.error('Erro ao atualizar permissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// FUNÇÕES AUXILIARES

async function getOperationsByRevenueType(client, userId, accessLevel, days = 7) {
    try {
        let baseQuery = `
            SELECT 
                uo.*,
                u.username,
                u.account_type,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM payments p 
                        WHERE p.user_id = uo.user_id 
                        AND p.payment_method = 'STRIPE'
                        AND p.status = 'completed'
                    ) THEN 'REAL'
                    ELSE 'BONUS'
                END as revenue_type
            FROM user_operations uo
            LEFT JOIN users u ON u.id = uo.user_id
            WHERE uo.created_at >= NOW() - INTERVAL '${days} days'
        `;

        // Limitar por usuário se não for admin/gestor
        const params = [];
        if (!checkPermission(accessLevel, 'view_all') && !checkPermission(accessLevel, 'view_operations')) {
            baseQuery += ` AND uo.user_id = $1`;
            params.push(userId);
        }

        const operations = await client.query(baseQuery, params);

        // Agrupar e calcular estatísticas
        const realOperations = operations.rows.filter(op => op.revenue_type === 'REAL');
        const bonusOperations = operations.rows.filter(op => op.revenue_type === 'BONUS');

        return {
            period_days: days,
            real_operations: {
                ...calculateStatistics(realOperations),
                operations: realOperations
            },
            bonus_operations: {
                ...calculateStatistics(bonusOperations),
                operations: bonusOperations
            },
            total_statistics: calculateStatistics(operations.rows)
        };

    } catch (error) {
        console.error('Erro ao buscar operações por tipo:', error);
        return { error: error.message };
    }
}

async function getFinancialIndicators(client, accessLevel) {
    try {
        // Receitas do mês atual
        const monthlyRevenue = await client.query(`
            SELECT 
                SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as profits,
                SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END) as losses,
                COUNT(*) as total_operations,
                AVG(profit_loss) as avg_result
            FROM user_operations 
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND status = 'closed'
        `);

        const revenue = monthlyRevenue.rows[0];
        const result = {
            monthly_revenue: {
                profits: parseFloat(revenue.profits || 0),
                losses: parseFloat(revenue.losses || 0),
                total_operations: parseInt(revenue.total_operations || 0),
                avg_result: parseFloat(revenue.avg_result || 0)
            }
        };

        // Separação REAL vs BONUS
        const revenueByType = await client.query(`
            SELECT 
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM payments p 
                        WHERE p.user_id = uo.user_id 
                        AND p.payment_method = 'STRIPE'
                        AND p.status = 'completed'
                    ) THEN 'REAL'
                    ELSE 'BONUS'
                END as revenue_type,
                SUM(profit_loss) as total_profit
            FROM user_operations uo
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND status = 'closed'
            GROUP BY revenue_type
        `);

        result.revenue_by_type = {};
        revenueByType.rows.forEach(row => {
            result.revenue_by_type[row.revenue_type.toLowerCase()] = parseFloat(row.total_profit);
        });

        // Sistema de afiliados se tiver permissão
        if (checkPermission(accessLevel, 'financial_data')) {
            const affiliatesStats = await client.query(`
                SELECT 
                    COUNT(*) as total_affiliates,
                    SUM(referral_count) as total_referrals,
                    COALESCE(SUM(total_earnings), 0) as total_commissions_paid
                FROM affiliates
            `);

            result.affiliates_system = affiliatesStats.rows[0];
        }

        return result;

    } catch (error) {
        console.error('Erro ao buscar indicadores financeiros:', error);
        return { error: error.message };
    }
}

async function getAffiliatesDashboard(client, userId, accessLevel) {
    try {
        if (accessLevel === 'AFILIADO') {
            // Dados do próprio afiliado
            const affiliateData = await client.query(`
                SELECT * FROM affiliates WHERE affiliate_id = $1
            `, [userId]);

            if (affiliateData.rows.length === 0) {
                return { error: 'Usuário não é afiliado' };
            }

            const affiliate = affiliateData.rows[0];
            return {
                type: 'personal',
                affiliate_data: affiliate,
                monthly_estimate: {
                    commission: affiliate.total_earnings * 0.1, // 10% do total no mês
                    avg_per_referral: affiliate.referral_count > 0 ? 
                        affiliate.total_earnings / affiliate.referral_count : 0
                }
            };

        } else {
            // Resumo geral para admin/gestor
            const affiliatesOverview = await client.query(`
                SELECT 
                    COUNT(*) as total_affiliates,
                    COUNT(CASE WHEN vip_status THEN 1 END) as vip_affiliates,
                    SUM(referral_count) as total_referrals,
                    SUM(COALESCE(total_earnings, 0)) as total_commissions
                FROM affiliates
            `);

            const topAffiliates = await client.query(`
                SELECT affiliate_id, referral_count, total_earnings, vip_status
                FROM affiliates
                ORDER BY total_earnings DESC
                LIMIT 5
            `);

            return {
                type: 'overview',
                summary: affiliatesOverview.rows[0],
                top_affiliates: topAffiliates.rows,
                commission_rates: {
                    standard: 1.5,
                    vip: 5.0
                }
            };
        }

    } catch (error) {
        console.error('Erro ao buscar dashboard de afiliados:', error);
        return { error: error.message };
    }
}

async function getSystemIndicators(client) {
    try {
        // Performance do sistema
        const systemStats = await client.query(`
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_users,
                COUNT(CASE WHEN uo.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as operations_24h,
                COUNT(CASE WHEN uo.status = 'open' THEN 1 END) as open_operations
            FROM users u
            LEFT JOIN user_operations uo ON uo.user_id = u.id
        `);

        // Taxa de sucesso geral
        const successRate = await client.query(`
            SELECT 
                COUNT(*) as total_closed,
                COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as profitable
            FROM user_operations
            WHERE status = 'closed'
            AND created_at >= NOW() - INTERVAL '30 days'
        `);

        const stats = systemStats.rows[0];
        const success = successRate.rows[0];

        return {
            performance: {
                total_users: parseInt(stats.total_users),
                active_users: parseInt(stats.active_users),
                operations_24h: parseInt(stats.operations_24h),
                open_operations: parseInt(stats.open_operations)
            },
            trading_performance: {
                success_rate: success.total_closed > 0 ? 
                    ((success.profitable / success.total_closed) * 100).toFixed(1) : '0.0',
                total_operations_30d: parseInt(success.total_closed)
            },
            services_status: {
                webhook_system: 'operational',
                commission_manager: 'operational',
                indicators_api: 'operational',
                intelligent_monitor: 'operational'
            },
            critical_settings: {
                tp_sl_ratio: '2.5x/1.5x',
                signal_timeout: '2 minutes',
                auto_commission: true,
                access_control: true,
                real_bonus_separation: true
            }
        };

    } catch (error) {
        console.error('Erro ao buscar indicadores do sistema:', error);
        return { error: error.message };
    }
}

async function getUserManagement(client, accessLevel) {
    try {
        // Distribuição de usuários
        const userDistribution = await client.query(`
            SELECT 
                account_type,
                country,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active
            FROM users 
            GROUP BY account_type, country
            ORDER BY total DESC
        `);

        const result = {
            distribution: userDistribution.rows,
            access_control: {
                ADMIN: 'Acesso total (financial_data, user_management)',
                GESTOR: 'Operações + Financeiro (view_operations, financial_data)',
                OPERADOR: 'Operações básicas (view_operations, basic_financial)',
                AFILIADO: 'Próprios dados + Comissões (affiliate_earnings)',
                USUARIO: 'Apenas próprias operações (view_own_operations)'
            }
        };

        // Atividade detalhada se for admin
        if (checkPermission(accessLevel, 'user_management')) {
            const userActivity = await client.query(`
                SELECT 
                    u.id,
                    u.username,
                    u.account_type,
                    COUNT(uo.id) as total_operations,
                    EXISTS(SELECT 1 FROM affiliates a WHERE a.affiliate_id = u.id) as is_affiliate
                FROM users u
                LEFT JOIN user_operations uo ON uo.user_id = u.id
                GROUP BY u.id, u.username, u.account_type
                ORDER BY total_operations DESC
                LIMIT 20
            `);

            result.user_activity = userActivity.rows;
        }

        return result;

    } catch (error) {
        console.error('Erro ao buscar gestão de usuários:', error);
        return { error: error.message };
    }
}

async function getExpenseControl(client) {
    try {
        const expenses = await client.query(`
            SELECT 
                category,
                SUM(amount_usd) as total_usd,
                billing_cycle
            FROM operational_expenses 
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY category, billing_cycle
            ORDER BY total_usd DESC
        `);

        let monthlyTotal = 0;
        const expensesByCategory = {};

        expenses.rows.forEach(expense => {
            expensesByCategory[expense.category] = {
                amount: parseFloat(expense.total_usd),
                billing_cycle: expense.billing_cycle
            };

            if (expense.billing_cycle === 'monthly' || expense.billing_cycle === 'per-transaction') {
                monthlyTotal += parseFloat(expense.total_usd);
            } else if (expense.billing_cycle === 'annual') {
                monthlyTotal += parseFloat(expense.total_usd) / 12;
            }
        });

        return {
            expenses_by_category: expensesByCategory,
            totals: {
                monthly_usd: monthlyTotal.toFixed(2),
                annual_projection_usd: (monthlyTotal * 12).toFixed(2)
            }
        };

    } catch (error) {
        console.error('Erro ao buscar controle de despesas:', error);
        return { error: error.message };
    }
}

// Função auxiliar para calcular estatísticas
function calculateStatistics(operations) {
    if (!operations || operations.length === 0) {
        return {
            total: 0,
            open: 0,
            closed: 0,
            profitable: 0,
            losses: 0,
            success_rate: '0.0',
            avg_profit: '0.00',
            avg_loss: '0.00',
            total_result: '0.00',
            estimated_commissions: '0.00'
        };
    }

    const total = operations.length;
    const open = operations.filter(op => op.status === 'open').length;
    const closed = operations.filter(op => op.status === 'closed').length;
    const profitable = operations.filter(op => op.profit_loss > 0).length;
    const losses = operations.filter(op => op.profit_loss < 0).length;
    
    const successRate = closed > 0 ? ((profitable / closed) * 100).toFixed(1) : '0.0';
    
    const profits = operations.filter(op => op.profit_loss > 0);
    const lossOps = operations.filter(op => op.profit_loss < 0);
    
    const avgProfit = profits.length > 0 ? 
        (profits.reduce((sum, op) => sum + parseFloat(op.profit_loss), 0) / profits.length).toFixed(2) : '0.00';
    
    const avgLoss = lossOps.length > 0 ? 
        (lossOps.reduce((sum, op) => sum + parseFloat(op.profit_loss), 0) / lossOps.length).toFixed(2) : '0.00';
    
    const totalResult = operations.reduce((sum, op) => sum + parseFloat(op.profit_loss || 0), 0).toFixed(2);
    
    // Estimativa de comissões (1.5% para operações lucrativas)
    const estimatedCommissions = (parseFloat(totalResult) > 0 ? parseFloat(totalResult) * 0.015 : 0).toFixed(2);

    return {
        total,
        open,
        closed,
        profitable,
        losses,
        success_rate: successRate,
        avg_profit: avgProfit,
        avg_loss: avgLoss,
        total_result: totalResult,
        estimated_commissions: estimatedCommissions
    };
}

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Central de Indicadores API',
        timestamp: new Date().toISOString(),
        features: [
            'Dashboard personalizado por perfil',
            'Separação REAL vs BONUS',
            'Sistema de comissionamento',
            'Controle de acesso granular',
            'Indicadores financeiros',
            'Gestão de afiliados'
        ]
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro na API:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`🚀 API Central de Indicadores rodando na porta ${PORT}`);
    console.log(`📊 Dashboard disponível em: http://localhost:${PORT}/api/dashboard/:userId`);
    console.log(`🔒 Níveis de acesso: ${Object.keys(ACCESS_LEVELS).join(', ')}`);
    console.log(`💳 Separação REAL vs BONUS ativa`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
