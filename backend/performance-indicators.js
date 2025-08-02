/**
 * 📊 SISTEMA DE INDICADORES DE PERFORMANCE - COINBITCLUB MARKET BOT
 * 
 * Sistema completo para medir performance de gestores e operações
 * Inclui métricas de % de acerto, lucro/prejuízo, drawdown, sharpe ratio
 * 
 * @version 3.0.0
 * @date 2025-07-31
 */

const pool = require('./config/database');

class PerformanceIndicators {
    constructor() {
        this.log = this.log.bind(this);
        this.calculateManagerPerformance = this.calculateManagerPerformance.bind(this);
        this.calculateWinRate = this.calculateWinRate.bind(this);
        this.calculateTotalMetrics = this.calculateTotalMetrics.bind(this);
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : '📊';
        console.log(`${emoji} [PERFORMANCE] ${timestamp}: ${message}`);
    }

    /**
     * 📈 Calcula performance individual de cada gestor
     */
    async calculateManagerPerformance(managerId = null, period = '30d') {
        try {
            this.log(`Calculando performance dos gestores (período: ${period})`);

            // Query para buscar operações por gestor
            const whereClause = managerId ? 'AND manager_id = $2' : '';
            const periodDays = this.getPeriodDays(period);
            
            const query = `
                SELECT 
                    o.manager_id,
                    u.name as manager_name,
                    u.email as manager_email,
                    COUNT(*) as total_operations,
                    COUNT(CASE WHEN o.pnl > 0 THEN 1 END) as winning_operations,
                    COUNT(CASE WHEN o.pnl < 0 THEN 1 END) as losing_operations,
                    COUNT(CASE WHEN o.pnl = 0 THEN 1 END) as breakeven_operations,
                    SUM(o.pnl) as total_pnl,
                    AVG(o.pnl) as average_pnl,
                    MAX(o.pnl) as best_trade,
                    MIN(o.pnl) as worst_trade,
                    SUM(CASE WHEN o.pnl > 0 THEN o.pnl ELSE 0 END) as total_profits,
                    SUM(CASE WHEN o.pnl < 0 THEN ABS(o.pnl) ELSE 0 END) as total_losses,
                    AVG(CASE WHEN o.pnl > 0 THEN o.pnl END) as avg_winning_trade,
                    AVG(CASE WHEN o.pnl < 0 THEN o.pnl END) as avg_losing_trade,
                    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_operations,
                    COUNT(CASE WHEN o.status = 'running' THEN 1 END) as running_operations,
                    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_operations
                FROM operations o
                LEFT JOIN users u ON o.manager_id = u.id
                WHERE o.created_at >= NOW() - INTERVAL '${periodDays} days'
                ${whereClause}
                GROUP BY o.manager_id, u.name, u.email
                ORDER BY total_pnl DESC
            `;

            const params = managerId ? [periodDays, managerId] : [periodDays];
            const result = await pool.query(query, params);

            const managersPerformance = result.rows.map(row => {
                const winRate = row.total_operations > 0 ? 
                    (row.winning_operations / row.total_operations * 100).toFixed(2) : 0;
                
                const lossRate = row.total_operations > 0 ? 
                    (row.losing_operations / row.total_operations * 100).toFixed(2) : 0;
                
                const profitFactor = row.total_losses > 0 ? 
                    (row.total_profits / row.total_losses).toFixed(2) : 'N/A';
                
                const expectancy = row.total_operations > 0 ? 
                    ((row.winning_operations / row.total_operations) * row.avg_winning_trade - 
                     (row.losing_operations / row.total_operations) * Math.abs(row.avg_losing_trade || 0)).toFixed(2) : 0;

                return {
                    manager_id: row.manager_id,
                    manager_name: row.manager_name || 'Gestor Desconhecido',
                    manager_email: row.manager_email || 'N/A',
                    performance_metrics: {
                        // 🎯 Métricas principais
                        total_operations: parseInt(row.total_operations),
                        win_rate_percentage: parseFloat(winRate),
                        loss_rate_percentage: parseFloat(lossRate),
                        breakeven_rate: row.total_operations > 0 ? 
                            (row.breakeven_operations / row.total_operations * 100).toFixed(2) : 0,
                        
                        // 💰 Métricas financeiras
                        total_pnl: parseFloat(row.total_pnl || 0).toFixed(2),
                        average_pnl: parseFloat(row.average_pnl || 0).toFixed(2),
                        total_profits: parseFloat(row.total_profits || 0).toFixed(2),
                        total_losses: parseFloat(row.total_losses || 0).toFixed(2),
                        
                        // 📊 Métricas de qualidade
                        best_trade: parseFloat(row.best_trade || 0).toFixed(2),
                        worst_trade: parseFloat(row.worst_trade || 0).toFixed(2),
                        avg_winning_trade: parseFloat(row.avg_winning_trade || 0).toFixed(2),
                        avg_losing_trade: parseFloat(row.avg_losing_trade || 0).toFixed(2),
                        profit_factor: profitFactor,
                        expectancy: parseFloat(expectancy),
                        
                        // 📈 Status das operações
                        completed_operations: parseInt(row.completed_operations),
                        running_operations: parseInt(row.running_operations),
                        cancelled_operations: parseInt(row.cancelled_operations),
                        
                        // 🏆 Classificação de performance
                        performance_grade: this.getPerformanceGrade(parseFloat(winRate), parseFloat(row.total_pnl || 0)),
                        risk_level: this.getRiskLevel(parseFloat(row.worst_trade || 0), parseFloat(row.total_pnl || 0))
                    }
                };
            });

            this.log(`Performance calculada para ${managersPerformance.length} gestores`, 'SUCCESS');
            return managersPerformance;

        } catch (error) {
            this.log(`Erro ao calcular performance dos gestores: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 🎯 Calcula taxa de acerto geral do sistema
     */
    async calculateWinRate(period = '30d') {
        try {
            this.log(`Calculando taxa de acerto geral (período: ${period})`);
            
            const periodDays = this.getPeriodDays(period);
            
            const query = `
                SELECT 
                    COUNT(*) as total_operations,
                    COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_operations,
                    COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_operations,
                    COUNT(CASE WHEN pnl = 0 THEN 1 END) as breakeven_operations,
                    SUM(pnl) as total_pnl,
                    AVG(pnl) as average_pnl,
                    STDDEV(pnl) as pnl_stddev
                FROM operations 
                WHERE created_at >= NOW() - INTERVAL '${periodDays} days'
                AND status = 'completed'
            `;

            const result = await pool.query(query);
            const data = result.rows[0];

            if (!data || data.total_operations == 0) {
                return {
                    period,
                    total_operations: 0,
                    win_rate: 0,
                    loss_rate: 0,
                    breakeven_rate: 0,
                    message: 'Nenhuma operação encontrada no período'
                };
            }

            const winRate = (data.winning_operations / data.total_operations * 100).toFixed(2);
            const lossRate = (data.losing_operations / data.total_operations * 100).toFixed(2);
            const breakevenRate = (data.breakeven_operations / data.total_operations * 100).toFixed(2);
            
            // Cálculo do Sharpe Ratio simplificado
            const sharpeRatio = data.pnl_stddev > 0 ? 
                (data.average_pnl / data.pnl_stddev).toFixed(2) : 'N/A';

            const winRateData = {
                period,
                period_days: periodDays,
                total_operations: parseInt(data.total_operations),
                winning_operations: parseInt(data.winning_operations),
                losing_operations: parseInt(data.losing_operations),
                breakeven_operations: parseInt(data.breakeven_operations),
                
                // 📊 Percentuais
                win_rate_percentage: parseFloat(winRate),
                loss_rate_percentage: parseFloat(lossRate),
                breakeven_rate_percentage: parseFloat(breakevenRate),
                
                // 💰 Métricas financeiras
                total_pnl: parseFloat(data.total_pnl).toFixed(2),
                average_pnl_per_trade: parseFloat(data.average_pnl).toFixed(2),
                pnl_standard_deviation: parseFloat(data.pnl_stddev || 0).toFixed(2),
                sharpe_ratio: sharpeRatio,
                
                // 🎯 Classificações
                performance_classification: this.getSystemPerformanceClassification(parseFloat(winRate)),
                risk_classification: this.getRiskClassification(parseFloat(data.pnl_stddev || 0))
            };

            this.log(`Taxa de acerto calculada: ${winRate}% (${data.winning_operations}/${data.total_operations})`, 'SUCCESS');
            return winRateData;

        } catch (error) {
            this.log(`Erro ao calcular taxa de acerto: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 📈 Calcula métricas totais do sistema
     */
    async calculateTotalMetrics() {
        try {
            this.log('Calculando métricas totais do sistema');

            const queries = {
                // Métricas gerais
                general: `
                    SELECT 
                        COUNT(*) as total_operations,
                        COUNT(DISTINCT manager_id) as total_managers,
                        COUNT(DISTINCT user_id) as total_users,
                        SUM(pnl) as total_pnl,
                        AVG(pnl) as avg_pnl,
                        MAX(pnl) as best_trade_ever,
                        MIN(pnl) as worst_trade_ever
                    FROM operations
                `,
                
                // Métricas por período
                today: `
                    SELECT 
                        COUNT(*) as operations_today,
                        SUM(pnl) as pnl_today,
                        COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins_today
                    FROM operations 
                    WHERE DATE(created_at) = CURRENT_DATE
                `,
                
                // Métricas da semana
                week: `
                    SELECT 
                        COUNT(*) as operations_week,
                        SUM(pnl) as pnl_week,
                        COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins_week
                    FROM operations 
                    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
                `,
                
                // Métricas do mês
                month: `
                    SELECT 
                        COUNT(*) as operations_month,
                        SUM(pnl) as pnl_month,
                        COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins_month
                    FROM operations 
                    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                `
            };

            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await pool.query(query);
                results[key] = result.rows[0];
            }

            // Top 5 gestores
            const topManagers = await this.getTopManagers(5);
            
            // Métricas de risco
            const riskMetrics = await this.calculateRiskMetrics();

            const totalMetrics = {
                timestamp: new Date().toISOString(),
                system_overview: {
                    total_operations: parseInt(results.general.total_operations || 0),
                    total_managers: parseInt(results.general.total_managers || 0),
                    total_users: parseInt(results.general.total_users || 0),
                    total_pnl: parseFloat(results.general.total_pnl || 0).toFixed(2),
                    average_pnl_per_trade: parseFloat(results.general.avg_pnl || 0).toFixed(2),
                    best_trade_ever: parseFloat(results.general.best_trade_ever || 0).toFixed(2),
                    worst_trade_ever: parseFloat(results.general.worst_trade_ever || 0).toFixed(2)
                },
                
                performance_by_period: {
                    today: {
                        operations: parseInt(results.today.operations_today || 0),
                        pnl: parseFloat(results.today.pnl_today || 0).toFixed(2),
                        wins: parseInt(results.today.wins_today || 0),
                        win_rate: results.today.operations_today > 0 ? 
                            (results.today.wins_today / results.today.operations_today * 100).toFixed(2) + '%' : '0%'
                    },
                    
                    week: {
                        operations: parseInt(results.week.operations_week || 0),
                        pnl: parseFloat(results.week.pnl_week || 0).toFixed(2),
                        wins: parseInt(results.week.wins_week || 0),
                        win_rate: results.week.operations_week > 0 ? 
                            (results.week.wins_week / results.week.operations_week * 100).toFixed(2) + '%' : '0%'
                    },
                    
                    month: {
                        operations: parseInt(results.month.operations_month || 0),
                        pnl: parseFloat(results.month.pnl_month || 0).toFixed(2),
                        wins: parseInt(results.month.wins_month || 0),
                        win_rate: results.month.operations_month > 0 ? 
                            (results.month.wins_month / results.month.operations_month * 100).toFixed(2) + '%' : '0%'
                    }
                },
                
                top_managers: topManagers,
                risk_metrics: riskMetrics
            };

            this.log('Métricas totais calculadas com sucesso', 'SUCCESS');
            return totalMetrics;

        } catch (error) {
            this.log(`Erro ao calcular métricas totais: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 🏆 Busca top gestores por performance
     */
    async getTopManagers(limit = 5) {
        try {
            const query = `
                SELECT 
                    o.manager_id,
                    u.name as manager_name,
                    COUNT(*) as total_ops,
                    SUM(o.pnl) as total_pnl,
                    COUNT(CASE WHEN o.pnl > 0 THEN 1 END) as wins,
                    (COUNT(CASE WHEN o.pnl > 0 THEN 1 END)::float / COUNT(*)::float * 100) as win_rate
                FROM operations o
                LEFT JOIN users u ON o.manager_id = u.id
                WHERE o.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY o.manager_id, u.name
                HAVING COUNT(*) >= 5
                ORDER BY total_pnl DESC, win_rate DESC
                LIMIT $1
            `;

            const result = await pool.query(query, [limit]);
            
            return result.rows.map((row, index) => ({
                ranking: index + 1,
                manager_id: row.manager_id,
                manager_name: row.manager_name || 'Gestor Desconhecido',
                total_operations: parseInt(row.total_ops),
                total_pnl: parseFloat(row.total_pnl).toFixed(2),
                wins: parseInt(row.wins),
                win_rate: parseFloat(row.win_rate).toFixed(2) + '%'
            }));

        } catch (error) {
            this.log(`Erro ao buscar top gestores: ${error.message}`, 'ERROR');
            return [];
        }
    }

    /**
     * ⚠️ Calcula métricas de risco
     */
    async calculateRiskMetrics() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_operations,
                    AVG(pnl) as mean_pnl,
                    STDDEV(pnl) as std_pnl,
                    MIN(pnl) as max_drawdown,
                    MAX(pnl) as max_profit,
                    PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY pnl) as var_95,
                    PERCENTILE_CONT(0.01) WITHIN GROUP (ORDER BY pnl) as var_99
                FROM operations 
                WHERE created_at >= NOW() - INTERVAL '30 days'
                AND status = 'completed'
            `;

            const result = await pool.query(query);
            const data = result.rows[0];

            if (!data || data.total_operations == 0) {
                return {
                    message: 'Dados insuficientes para calcular métricas de risco'
                };
            }

            return {
                volatility: parseFloat(data.std_pnl || 0).toFixed(2),
                max_drawdown: parseFloat(data.max_drawdown || 0).toFixed(2),
                max_profit: parseFloat(data.max_profit || 0).toFixed(2),
                value_at_risk_95: parseFloat(data.var_95 || 0).toFixed(2),
                value_at_risk_99: parseFloat(data.var_99 || 0).toFixed(2),
                sharpe_ratio: data.std_pnl > 0 ? 
                    (data.mean_pnl / data.std_pnl).toFixed(2) : 'N/A',
                risk_classification: this.getRiskClassification(parseFloat(data.std_pnl || 0))
            };

        } catch (error) {
            this.log(`Erro ao calcular métricas de risco: ${error.message}`, 'ERROR');
            return { error: error.message };
        }
    }

    /**
     * 🏅 Determina classificação de performance do gestor
     */
    getPerformanceGrade(winRate, totalPnl) {
        if (winRate >= 80 && totalPnl > 1000) return { grade: 'A+', description: 'Excelente' };
        if (winRate >= 70 && totalPnl > 500) return { grade: 'A', description: 'Muito Bom' };
        if (winRate >= 60 && totalPnl > 0) return { grade: 'B', description: 'Bom' };
        if (winRate >= 50 && totalPnl >= 0) return { grade: 'C', description: 'Regular' };
        return { grade: 'D', description: 'Precisa Melhorar' };
    }

    /**
     * ⚠️ Determina nível de risco
     */
    getRiskLevel(worstTrade, totalPnl) {
        const riskRatio = Math.abs(worstTrade) / Math.abs(totalPnl || 1);
        
        if (riskRatio <= 0.1) return { level: 'Baixo', color: 'green' };
        if (riskRatio <= 0.3) return { level: 'Moderado', color: 'yellow' };
        if (riskRatio <= 0.5) return { level: 'Alto', color: 'orange' };
        return { level: 'Muito Alto', color: 'red' };
    }

    /**
     * 📊 Classificação de performance do sistema
     */
    getSystemPerformanceClassification(winRate) {
        if (winRate >= 80) return 'Excelente';
        if (winRate >= 70) return 'Muito Bom';
        if (winRate >= 60) return 'Bom';
        if (winRate >= 50) return 'Regular';
        return 'Precisa Melhorar';
    }

    /**
     * 🛡️ Classificação de risco
     */
    getRiskClassification(volatility) {
        if (volatility <= 50) return 'Baixo Risco';
        if (volatility <= 100) return 'Risco Moderado';
        if (volatility <= 200) return 'Alto Risco';
        return 'Risco Muito Alto';
    }

    /**
     * 📅 Converte período em dias
     */
    getPeriodDays(period) {
        const periods = {
            '1d': 1,
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        };
        return periods[period] || 30;
    }

    /**
     * 📊 Gera relatório completo de performance
     */
    async generatePerformanceReport(managerId = null, period = '30d') {
        try {
            this.log('Gerando relatório completo de performance');

            const [managerPerformance, systemWinRate, totalMetrics] = await Promise.all([
                this.calculateManagerPerformance(managerId, period),
                this.calculateWinRate(period),
                this.calculateTotalMetrics()
            ]);

            const report = {
                generated_at: new Date().toISOString(),
                period,
                system_overview: {
                    win_rate: systemWinRate,
                    total_metrics: totalMetrics
                },
                managers_performance: managerPerformance,
                summary: {
                    total_managers: managerPerformance.length,
                    best_manager: managerPerformance[0] || null,
                    system_health: this.getSystemHealth(systemWinRate.win_rate_percentage, totalMetrics.system_overview.total_pnl)
                }
            };

            this.log('Relatório completo de performance gerado com sucesso', 'SUCCESS');
            return report;

        } catch (error) {
            this.log(`Erro ao gerar relatório de performance: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 🏥 Avalia saúde geral do sistema
     */
    getSystemHealth(winRate, totalPnl) {
        const health = {
            score: 0,
            status: 'Unknown',
            recommendations: []
        };

        // Avaliação baseada na taxa de acerto
        if (winRate >= 70) health.score += 40;
        else if (winRate >= 60) health.score += 30;
        else if (winRate >= 50) health.score += 20;
        else health.recommendations.push('Melhorar estratégias de trading');

        // Avaliação baseada no PnL
        if (totalPnl > 1000) health.score += 40;
        else if (totalPnl > 0) health.score += 30;
        else if (totalPnl > -500) health.score += 10;
        else health.recommendations.push('Revisar gestão de risco');

        // Score de atividade
        health.score += 20; // Base score para sistema ativo

        // Determinar status
        if (health.score >= 90) health.status = 'Excelente';
        else if (health.score >= 70) health.status = 'Bom';
        else if (health.score >= 50) health.status = 'Regular';
        else health.status = 'Crítico';

        return health;
    }
}

module.exports = PerformanceIndicators;
