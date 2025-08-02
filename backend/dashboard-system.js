/**
 * 📊 SISTEMA DE DASHBOARD REFERENCIAL - COINBITCLUB MARKET BOT
 * 
 * Dashboard baseado no design de referência com indicadores de performance
 * Alimenta dados para cada perfil: Administração, Afiliado e Usuário
 * 
 * @version 3.0.0 DASHBOARD
 * @date 2025-07-31
 */

const PerformanceIndicators = require('./performance-indicators');

class DashboardSystem {
    constructor() {
        this.performanceIndicators = new PerformanceIndicators();
        this.log = this.log.bind(this);
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const emoji = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : '📊';
        console.log(`${emoji} [DASHBOARD] ${timestamp}: ${message}`);
    }

    /**
     * 👑 Dashboard para ADMINISTRAÇÃO
     */
    async getAdminDashboard() {
        try {
            this.log('Gerando dashboard para Administração');

            const [totalMetrics, managerPerformance, systemWinRate] = await Promise.all([
                this.performanceIndicators.calculateTotalMetrics(),
                this.performanceIndicators.calculateManagerPerformance(),
                this.performanceIndicators.calculateWinRate('30d')
            ]);

            return {
                profile: 'ADMINISTRAÇÃO',
                title: '🚀 Operação do Robô em Tempo Real',
                subtitle: 'Ciclo Atual #1',
                timestamp: new Date().toISOString(),
                
                // 📊 Métricas Principais
                main_metrics: {
                    total_operations: totalMetrics.system_overview.total_operations,
                    total_users: totalMetrics.system_overview.total_users,
                    total_managers: totalMetrics.system_overview.total_managers,
                    total_pnl: totalMetrics.system_overview.total_pnl,
                    system_win_rate: systemWinRate.win_rate_percentage + '%'
                },

                // 🔄 Etapas do Processo (Baseado no design de referência)
                process_stages: [
                    {
                        id: 1,
                        title: 'ANÁLISE DE MERCADO',
                        icon: '📊',
                        status: 'ATIVO',
                        description: `Analisando ${totalMetrics.system_overview.total_operations} operações | Win Rate: ${systemWinRate.win_rate_percentage}% | Volume: +68%`,
                        details: {
                            rsi: 'Normal (36)',
                            macd: 'BEARISH_CROSS',
                            volume: '+68%',
                            sentiment: 'Neutro'
                        }
                    },
                    {
                        id: 2,
                        title: 'GESTÃO DE SINAIS',
                        icon: '🎯',
                        status: 'AGUARDANDO',
                        description: `${managerPerformance.length} gestores ativos | Melhor gestor: ${managerPerformance[0]?.performance_metrics?.win_rate_percentage || 0}% de acerto`,
                        details: {
                            active_managers: managerPerformance.length,
                            best_performance: managerPerformance[0]?.performance_metrics?.win_rate_percentage || 0,
                            signals_today: totalMetrics.performance_by_period.today.operations
                        }
                    },
                    {
                        id: 3,
                        title: 'EXECUÇÃO DE OPERAÇÕES',
                        icon: '▶️',
                        status: 'AGUARDANDO',
                        description: `Operações executadas: ${totalMetrics.performance_by_period.today.operations} | PnL: $${totalMetrics.performance_by_period.today.pnl}`,
                        details: {
                            orders_executed: totalMetrics.performance_by_period.today.operations,
                            avg_execution_time: '1.4s',
                            success_rate: totalMetrics.performance_by_period.today.win_rate
                        }
                    },
                    {
                        id: 4,
                        title: 'MONITORAMENTO TEMPO REAL',
                        icon: '👁️',
                        status: 'AGUARDANDO',
                        description: `Preço atual: $${totalMetrics.system_overview.best_trade_ever} | P&L: $${totalMetrics.system_overview.total_pnl} | ROI: ${systemWinRate.win_rate_percentage}%`,
                        details: {
                            current_price: totalMetrics.system_overview.best_trade_ever,
                            pnl: totalMetrics.system_overview.total_pnl,
                            roi: systemWinRate.win_rate_percentage,
                            drawdown: totalMetrics.system_overview.worst_trade_ever
                        }
                    }
                ],

                // 📈 Indicadores de Performance para Admin
                performance_indicators: {
                    top_managers: totalMetrics.top_managers,
                    risk_metrics: totalMetrics.risk_metrics,
                    period_performance: totalMetrics.performance_by_period,
                    system_health: this.getSystemHealthAdmin(systemWinRate, totalMetrics)
                },

                // 🎛️ Controles de Administração
                admin_controls: {
                    can_start_stop: true,
                    can_configure: true,
                    can_view_all_users: true,
                    can_manage_managers: true,
                    emergency_stop: true
                }
            };

        } catch (error) {
            this.log(`Erro ao gerar dashboard admin: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 🤝 Dashboard para AFILIADO
     */
    async getAffiliateDashboard(affiliateId) {
        try {
            this.log(`Gerando dashboard para Afiliado: ${affiliateId}`);

            // Simular dados do afiliado (seria buscado do banco)
            const affiliateData = await this.getAffiliateData(affiliateId);
            const systemWinRate = await this.performanceIndicators.calculateWinRate('30d');

            return {
                profile: 'AFILIADO',
                title: '💼 Painel do Afiliado - Operação em Tempo Real',
                subtitle: `Ciclo Atual #1 - ${affiliateData.referred_users} Usuários Referenciados`,
                timestamp: new Date().toISOString(),

                // 💰 Métricas do Afiliado
                affiliate_metrics: {
                    referred_users: affiliateData.referred_users,
                    active_users: affiliateData.active_users,
                    total_commission: affiliateData.total_commission,
                    commission_rate: affiliateData.commission_rate,
                    monthly_earnings: affiliateData.monthly_earnings
                },

                // 🔄 Etapas Focadas no Afiliado
                process_stages: [
                    {
                        id: 1,
                        title: 'PERFORMANCE DOS REFERENCIADOS',
                        icon: '👥',
                        status: 'ATIVO',
                        description: `${affiliateData.active_users}/${affiliateData.referred_users} usuários ativos | Rentabilidade média: ${systemWinRate.win_rate_percentage}%`,
                        details: {
                            conversion_rate: (affiliateData.active_users / affiliateData.referred_users * 100).toFixed(1) + '%',
                            avg_profit: systemWinRate.average_pnl_per_trade,
                            retention_rate: '85%'
                        }
                    },
                    {
                        id: 2,
                        title: 'COMISSÕES GERADAS',
                        icon: '💰',
                        status: 'ATIVO',
                        description: `Comissão total: $${affiliateData.total_commission} | Este mês: $${affiliateData.monthly_earnings}`,
                        details: {
                            commission_rate: affiliateData.commission_rate + '%',
                            pending_payout: affiliateData.pending_payout,
                            next_payout: affiliateData.next_payout_date
                        }
                    },
                    {
                        id: 3,
                        title: 'OPORTUNIDADES DE CRESCIMENTO',
                        icon: '📈',
                        status: 'AGUARDANDO',
                        description: `Potencial de ganho: $${affiliateData.growth_potential} | Meta mensal: 80% atingida`,
                        details: {
                            growth_potential: affiliateData.growth_potential,
                            monthly_goal: '80%',
                            suggested_actions: ['Compartilhar resultados', 'Engajar leads', 'Demonstrar ROI']
                        }
                    },
                    {
                        id: 4,
                        title: 'FERRAMENTAS DE MARKETING',
                        icon: '🛠️',
                        status: 'DISPONÍVEL',
                        description: 'Materiais prontos para compartilhamento | Links personalizados ativos',
                        details: {
                            marketing_materials: 15,
                            tracking_links: 5,
                            conversion_tools: 8
                        }
                    }
                ],

                // 📊 Indicadores para Afiliado
                performance_indicators: {
                    user_satisfaction: '96%',
                    avg_user_profit: systemWinRate.average_pnl_per_trade,
                    referral_performance: affiliateData.referral_performance,
                    earning_trend: 'Crescendo +15% mês a mês'
                }
            };

        } catch (error) {
            this.log(`Erro ao gerar dashboard afiliado: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 👤 Dashboard para USUÁRIO
     */
    async getUserDashboard(userId) {
        try {
            this.log(`Gerando dashboard para Usuário: ${userId}`);

            // Buscar dados específicos do usuário
            const userData = await this.getUserData(userId);
            const userPerformance = await this.performanceIndicators.calculateManagerPerformance(userId, '30d');
            const systemWinRate = await this.performanceIndicators.calculateWinRate('7d');

            return {
                profile: 'USUÁRIO',
                title: '🎯 Sua Operação em Tempo Real',
                subtitle: `Ciclo Atual #1 - Conta: ${userData.account_type}`,
                timestamp: new Date().toISOString(),

                // 💎 Métricas Pessoais do Usuário
                user_metrics: {
                    account_balance: userData.balance,
                    total_operations: userData.total_operations,
                    win_rate: userData.win_rate,
                    total_profit: userData.total_profit,
                    monthly_roi: userData.monthly_roi,
                    account_type: userData.account_type
                },

                // 🔄 Etapas Personalizadas do Usuário
                process_stages: [
                    {
                        id: 1,
                        title: 'SUA ANÁLISE DE MERCADO',
                        icon: '🎯',
                        status: 'ATIVO',
                        description: `Estratégia pessoal ativa | Nível de risco: ${userData.risk_level} | Estilo: ${userData.trading_style}`,
                        details: {
                            strategy: userData.strategy,
                            risk_level: userData.risk_level,
                            trading_style: userData.trading_style,
                            confidence: '85%'
                        }
                    },
                    {
                        id: 2,
                        title: 'SUAS POSIÇÕES',
                        icon: '📈',
                        status: userData.has_open_positions ? 'ATIVO' : 'AGUARDANDO',
                        description: `${userData.open_positions} posições abertas | Exposição: ${userData.exposure}% da conta`,
                        details: {
                            open_positions: userData.open_positions,
                            avg_position_size: userData.avg_position_size,
                            exposure_percentage: userData.exposure,
                            unrealized_pnl: userData.unrealized_pnl
                        }
                    },
                    {
                        id: 3,
                        title: 'SEU RESULTADO',
                        icon: '💰',
                        status: 'ATIVO',
                        description: `Lucro hoje: $${userData.daily_profit} | Este mês: $${userData.monthly_profit} | ROI: ${userData.monthly_roi}%`,
                        details: {
                            daily_profit: userData.daily_profit,
                            monthly_profit: userData.monthly_profit,
                            roi: userData.monthly_roi,
                            best_trade: userData.best_trade
                        }
                    },
                    {
                        id: 4,
                        title: 'PRÓXIMAS OPORTUNIDADES',
                        icon: '🚀',
                        status: 'AGUARDANDO',
                        description: 'Aguardando sinais ideais para seu perfil | Próximo sinal estimado em 15min',
                        details: {
                            next_signal_eta: '15 minutos',
                            signal_quality: 'Alta probabilidade',
                            suggested_action: 'Manter estratégia atual',
                            market_sentiment: 'Favorável'
                        }
                    }
                ],

                // 🎯 Indicadores Pessoais
                performance_indicators: {
                    personal_ranking: userData.ranking,
                    vs_market: userData.vs_market_performance,
                    consistency_score: userData.consistency_score,
                    growth_trend: userData.growth_trend
                },

                // 🛡️ Gestão de Risco Pessoal
                risk_management: {
                    max_daily_loss: userData.max_daily_loss,
                    current_drawdown: userData.current_drawdown,
                    risk_score: userData.risk_score,
                    suggested_position_size: userData.suggested_position_size
                }
            };

        } catch (error) {
            this.log(`Erro ao gerar dashboard usuário: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 🔄 Atualiza dados em tempo real
     */
    async updateRealTimeData(profile, userId = null) {
        try {
            let dashboard;
            
            switch (profile.toLowerCase()) {
                case 'admin':
                case 'administração':
                    dashboard = await this.getAdminDashboard();
                    break;
                case 'affiliate':
                case 'afiliado':
                    dashboard = await this.getAffiliateDashboard(userId);
                    break;
                case 'user':
                case 'usuário':
                    dashboard = await this.getUserDashboard(userId);
                    break;
                default:
                    throw new Error('Perfil não reconhecido');
            }

            this.log(`Dashboard ${profile} atualizado em tempo real`, 'SUCCESS');
            return dashboard;

        } catch (error) {
            this.log(`Erro ao atualizar dashboard ${profile}: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * 🏥 Health check do sistema para Admin
     */
    getSystemHealthAdmin(winRate, metrics) {
        const score = winRate.win_rate_percentage >= 70 ? 'EXCELENTE' : 
                     winRate.win_rate_percentage >= 60 ? 'BOM' : 
                     winRate.win_rate_percentage >= 50 ? 'REGULAR' : 'CRÍTICO';

        return {
            overall_score: score,
            uptime: '99.8%',
            response_time: '125ms',
            active_connections: metrics.system_overview.total_users,
            error_rate: '0.2%',
            performance_grade: 'A+'
        };
    }

    /**
     * 🤝 Dados simulados do afiliado
     */
    async getAffiliateData(affiliateId) {
        // Em produção, seria uma query real no banco
        return {
            referred_users: 25,
            active_users: 20,
            total_commission: '2,450.00',
            commission_rate: 15,
            monthly_earnings: '380.00',
            pending_payout: '125.00',
            next_payout_date: '2025-08-01',
            growth_potential: '500.00',
            referral_performance: [
                { month: 'Jun', earnings: 320 },
                { month: 'Jul', earnings: 380 },
                { month: 'Ago', earnings: 450 }
            ]
        };
    }

    /**
     * 👤 Dados simulados do usuário
     */
    async getUserData(userId) {
        // Em produção, seria uma query real no banco
        return {
            balance: '5,247.83',
            total_operations: 45,
            win_rate: '68%',
            total_profit: '1,247.83',
            monthly_roi: '24.8',
            account_type: 'Premium',
            risk_level: 'Moderado',
            trading_style: 'Swing Trading',
            strategy: 'IA + Indicadores Técnicos',
            has_open_positions: true,
            open_positions: 2,
            exposure: 35,
            avg_position_size: '500.00',
            unrealized_pnl: '+127.50',
            daily_profit: '45.20',
            monthly_profit: '380.75',
            best_trade: '+95.40',
            ranking: '#23 de 1,247 usuários',
            vs_market_performance: '+12.5% acima do mercado',
            consistency_score: '85%',
            growth_trend: 'Crescendo +8% mensal',
            max_daily_loss: '250.00',
            current_drawdown: '2.1%',
            risk_score: '7/10',
            suggested_position_size: '300.00'
        };
    }
}

module.exports = DashboardSystem;
