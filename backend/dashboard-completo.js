/**
 * 📊 DASHBOARD COMPLETO DO SISTEMA - FLUXO OPERACIONAL E ADMINISTRATIVO
 * =====================================================================
 * 
 * Dashboard em tempo real para monitoramento completo:
 * ✅ Fluxo de sinais (recebimento → processamento → execução)
 * ✅ Análises de mercado em tempo real
 * ✅ Decisões da IA e critérios utilizados
 * ✅ Ordens emitidas e motivos
 * ✅ Performance de usuários
 * ✅ Logs administrativos
 * ✅ Métricas operacionais
 * ✅ Status do sistema
 */

const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

class DashboardCompleto {
    constructor() {
        console.log('📊 INICIALIZANDO DASHBOARD COMPLETO DO SISTEMA');
        console.log('============================================');
        
        this.app = express();
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });

        // Configurar middleware
        this.app.use(express.static(path.join(__dirname, 'dashboard-public')));
        this.app.use(express.json());
        
        // CORS para desenvolvimento
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        // Cache para dados em tempo real
        this.cache = {
            lastSignals: [],
            marketData: null,
            systemStatus: null,
            userStats: null,
            lastUpdate: null
        };

        this.configurarRotas();
        this.iniciarMonitoramento();
    }

    configurarRotas() {
        // 🏠 Página principal do dashboard
        this.app.get('/', (req, res) => {
            res.send(this.gerarHTMLDashboard());
        });

        // 📊 API para dados do dashboard em tempo real
        this.app.get('/api/dashboard/realtime', this.getDadosTempoReal.bind(this));
        
        // 📡 API para fluxo de sinais
        this.app.get('/api/dashboard/signals', this.getFluxoSinais.bind(this));
        
        // 🎯 API para análises de mercado
        this.app.get('/api/dashboard/market', this.getAnalisesMercado.bind(this));
        
        // 🤖 API para decisões da IA
        this.app.get('/api/dashboard/ai-decisions', this.getDecissoesIA.bind(this));
        
        // 💰 API para ordens e execuções
        this.app.get('/api/dashboard/orders', this.getOrdensExecucoes.bind(this));
        
        // 👥 API para performance de usuários
        this.app.get('/api/dashboard/users', this.getPerformanceUsuarios.bind(this));
        
        // 📈 API para métricas operacionais
        this.app.get('/api/dashboard/metrics', this.getMetricasOperacionais.bind(this));
        
        // 🔧 API para status do sistema
        this.app.get('/api/dashboard/system', this.getStatusSistema.bind(this));
        
        // 📝 API para logs administrativos
        this.app.get('/api/dashboard/admin-logs', this.getLogsAdministrativos.bind(this));

        // 🔍 API para busca e filtros
        this.app.get('/api/dashboard/search', this.buscarDados.bind(this));

        // WebSocket para atualizações em tempo real seria ideal, mas usando polling por simplicidade
        this.app.get('/api/dashboard/stream', this.streamDados.bind(this));

        // 🦅 AGUIA NEWS - APIs integradas
        this.app.get('/api/aguia/latest', this.getAguiaLatest.bind(this));
        this.app.get('/api/aguia/stats', this.getAguiaStats.bind(this));
        this.app.get('/api/aguia/radars', this.getAguiaRadars.bind(this));
        this.app.post('/api/aguia/generate', this.generateAguiaRadar.bind(this));
    }

    /**
     * 📊 DADOS EM TEMPO REAL - VISÃO GERAL
     */
    async getDadosTempoReal(req, res) {
        try {
            const agora = new Date();
            
            // Buscar últimos sinais (últimas 24h)
            const ultimosSinais = await this.pool.query(`
                SELECT 
                    ts.*,
                    sm.market_direction,
                    sm.ai_decision,
                    sm.execution_result,
                    sm.created_at as processed_at
                FROM trading_signals ts
                LEFT JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE ts.created_at >= NOW() - INTERVAL '24 hours'
                ORDER BY ts.created_at DESC
                LIMIT 50
            `);

            // Buscar estatísticas do dia
            const estatisticasDia = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_sinais,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'true' THEN 1 END) as sinais_aprovados,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'false' THEN 1 END) as sinais_rejeitados,
                    COUNT(CASE WHEN ts.signal LIKE '%FORTE%' THEN 1 END) as sinais_forte
                FROM trading_signals ts
                LEFT JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE ts.created_at >= CURRENT_DATE
            `);

            // Buscar ordens do dia
            const ordensDia = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_ordens,
                    COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as ordens_executadas,
                    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as ordens_canceladas,
                    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as ordens_ativas,
                    SUM(CASE WHEN status = 'FILLED' THEN amount ELSE 0 END) as volume_total
                FROM trading_orders
                WHERE created_at >= CURRENT_DATE
            `);

            // Buscar usuários ativos
            const usuariosAtivos = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_usuarios,
                    COUNT(CASE WHEN last_login >= CURRENT_DATE THEN 1 END) as usuarios_ativos_hoje,
                    COUNT(CASE WHEN plan_type = 'VIP' THEN 1 END) as usuarios_vip,
                    COUNT(CASE WHEN plan_type = 'PREMIUM' THEN 1 END) as usuarios_premium
                FROM users
                WHERE is_active = true
            `);

            // Status do sistema
            const statusSistema = await this.verificarStatusSistema();

            res.json({
                success: true,
                timestamp: agora,
                data: {
                    signals: {
                        recent: ultimosSinais.rows,
                        stats: estatisticasDia.rows[0]
                    },
                    orders: ordensDia.rows[0],
                    users: usuariosAtivos.rows[0],
                    systemStatus: statusSistema,
                    lastUpdate: agora
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar dados em tempo real:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 📡 FLUXO COMPLETO DE SINAIS
     */
    async getFluxoSinais(req, res) {
        try {
            const { limit = 20, offset = 0, periodo = '24h' } = req.query;
            
            let intervalCondition = "NOW() - INTERVAL '24 hours'";
            if (periodo === '1h') intervalCondition = "NOW() - INTERVAL '1 hour'";
            else if (periodo === '12h') intervalCondition = "NOW() - INTERVAL '12 hours'";
            else if (periodo === '7d') intervalCondition = "NOW() - INTERVAL '7 days'";

            const fluxoCompleto = await this.pool.query(`
                SELECT 
                    ts.id,
                    ts.signal,
                    ts.ticker,
                    ts.source,
                    ts.timestamp as signal_timestamp,
                    ts.created_at as received_at,
                    
                    -- Dados do processamento
                    sm.market_direction,
                    sm.ai_decision,
                    sm.execution_result,
                    sm.btc_analysis,
                    sm.rsi_analysis,
                    sm.created_at as processed_at,
                    
                    -- Ordens geradas
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', to_.id,
                                'user_id', to_.user_id,
                                'status', to_.status,
                                'amount', to_.amount,
                                'price', to_.price,
                                'exchange', to_.exchange,
                                'created_at', to_.created_at,
                                'user_email', u.email,
                                'user_plan', u.plan_type
                            )
                        )
                        FROM trading_orders to_
                        LEFT JOIN users u ON to_.user_id = u.id
                        WHERE to_.signal_id = ts.id
                    ) as orders_generated,
                    
                    -- Resultado do processamento
                    CASE 
                        WHEN sm.ai_decision->>'shouldExecute' = 'true' THEN 'APROVADO'
                        WHEN sm.ai_decision->>'shouldExecute' = 'false' THEN 'REJEITADO'
                        ELSE 'PROCESSANDO'
                    END as decision_status,
                    
                    sm.ai_decision->>'analysis' as ai_reasoning,
                    sm.market_direction->>'allowed' as market_direction_allowed,
                    sm.market_direction->>'fearGreed' as fear_greed_data
                    
                FROM trading_signals ts
                LEFT JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE ts.created_at >= ${intervalCondition}
                ORDER BY ts.created_at DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            // Estatísticas do período
            const estatisticas = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_signals,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'true' THEN 1 END) as approved_signals,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'false' THEN 1 END) as rejected_signals,
                    AVG(EXTRACT(EPOCH FROM (sm.created_at - ts.created_at))) as avg_processing_time,
                    COUNT(DISTINCT ts.ticker) as unique_tickers,
                    COUNT(CASE WHEN ts.signal LIKE '%FORTE%' THEN 1 END) as strong_signals
                FROM trading_signals ts
                LEFT JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE ts.created_at >= ${intervalCondition}
            `);

            res.json({
                success: true,
                data: {
                    signals: fluxoCompleto.rows,
                    statistics: estatisticas.rows[0],
                    period: periodo,
                    pagination: {
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: fluxoCompleto.rows.length === parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar fluxo de sinais:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 🎯 ANÁLISES DE MERCADO EM TEMPO REAL
     */
    async getAnalisesMercado(req, res) {
        try {
            // Buscar últimas análises de mercado
            const ultimasAnalises = await this.pool.query(`
                SELECT 
                    sm.market_direction,
                    sm.btc_analysis,
                    sm.rsi_analysis,
                    sm.created_at,
                    ts.ticker,
                    ts.signal
                FROM signal_metrics sm
                JOIN trading_signals ts ON sm.signal_id = ts.id
                WHERE sm.created_at >= NOW() - INTERVAL '4 hours'
                ORDER BY sm.created_at DESC
                LIMIT 20
            `);

            // Estatísticas de direção do mercado
            const direcaoMercado = await this.pool.query(`
                SELECT 
                    sm.market_direction->>'allowed' as direction,
                    COUNT(*) as count,
                    AVG((sm.market_direction->>'fearGreed')::json->>'value'::int) as avg_fear_greed,
                    AVG((sm.market_direction->>'top100'->>'percentageUp')::numeric) as avg_top100_up
                FROM signal_metrics sm
                WHERE sm.created_at >= NOW() - INTERVAL '24 hours'
                  AND sm.market_direction IS NOT NULL
                GROUP BY sm.market_direction->>'allowed'
                ORDER BY count DESC
            `);

            // Análise BTC Dominância
            const btcDominance = await this.pool.query(`
                SELECT 
                    (sm.btc_analysis->>'btcDominance'->>'btcDominance')::numeric as dominance,
                    sm.btc_analysis->>'btcDominance'->>'classification' as classification,
                    sm.created_at
                FROM signal_metrics sm
                WHERE sm.created_at >= NOW() - INTERVAL '12 hours'
                  AND sm.btc_analysis IS NOT NULL
                ORDER BY sm.created_at DESC
                LIMIT 50
            `);

            res.json({
                success: true,
                data: {
                    recentAnalyses: ultimasAnalises.rows,
                    marketDirection: direcaoMercado.rows,
                    btcDominance: btcDominance.rows,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar análises de mercado:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 🤖 DECISÕES DA IA E CRITÉRIOS
     */
    async getDecissoesIA(req, res) {
        try {
            const { limit = 30 } = req.query;

            const decisoesIA = await this.pool.query(`
                SELECT 
                    ts.id as signal_id,
                    ts.signal,
                    ts.ticker,
                    ts.created_at as signal_time,
                    sm.ai_decision,
                    sm.market_direction,
                    sm.execution_result,
                    
                    -- Extrair detalhes da decisão
                    sm.ai_decision->>'shouldExecute' as should_execute,
                    sm.ai_decision->>'analysis' as ai_analysis,
                    sm.ai_decision->>'confidence' as confidence,
                    sm.ai_decision->>'isStrongSignal' as is_strong_signal,
                    sm.ai_decision->>'factors' as decision_factors,
                    
                    -- Tempo de processamento
                    EXTRACT(EPOCH FROM (sm.created_at - ts.created_at)) as processing_time_seconds,
                    
                    -- Resultado das ordens
                    (
                        SELECT COUNT(*)
                        FROM trading_orders to_
                        WHERE to_.signal_id = ts.id AND to_.status = 'FILLED'
                    ) as successful_orders,
                    
                    (
                        SELECT COUNT(*)
                        FROM trading_orders to_
                        WHERE to_.signal_id = ts.id
                    ) as total_orders
                    
                FROM trading_signals ts
                JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE sm.ai_decision IS NOT NULL
                ORDER BY ts.created_at DESC
                LIMIT $1
            `, [limit]);

            // Estatísticas das decisões da IA
            const estatisticasIA = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_decisions,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'true' THEN 1 END) as approved_count,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'false' THEN 1 END) as rejected_count,
                    AVG((sm.ai_decision->>'confidence')::numeric) as avg_confidence,
                    COUNT(CASE WHEN sm.ai_decision->>'isStrongSignal' = 'true' THEN 1 END) as strong_signal_count,
                    AVG(EXTRACT(EPOCH FROM (sm.created_at - ts.created_at))) as avg_processing_time
                FROM trading_signals ts
                JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE sm.created_at >= NOW() - INTERVAL '24 hours'
                  AND sm.ai_decision IS NOT NULL
            `);

            // Fatores de decisão mais comuns
            const fatoresComuns = await this.pool.query(`
                SELECT 
                    sm.ai_decision->>'analysis' as reasoning,
                    COUNT(*) as frequency,
                    AVG(CASE WHEN sm.ai_decision->>'shouldExecute' = 'true' THEN 1 ELSE 0 END) as approval_rate
                FROM signal_metrics sm
                WHERE sm.created_at >= NOW() - INTERVAL '7 days'
                  AND sm.ai_decision IS NOT NULL
                  AND sm.ai_decision->>'analysis' IS NOT NULL
                GROUP BY sm.ai_decision->>'analysis'
                ORDER BY frequency DESC
                LIMIT 10
            `);

            res.json({
                success: true,
                data: {
                    decisions: decisoesIA.rows,
                    statistics: estatisticasIA.rows[0],
                    commonFactors: fatoresComuns.rows,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar decisões da IA:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 💰 ORDENS E EXECUÇÕES DETALHADAS
     */
    async getOrdensExecucoes(req, res) {
        try {
            const { limit = 50, status, userId, ticker } = req.query;
            
            let whereConditions = ['to_.created_at >= NOW() - INTERVAL \'24 hours\''];
            let params = [];
            let paramIndex = 1;

            if (status) {
                whereConditions.push(`to_.status = $${paramIndex}`);
                params.push(status);
                paramIndex++;
            }

            if (userId) {
                whereConditions.push(`to_.user_id = $${paramIndex}`);
                params.push(userId);
                paramIndex++;
            }

            if (ticker) {
                whereConditions.push(`ts.ticker = $${paramIndex}`);
                params.push(ticker);
                paramIndex++;
            }

            params.push(limit);

            const ordens = await this.pool.query(`
                SELECT 
                    to_.id,
                    to_.user_id,
                    to_.signal_id,
                    to_.status,
                    to_.order_type,
                    to_.side,
                    to_.amount,
                    to_.price,
                    to_.stop_loss,
                    to_.take_profit,
                    to_.exchange,
                    to_.exchange_order_id,
                    to_.created_at,
                    to_.filled_at,
                    to_.error_message,
                    
                    -- Dados do usuário
                    u.email as user_email,
                    u.plan_type as user_plan,
                    u.user_type,
                    
                    -- Dados do sinal
                    ts.signal,
                    ts.ticker,
                    ts.source as signal_source,
                    ts.timestamp as signal_timestamp,
                    
                    -- Decisão da IA
                    sm.ai_decision->>'analysis' as ai_reasoning,
                    sm.ai_decision->>'isStrongSignal' as was_strong_signal,
                    
                    -- Performance da ordem
                    CASE 
                        WHEN to_.status = 'FILLED' AND to_.filled_at IS NOT NULL THEN
                            EXTRACT(EPOCH FROM (to_.filled_at - to_.created_at))
                        ELSE NULL
                    END as execution_time_seconds
                    
                FROM trading_orders to_
                LEFT JOIN users u ON to_.user_id = u.id
                LEFT JOIN trading_signals ts ON to_.signal_id = ts.id
                LEFT JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY to_.created_at DESC
                LIMIT $${paramIndex}
            `, params);

            // Estatísticas das ordens
            const estatisticasOrdens = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as filled_orders,
                    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
                    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_orders,
                    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_orders,
                    AVG(amount) as avg_amount,
                    SUM(CASE WHEN status = 'FILLED' THEN amount ELSE 0 END) as total_volume,
                    AVG(CASE WHEN filled_at IS NOT NULL THEN EXTRACT(EPOCH FROM (filled_at - created_at)) END) as avg_execution_time
                FROM trading_orders
                WHERE created_at >= NOW() - INTERVAL '24 hours'
            `);

            // Performance por exchange
            const performanceExchange = await this.pool.query(`
                SELECT 
                    exchange,
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'FILLED' THEN 1 END) as filled_orders,
                    AVG(CASE WHEN filled_at IS NOT NULL THEN EXTRACT(EPOCH FROM (filled_at - created_at)) END) as avg_execution_time,
                    SUM(CASE WHEN status = 'FILLED' THEN amount ELSE 0 END) as volume
                FROM trading_orders
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY exchange
                ORDER BY total_orders DESC
            `);

            res.json({
                success: true,
                data: {
                    orders: ordens.rows,
                    statistics: estatisticasOrdens.rows[0],
                    performanceByExchange: performanceExchange.rows,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar ordens:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 👥 PERFORMANCE DE USUÁRIOS
     */
    async getPerformanceUsuarios(req, res) {
        try {
            const performanceUsuarios = await this.pool.query(`
                SELECT 
                    u.id,
                    u.email,
                    u.plan_type,
                    u.user_type,
                    u.created_at as user_since,
                    u.last_login,
                    
                    -- Estatísticas de trading
                    COUNT(to_.id) as total_orders,
                    COUNT(CASE WHEN to_.status = 'FILLED' THEN 1 END) as successful_orders,
                    COUNT(CASE WHEN to_.status = 'FAILED' THEN 1 END) as failed_orders,
                    SUM(CASE WHEN to_.status = 'FILLED' THEN to_.amount ELSE 0 END) as total_volume,
                    AVG(CASE WHEN to_.filled_at IS NOT NULL THEN EXTRACT(EPOCH FROM (to_.filled_at - to_.created_at)) END) as avg_execution_time,
                    
                    -- Saldos atuais
                    u.balance_brl,
                    u.balance_usd,
                    u.admin_credits_brl,
                    u.admin_credits_usd,
                    
                    -- Última atividade
                    MAX(to_.created_at) as last_order_time,
                    
                    -- Performance ratio
                    CASE 
                        WHEN COUNT(to_.id) > 0 THEN 
                            ROUND((COUNT(CASE WHEN to_.status = 'FILLED' THEN 1 END)::numeric / COUNT(to_.id)::numeric) * 100, 2)
                        ELSE 0 
                    END as success_rate_percentage
                    
                FROM users u
                LEFT JOIN trading_orders to_ ON u.id = to_.user_id AND to_.created_at >= NOW() - INTERVAL '30 days'
                WHERE u.is_active = true
                GROUP BY u.id, u.email, u.plan_type, u.user_type, u.created_at, u.last_login, 
                         u.balance_brl, u.balance_usd, u.admin_credits_brl, u.admin_credits_usd
                ORDER BY total_orders DESC, success_rate_percentage DESC
                LIMIT 100
            `);

            // Estatísticas gerais de usuários
            const estatisticasUsuarios = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_active_users,
                    COUNT(CASE WHEN last_login >= CURRENT_DATE THEN 1 END) as users_active_today,
                    COUNT(CASE WHEN plan_type = 'VIP' THEN 1 END) as vip_users,
                    COUNT(CASE WHEN plan_type = 'PREMIUM' THEN 1 END) as premium_users,
                    COUNT(CASE WHEN plan_type = 'BASIC' THEN 1 END) as basic_users,
                    AVG(balance_brl + balance_usd) as avg_balance
                FROM users
                WHERE is_active = true
            `);

            res.json({
                success: true,
                data: {
                    userPerformance: performanceUsuarios.rows,
                    userStatistics: estatisticasUsuarios.rows[0],
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar performance de usuários:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 🔧 STATUS COMPLETO DO SISTEMA
     */
    async getStatusSistema(req, res) {
        try {
            const status = await this.verificarStatusSistema();
            res.json({
                success: true,
                data: status,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao verificar status do sistema:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async verificarStatusSistema() {
        try {
            // Verificar banco de dados
            const dbStatus = await this.pool.query('SELECT NOW()');
            const dbConnected = dbStatus.rows.length > 0;

            // Verificar últimos sinais
            const ultimoSinal = await this.pool.query(`
                SELECT created_at FROM trading_signals 
                ORDER BY created_at DESC LIMIT 1
            `);

            // Verificar ordens ativas
            const ordensAtivas = await this.pool.query(`
                SELECT COUNT(*) as count FROM trading_orders 
                WHERE status = 'ACTIVE'
            `);

            // Verificar usuários ativos nas últimas 24h
            const usuariosAtivos = await this.pool.query(`
                SELECT COUNT(*) as count FROM users 
                WHERE last_login >= NOW() - INTERVAL '24 hours'
            `);

            // Verificar espaço em disco (aproximado através de logs)
            const diskSpace = await this.verificarEspacoDisco();

            return {
                database: {
                    connected: dbConnected,
                    lastQuery: dbStatus.rows[0]?.now || null
                },
                signals: {
                    lastSignalTime: ultimoSinal.rows[0]?.created_at || null,
                    timeSinceLastSignal: ultimoSinal.rows[0] ? 
                        Date.now() - new Date(ultimoSinal.rows[0].created_at).getTime() : null
                },
                orders: {
                    activeCount: parseInt(ordensAtivas.rows[0]?.count || 0)
                },
                users: {
                    activeToday: parseInt(usuariosAtivos.rows[0]?.count || 0)
                },
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    diskSpace: diskSpace
                },
                timestamp: new Date()
            };

        } catch (error) {
            return {
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    async verificarEspacoDisco() {
        try {
            const stats = fs.statSync(__dirname);
            return {
                available: 'N/A', // Seria necessário uma lib específica para isso
                used: 'N/A'
            };
        } catch {
            return { available: 'N/A', used: 'N/A' };
        }
    }

    /**
     * 🎨 GERAR HTML DO DASHBOARD
     */
    gerarHTMLDashboard() {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 CoinBitClub - Dashboard Operacional</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            line-height: 1.6;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 { color: #00d4aa; margin-bottom: 10px; }
        .header p { color: #cccccc; }
        
        .grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .card {
            background: linear-gradient(135deg, #1e1e2e, #2a2a3e);
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #333;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .card h3 {
            color: #00d4aa;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        
        .metric-value {
            font-weight: bold;
            color: #00d4aa;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online { background-color: #00ff88; }
        .status-warning { background-color: #ffaa00; }
        .status-offline { background-color: #ff4444; }
        
        .table-container {
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #333;
        }
        
        th {
            background: rgba(0, 212, 170, 0.1);
            color: #00d4aa;
            position: sticky;
            top: 0;
        }
        
        .signal-approved { color: #00ff88; }
        .signal-rejected { color: #ff4444; }
        .signal-processing { color: #ffaa00; }
        
        .refresh-btn {
            background: linear-gradient(135deg, #00d4aa, #00aa88);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .refresh-btn:hover {
            background: linear-gradient(135deg, #00aa88, #008866);
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .auto-refresh {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #333;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .loading {
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 CoinBitClub - Dashboard Operacional Completo</h1>
            <p>Monitoramento em tempo real do fluxo operacional e administrativo</p>
            <div id="lastUpdate">Última atualização: Carregando...</div>
        </div>
        
        <div class="auto-refresh">
            <label>
                <input type="checkbox" id="autoRefresh" checked> Auto-refresh (30s)
            </label>
            <button class="refresh-btn" onclick="atualizarDados()">🔄 Atualizar</button>
        </div>
        
        <div class="grid">
            <!-- Status do Sistema -->
            <div class="card">
                <h3>🔧 Status do Sistema</h3>
                <div id="systemStatus">Carregando...</div>
            </div>
            
            <!-- Estatísticas de Sinais -->
            <div class="card">
                <h3>📡 Sinais do Dia</h3>
                <div id="signalStats">Carregando...</div>
            </div>
            
            <!-- Ordens -->
            <div class="card">
                <h3>💰 Ordens</h3>
                <div id="orderStats">Carregando...</div>
            </div>
            
            <!-- Usuários -->
            <div class="card">
                <h3>👥 Usuários</h3>
                <div id="userStats">Carregando...</div>
            </div>
        </div>
        
        <!-- Fluxo de Sinais em Tempo Real -->
        <div class="card full-width">
            <h3>📊 Fluxo de Sinais em Tempo Real</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Sinal</th>
                            <th>Ticker</th>
                            <th>Status</th>
                            <th>IA Decisão</th>
                            <th>Ordens</th>
                            <th>Motivo</th>
                        </tr>
                    </thead>
                    <tbody id="signalsTable">
                        <tr><td colspan="7">Carregando dados...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Ordens Recentes -->
        <div class="card full-width">
            <h3>🎯 Ordens Recentes</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Usuário</th>
                            <th>Ticker</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Exchange</th>
                            <th>Tempo Exec.</th>
                        </tr>
                    </thead>
                    <tbody id="ordersTable">
                        <tr><td colspan="8">Carregando dados...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 🦅 AGUIA NEWS - RELATÓRIOS GRATUITOS -->
        <div class="card">
            <h3>🦅 Aguia News - Relatórios Gratuitos</h3>
            <div class="aguia-controls">
                <button onclick="gerarRadarManual()" id="btnGerarRadar" class="btn-action">🔧 Gerar Radar Manual</button>
                <button onclick="atualizarAguiaNews()" class="btn-action">🔄 Atualizar</button>
            </div>
            
            <div class="aguia-stats">
                <div class="stat-item">
                    <span class="stat-label">Total de Radars:</span>
                    <span class="stat-value" id="aguiaTotalRadars">-</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Radars Hoje:</span>
                    <span class="stat-value" id="aguiaRadarsHoje">-</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Usuários Ativos:</span>
                    <span class="stat-value" id="aguiaTotalUsuarios">-</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Próxima Geração:</span>
                    <span class="stat-value">20:00 Brasília</span>
                </div>
            </div>
            
            <div class="aguia-content">
                <h4>📄 Último Radar Gerado</h4>
                <div class="radar-content" id="aguiaRadarContent">
                    <div class="loading">Carregando último radar...</div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .aguia-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .btn-action {
            background: linear-gradient(135deg, #00d4aa, #00b491);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .btn-action:hover {
            background: linear-gradient(135deg, #00b491, #009178);
            transform: translateY(-1px);
        }
        
        .btn-action:disabled {
            background: #555;
            cursor: not-allowed;
            transform: none;
        }
        
        .aguia-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(0, 212, 170, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(0, 212, 170, 0.2);
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-label {
            display: block;
            font-size: 12px;
            color: #999;
            margin-bottom: 5px;
        }
        
        .stat-value {
            display: block;
            font-size: 18px;
            font-weight: bold;
            color: #00d4aa;
        }
        
        .aguia-content {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .aguia-content h4 {
            color: #00d4aa;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 8px;
        }
        
        .radar-content {
            white-space: pre-line;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.6;
            color: #e0e0e0;
        }
        
        .loading {
            text-align: center;
            color: #888;
            font-style: italic;
        }
        
        .success-message {
            background: rgba(0, 212, 170, 0.2);
            color: #00d4aa;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid rgba(0, 212, 170, 0.3);
        }
        
        .error-message {
            background: rgba(255, 0, 0, 0.2);
            color: #ff6b6b;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid rgba(255, 0, 0, 0.3);
        }
    </style>

    <script>
        let autoRefreshInterval;
        
        function formatDateTime(dateString) {
            return new Date(dateString).toLocaleString('pt-BR');
        }
        
        function formatCurrency(value, currency = 'USD') {
            if (value === null || value === undefined) return 'N/A';
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: currency
            }).format(value);
        }
        
        function formatTime(seconds) {
            if (!seconds) return 'N/A';
            if (seconds < 60) return seconds.toFixed(1) + 's';
            return (seconds / 60).toFixed(1) + 'min';
        }
        
        async function atualizarDados() {
            document.getElementById('lastUpdate').textContent = 'Atualizando...';
            
            try {
                // Buscar dados gerais
                const realtimeResponse = await fetch('/api/dashboard/realtime');
                const realtimeData = await realtimeResponse.json();
                
                if (realtimeData.success) {
                    atualizarStatusSistema(realtimeData.data.systemStatus);
                    atualizarEstatisticasSinais(realtimeData.data.signals.stats);
                    atualizarEstatisticasOrdens(realtimeData.data.orders);
                    atualizarEstatisticasUsuarios(realtimeData.data.users);
                }
                
                // Buscar fluxo de sinais
                const signalsResponse = await fetch('/api/dashboard/signals?limit=20');
                const signalsData = await signalsResponse.json();
                
                if (signalsData.success) {
                    atualizarTabelaSinais(signalsData.data.signals);
                }
                
                // Buscar ordens
                const ordersResponse = await fetch('/api/dashboard/orders?limit=20');
                const ordersData = await ordersResponse.json();
                
                if (ordersData.success) {
                    atualizarTabelaOrdens(ordersData.data.orders);
                }

                // Buscar dados do Aguia News
                await atualizarAguiaNews();
                
                document.getElementById('lastUpdate').textContent = 
                    'Última atualização: ' + formatDateTime(new Date());
                    
            } catch (error) {
                console.error('Erro ao atualizar dados:', error);
                document.getElementById('lastUpdate').textContent = 
                    'Erro na atualização: ' + formatDateTime(new Date());
            }
        }
        
        function atualizarStatusSistema(status) {
            const html = \`
                <div class="metric">
                    <span>🗄️ Banco de Dados</span>
                    <span class="metric-value">
                        <span class="status-indicator \${status.database?.connected ? 'status-online' : 'status-offline'}"></span>
                        \${status.database?.connected ? 'Online' : 'Offline'}
                    </span>
                </div>
                <div class="metric">
                    <span>⏱️ Uptime</span>
                    <span class="metric-value">\${formatTime(status.system?.uptime)}</span>
                </div>
                <div class="metric">
                    <span>📊 Memória</span>
                    <span class="metric-value">\${(status.system?.memory?.used / 1024 / 1024).toFixed(0)}MB</span>
                </div>
                <div class="metric">
                    <span>👥 Usuários Ativos</span>
                    <span class="metric-value">\${status.users?.activeToday || 0}</span>
                </div>
                <div class="metric">
                    <span>⚡ Ordens Ativas</span>
                    <span class="metric-value">\${status.orders?.activeCount || 0}</span>
                </div>
            \`;
            document.getElementById('systemStatus').innerHTML = html;
        }
        
        function atualizarEstatisticasSinais(stats) {
            const total = parseInt(stats.total_sinais) || 0;
            const aprovados = parseInt(stats.sinais_aprovados) || 0;
            const rejeitados = parseInt(stats.sinais_rejeitados) || 0;
            const forte = parseInt(stats.sinais_forte) || 0;
            
            const html = \`
                <div class="metric">
                    <span>📊 Total</span>
                    <span class="metric-value">\${total}</span>
                </div>
                <div class="metric">
                    <span>✅ Aprovados</span>
                    <span class="metric-value signal-approved">\${aprovados}</span>
                </div>
                <div class="metric">
                    <span>❌ Rejeitados</span>
                    <span class="metric-value signal-rejected">\${rejeitados}</span>
                </div>
                <div class="metric">
                    <span>⭐ Sinais FORTE</span>
                    <span class="metric-value">\${forte}</span>
                </div>
                <div class="metric">
                    <span>📈 Taxa Aprovação</span>
                    <span class="metric-value">\${total > 0 ? ((aprovados/total)*100).toFixed(1) : 0}%</span>
                </div>
            \`;
            document.getElementById('signalStats').innerHTML = html;
        }
        
        function atualizarEstatisticasOrdens(stats) {
            const total = parseInt(stats.total_ordens) || 0;
            const executadas = parseInt(stats.ordens_executadas) || 0;
            const ativas = parseInt(stats.ordens_ativas) || 0;
            const volume = parseFloat(stats.volume_total) || 0;
            
            const html = \`
                <div class="metric">
                    <span>📊 Total</span>
                    <span class="metric-value">\${total}</span>
                </div>
                <div class="metric">
                    <span>✅ Executadas</span>
                    <span class="metric-value signal-approved">\${executadas}</span>
                </div>
                <div class="metric">
                    <span>⚡ Ativas</span>
                    <span class="metric-value signal-processing">\${ativas}</span>
                </div>
                <div class="metric">
                    <span>💰 Volume</span>
                    <span class="metric-value">\${formatCurrency(volume)}</span>
                </div>
                <div class="metric">
                    <span>📈 Taxa Sucesso</span>
                    <span class="metric-value">\${total > 0 ? ((executadas/total)*100).toFixed(1) : 0}%</span>
                </div>
            \`;
            document.getElementById('orderStats').innerHTML = html;
        }
        
        function atualizarEstatisticasUsuarios(stats) {
            const total = parseInt(stats.total_usuarios) || 0;
            const ativos = parseInt(stats.usuarios_ativos_hoje) || 0;
            const vip = parseInt(stats.usuarios_vip) || 0;
            const premium = parseInt(stats.usuarios_premium) || 0;
            
            const html = \`
                <div class="metric">
                    <span>👥 Total</span>
                    <span class="metric-value">\${total}</span>
                </div>
                <div class="metric">
                    <span>🟢 Ativos Hoje</span>
                    <span class="metric-value signal-approved">\${ativos}</span>
                </div>
                <div class="metric">
                    <span>👑 VIP</span>
                    <span class="metric-value">\${vip}</span>
                </div>
                <div class="metric">
                    <span>⭐ Premium</span>
                    <span class="metric-value">\${premium}</span>
                </div>
                <div class="metric">
                    <span>📈 Taxa Atividade</span>
                    <span class="metric-value">\${total > 0 ? ((ativos/total)*100).toFixed(1) : 0}%</span>
                </div>
            \`;
            document.getElementById('userStats').innerHTML = html;
        }
        
        function atualizarTabelaSinais(signals) {
            const tbody = document.getElementById('signalsTable');
            
            if (!signals || signals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">Nenhum sinal encontrado</td></tr>';
                return;
            }
            
            const html = signals.map(signal => {
                const status = signal.decision_status || 'PROCESSANDO';
                const statusClass = status === 'APROVADO' ? 'signal-approved' : 
                                  status === 'REJEITADO' ? 'signal-rejected' : 'signal-processing';
                
                const ordersCount = signal.orders_generated ? 
                    JSON.parse(signal.orders_generated).length : 0;
                
                return \`
                    <tr>
                        <td>\${formatDateTime(signal.received_at)}</td>
                        <td><strong>\${signal.signal}</strong></td>
                        <td>\${signal.ticker}</td>
                        <td class="\${statusClass}">\${status}</td>
                        <td>\${signal.should_execute === 'true' ? '✅ SIM' : signal.should_execute === 'false' ? '❌ NÃO' : '⏳'}</td>
                        <td>\${ordersCount} ordem(ns)</td>
                        <td title="\${signal.ai_reasoning || 'N/A'}">\${(signal.ai_reasoning || 'N/A').substring(0, 50)}...</td>
                    </tr>
                \`;
            }).join('');
            
            tbody.innerHTML = html;
        }
        
        function atualizarTabelaOrdens(orders) {
            const tbody = document.getElementById('ordersTable');
            
            if (!orders || orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">Nenhuma ordem encontrada</td></tr>';
                return;
            }
            
            const html = orders.map(order => {
                const statusClass = order.status === 'FILLED' ? 'signal-approved' : 
                                  order.status === 'FAILED' ? 'signal-rejected' : 'signal-processing';
                
                return \`
                    <tr>
                        <td>\${formatDateTime(order.created_at)}</td>
                        <td>\${order.user_email} (\${order.user_plan})</td>
                        <td>\${order.ticker}</td>
                        <td>\${order.side} \${order.order_type}</td>
                        <td>\${formatCurrency(order.amount)}</td>
                        <td class="\${statusClass}">\${order.status}</td>
                        <td>\${order.exchange}</td>
                        <td>\${formatTime(order.execution_time_seconds)}</td>
                    </tr>
                \`;
            }).join('');
            
            tbody.innerHTML = html;
        }
        
        // Auto-refresh
        document.getElementById('autoRefresh').addEventListener('change', function() {
            if (this.checked) {
                autoRefreshInterval = setInterval(atualizarDados, 30000);
            } else {
                clearInterval(autoRefreshInterval);
            }
        });
        
        // Carregar dados iniciais
        atualizarDados();
        
        // Iniciar auto-refresh
        autoRefreshInterval = setInterval(atualizarDados, 30000);
        
        // ===============================
        // 🦅 FUNÇÕES AGUIA NEWS
        // ===============================
        
        async function atualizarAguiaNews() {
            try {
                // Buscar estatísticas
                const statsResponse = await fetch('/api/aguia/stats');
                const statsData = await statsResponse.json();
                
                if (statsData.success) {
                    document.getElementById('aguiaTotalRadars').textContent = statsData.stats.total_radars;
                    document.getElementById('aguiaRadarsHoje').textContent = statsData.stats.radars_today;
                    document.getElementById('aguiaTotalUsuarios').textContent = statsData.stats.total_users;
                }
                
                // Buscar último radar
                const radarResponse = await fetch('/api/aguia/latest');
                const radarData = await radarResponse.json();
                
                if (radarData.success && radarData.radar) {
                    document.getElementById('aguiaRadarContent').textContent = radarData.radar.content;
                } else {
                    document.getElementById('aguiaRadarContent').innerHTML = '<div class="loading">Nenhum radar disponível</div>';
                }
                
            } catch (error) {
                console.error('Erro ao atualizar Aguia News:', error);
                document.getElementById('aguiaRadarContent').innerHTML = '<div class="error-message">Erro ao carregar dados do Aguia News</div>';
            }
        }
        
        async function gerarRadarManual() {
            const btn = document.getElementById('btnGerarRadar');
            const originalText = btn.textContent;
            
            btn.disabled = true;
            btn.textContent = '🔄 Gerando...';
            
            try {
                const response = await fetch('/api/aguia/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Mostrar mensagem de sucesso
                    const successDiv = document.createElement('div');
                    successDiv.className = 'success-message';
                    successDiv.textContent = '✅ ' + result.message;
                    
                    const aguiaContent = document.querySelector('.aguia-content');
                    aguiaContent.insertBefore(successDiv, aguiaContent.firstChild);
                    
                    // Atualizar conteúdo
                    document.getElementById('aguiaRadarContent').textContent = result.radar.content;
                    
                    // Atualizar estatísticas
                    await atualizarAguiaNews();
                    
                    // Remover mensagem após 5 segundos
                    setTimeout(() => {
                        successDiv.remove();
                    }, 5000);
                    
                } else {
                    throw new Error(result.error || 'Erro desconhecido');
                }
                
            } catch (error) {
                console.error('Erro ao gerar radar:', error);
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = '❌ Erro ao gerar radar: ' + error.message;
                
                const aguiaContent = document.querySelector('.aguia-content');
                aguiaContent.insertBefore(errorDiv, aguiaContent.firstChild);
                
                setTimeout(() => {
                    errorDiv.remove();
                }, 5000);
                
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }
        
        // Atualizar a cada 30 segundos
        console.log('📊 Dashboard iniciado - Auto-refresh ativo');
        console.log('🦅 Aguia News integrado - Relatórios gratuitos');
    </script>
</body>
</html>
        `;
    }

    /**
     * 🚀 INICIAR MONITORAMENTO EM TEMPO REAL
     */
    iniciarMonitoramento() {
        // Atualizar cache a cada 5 segundos
        setInterval(async () => {
            try {
                this.cache.lastUpdate = new Date();
                // Aqui poderia implementar WebSocket para atualizações instantâneas
            } catch (error) {
                console.error('❌ Erro no monitoramento:', error);
            }
        }, 5000);
    }

    /**
     * 🎯 LOGS ADMINISTRATIVOS
     */
    async getLogsAdministrativos(req, res) {
        try {
            const { limit = 50, action } = req.query;
            
            let whereCondition = '';
            let params = [limit];
            
            if (action) {
                whereCondition = 'WHERE action = $2';
                params.push(action);
            }
            
            const logs = await this.pool.query(`
                SELECT 
                    al.*,
                    admin_user.email as admin_email,
                    target_user.email as target_email
                FROM admin_logs al
                LEFT JOIN users admin_user ON al.admin_id = admin_user.id
                LEFT JOIN users target_user ON al.target_user_id = target_user.id
                ${whereCondition}
                ORDER BY al.created_at DESC
                LIMIT $1
            `, params);

            res.json({
                success: true,
                data: logs.rows,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('❌ Erro ao buscar logs administrativos:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 📈 MÉTRICAS OPERACIONAIS
     */
    async getMetricasOperacionais(req, res) {
        try {
            // Métricas de performance do sistema
            const metricas = await this.pool.query(`
                SELECT 
                    DATE_TRUNC('hour', created_at) as hour,
                    COUNT(*) as signals_count,
                    COUNT(CASE WHEN sm.ai_decision->>'shouldExecute' = 'true' THEN 1 END) as approved_count,
                    AVG(EXTRACT(EPOCH FROM (sm.created_at - ts.created_at))) as avg_processing_time
                FROM trading_signals ts
                LEFT JOIN signal_metrics sm ON ts.id = sm.signal_id
                WHERE ts.created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY DATE_TRUNC('hour', created_at)
                ORDER BY hour DESC
            `);

            res.json({
                success: true,
                data: {
                    hourlyMetrics: metricas.rows,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar métricas:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 🔍 BUSCA E FILTROS
     */
    async buscarDados(req, res) {
        try {
            const { q, type, dateFrom, dateTo } = req.query;
            
            let results = {};
            
            if (type === 'signals' || !type) {
                results.signals = await this.buscarSinais(q, dateFrom, dateTo);
            }
            
            if (type === 'orders' || !type) {
                results.orders = await this.buscarOrdens(q, dateFrom, dateTo);
            }
            
            if (type === 'users' || !type) {
                results.users = await this.buscarUsuarios(q);
            }

            res.json({
                success: true,
                data: results,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('❌ Erro na busca:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async buscarSinais(query, dateFrom, dateTo) {
        // Implementar busca específica de sinais
        return [];
    }

    async buscarOrdens(query, dateFrom, dateTo) {
        // Implementar busca específica de ordens
        return [];
    }

    async buscarUsuarios(query) {
        // Implementar busca específica de usuários
        return [];
    }

    /**
     * 📡 STREAM DE DADOS EM TEMPO REAL
     */
    async streamDados(req, res) {
        // Configurar Server-Sent Events para atualizações em tempo real
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        const interval = setInterval(async () => {
            try {
                const data = await this.getDadosTempoReal();
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (error) {
                console.error('❌ Erro no stream:', error);
            }
        }, 5000);

        req.on('close', () => {
            clearInterval(interval);
        });
    }

    // ===============================
    // 🦅 MÉTODOS AGUIA NEWS INTEGRADOS
    // ===============================

    /**
     * 🦅 OBTER ÚLTIMO RADAR ÁGUIA NEWS
     */
    async getAguiaLatest(req, res) {
        try {
            const result = await this.pool.query(`
                SELECT id, content, generated_at, market_data, ai_analysis, is_premium, plan_required
                FROM aguia_news_radars
                ORDER BY generated_at DESC
                LIMIT 1
            `);

            if (result.rows.length === 0) {
                return res.json({ success: true, radar: null });
            }

            res.json({ success: true, radar: result.rows[0] });

        } catch (error) {
            console.error('❌ Erro ao buscar último radar:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 📊 OBTER ESTATÍSTICAS AGUIA NEWS
     */
    async getAguiaStats(req, res) {
        try {
            const stats = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_radars,
                    COUNT(CASE WHEN DATE(generated_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE THEN 1 END) as radars_today,
                    (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
                    (SELECT COUNT(*) FROM user_notifications WHERE notification_type = 'RADAR' AND created_at >= CURRENT_DATE) as notifications_today
                FROM aguia_news_radars
            `);

            res.json({
                success: true,
                stats: {
                    total_radars: parseInt(stats.rows[0].total_radars),
                    radars_today: parseInt(stats.rows[0].radars_today),
                    total_users: parseInt(stats.rows[0].total_users),
                    notifications_today: parseInt(stats.rows[0].notifications_today),
                    next_generation: '20:00 Brasília',
                    is_free: true,
                    plan_required: 'FREE'
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas Aguia:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 📋 OBTER LISTA DE RADARS
     */
    async getAguiaRadars(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;

            const radars = await this.pool.query(`
                SELECT id, content, generated_at, is_premium, plan_required,
                       LEFT(content, 200) || '...' as preview
                FROM aguia_news_radars
                ORDER BY generated_at DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);

            const total = await this.pool.query('SELECT COUNT(*) as count FROM aguia_news_radars');

            res.json({
                success: true,
                radars: radars.rows,
                pagination: {
                    total: parseInt(total.rows[0].count),
                    limit,
                    offset,
                    hasMore: (offset + limit) < parseInt(total.rows[0].count)
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar radars:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 🔧 GERAR RADAR MANUAL
     */
    async generateAguiaRadar(req, res) {
        try {
            // Importar e usar o sistema Aguia News
            const AguiaNewsGratuito = require('./aguia-news-gratuito');
            const aguiaNews = new AguiaNewsGratuito();
            
            console.log('🔧 Geração manual do Radar Águia News solicitada via dashboard');
            
            const radarId = await aguiaNews.generateDailyRadar();
            
            // Buscar o radar gerado
            const result = await this.pool.query(`
                SELECT id, content, generated_at, market_data, ai_analysis
                FROM aguia_news_radars
                WHERE id = $1
            `, [radarId]);

            await aguiaNews.close();

            res.json({
                success: true,
                message: 'Radar gerado com sucesso',
                radar: result.rows[0]
            });

        } catch (error) {
            console.error('❌ Erro ao gerar radar manual:', error);
            res.status(500).json({ 
                success: false,
                error: error.message 
            });
        }
    }

    /**
     * 🚀 INICIAR DASHBOARD
     */
    async iniciar(porta = 4000) {
        try {
            // Verificar conexão com banco
            await this.pool.query('SELECT NOW()');
            console.log('✅ Conexão com banco de dados estabelecida');

            this.app.listen(porta, () => {
                console.log(`\n📊 DASHBOARD COMPLETO INICIADO`);
                console.log(`==============================`);
                console.log(`🎯 Porta: ${porta}`);
                console.log(`🔗 URL: http://localhost:${porta}`);
                console.log(`📡 APIs disponíveis:`);
                console.log(`   • Dashboard: http://localhost:${porta}`);
                console.log(`   • Tempo Real: http://localhost:${porta}/api/dashboard/realtime`);
                console.log(`   • Sinais: http://localhost:${porta}/api/dashboard/signals`);
                console.log(`   • Ordens: http://localhost:${porta}/api/dashboard/orders`);
                console.log(`   • IA Decisões: http://localhost:${porta}/api/dashboard/ai-decisions`);
                console.log(`   • Performance: http://localhost:${porta}/api/dashboard/users`);
                console.log(`   • Status: http://localhost:${porta}/api/dashboard/system`);
                console.log(`\n✅ Dashboard pronto para monitoramento completo!`);
                console.log(`🔄 Auto-refresh ativo a cada 30 segundos`);
                console.log(`📊 Monitoramento de fluxo operacional ativo`);
            });

        } catch (error) {
            console.error('❌ Erro ao iniciar dashboard:', error);
            throw error;
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const dashboard = new DashboardCompleto();
    dashboard.iniciar(4000).catch(console.error);
}

module.exports = DashboardCompleto;
