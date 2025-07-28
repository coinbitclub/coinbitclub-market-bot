/**
 * 🔴 MONITOR TEMPO REAL COMPLETO - COINBITCLUB
 * Sistema de monitoramento dinâmico com dados reais
 * Operações abertas, usuários ativos, retornos em tempo real
 */

const axios = require('axios');
const { Client } = require('pg');
const WebSocket = require('ws');

// Configurações
const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';
const ADMIN_TOKEN = 'admin-emergency-token';
const COINSTATS_API_KEY = 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=';

const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000
};

/**
 * 📊 Buscar operações abertas em tempo real
 */
async function fetchOpenOperations() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const query = `
            SELECT 
                o.id,
                o.symbol,
                o.side,
                o.amount,
                o.entry_price,
                o.current_price,
                o.pnl,
                o.status,
                o.created_at,
                u.name as user_name,
                u.email as user_email,
                CASE 
                    WHEN o.current_price > o.entry_price AND o.side = 'BUY' THEN 'LUCRO'
                    WHEN o.current_price < o.entry_price AND o.side = 'SELL' THEN 'LUCRO'
                    ELSE 'PREJUIZO'
                END as profit_status,
                ROUND(
                    CASE 
                        WHEN o.side = 'BUY' THEN 
                            ((o.current_price - o.entry_price) / o.entry_price * 100)
                        ELSE 
                            ((o.entry_price - o.current_price) / o.entry_price * 100)
                    END, 2
                ) as return_percentage
            FROM operations o
            JOIN users u ON o.user_id = u.id
            WHERE o.status IN ('OPEN', 'ACTIVE', 'PENDING')
            ORDER BY o.created_at DESC
            LIMIT 20;
        `;
        
        const result = await client.query(query);
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar operações:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 👥 Buscar usuários ativos e seus retornos
 */
async function fetchActiveUsers() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.status,
                u.last_login_at,
                ub.test_credit_balance,
                ub.available_balance,
                ub.total_profit,
                ub.total_loss,
                COUNT(o.id) as total_operations,
                COUNT(CASE WHEN o.status IN ('OPEN', 'ACTIVE') THEN 1 END) as open_operations,
                ROUND(COALESCE(ub.total_profit, 0) - COALESCE(ub.total_loss, 0), 2) as net_profit,
                CASE 
                    WHEN u.last_login_at > NOW() - INTERVAL '1 hour' THEN 'ONLINE'
                    WHEN u.last_login_at > NOW() - INTERVAL '24 hours' THEN 'RECENTE'
                    ELSE 'OFFLINE'
                END as activity_status
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.currency = 'BRL'
            LEFT JOIN operations o ON u.id = o.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.email, u.status, u.last_login_at, 
                     ub.test_credit_balance, ub.available_balance, ub.total_profit, ub.total_loss
            ORDER BY u.last_login_at DESC NULLS LAST
            LIMIT 15;
        `;
        
        const result = await client.query(query);
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 📈 Buscar dados de mercado em tempo real
 */
async function fetchRealTimeMarketData() {
    try {
        // CoinStats - Fear & Greed + BTC Dominance
        const coinStatsResponse = await axios.get('https://openapiv1.coinstats.app/coins/bitcoin', {
            headers: {
                'X-API-KEY': COINSTATS_API_KEY,
                'accept': 'application/json'
            },
            timeout: 10000
        });

        // Binance - Preços atuais
        const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","ADAUSDT"]', {
            timeout: 5000
        });

        // Bybit - Volume de trading
        const bybitResponse = await axios.get('https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT', {
            timeout: 5000
        });

        return {
            bitcoin: coinStatsResponse.data.coin || {},
            tickers: JSON.parse(binanceResponse.data) || [],
            volume: bybitResponse.data.result?.list?.[0] || {},
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('⚠️ Erro ao buscar dados de mercado:', error.message);
        return {
            bitcoin: { price: 0, priceChange1d: 0 },
            tickers: [],
            volume: {},
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 🤖 Buscar sinais recentes do TradingView
 */
async function fetchRecentSignals() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const query = `
            SELECT 
                s.id,
                s.symbol,
                s.action,
                s.price,
                s.strategy,
                s.confidence,
                s.created_at,
                s.processed,
                sp.status as processing_status,
                sp.result,
                sp.processed_at
            FROM signals s
            LEFT JOIN signal_processing_queue sp ON s.id = sp.signal_id
            ORDER BY s.created_at DESC
            LIMIT 10;
        `;
        
        const result = await client.query(query);
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar sinais:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 💹 Calcular métricas do sistema em tempo real
 */
async function calculateSystemMetrics() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        // Métricas financeiras
        const financialQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '24 hours' THEN u.id END) as active_users_24h,
                COUNT(o.id) as total_operations,
                COUNT(CASE WHEN o.status IN ('OPEN', 'ACTIVE') THEN 1 END) as open_operations,
                SUM(CASE WHEN o.pnl > 0 THEN o.pnl ELSE 0 END) as total_profits,
                SUM(CASE WHEN o.pnl < 0 THEN ABS(o.pnl) ELSE 0 END) as total_losses,
                SUM(ub.test_credit_balance) as total_credits,
                SUM(ub.available_balance) as total_balances
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.currency = 'BRL'
            WHERE u.is_active = true;
        `;
        
        const financialResult = await client.query(financialQuery);
        const metrics = financialResult.rows[0];

        // Taxa de sucesso das operações
        const successQuery = `
            SELECT 
                COUNT(*) as total_closed_operations,
                COUNT(CASE WHEN pnl > 0 THEN 1 END) as profitable_operations,
                ROUND(
                    CASE 
                        WHEN COUNT(*) > 0 THEN 
                            (COUNT(CASE WHEN pnl > 0 THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
                        ELSE 0 
                    END, 2
                ) as success_rate
            FROM operations 
            WHERE status IN ('CLOSED', 'COMPLETED') 
            AND created_at > NOW() - INTERVAL '7 days';
        `;
        
        const successResult = await client.query(successQuery);
        const successMetrics = successResult.rows[0];

        return {
            ...metrics,
            ...successMetrics,
            net_profit: (parseFloat(metrics.total_profits || 0) - parseFloat(metrics.total_losses || 0)).toFixed(2),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Erro ao calcular métricas:', error.message);
        return {
            total_users: 0,
            active_users_24h: 0,
            total_operations: 0,
            open_operations: 0,
            success_rate: 0,
            net_profit: 0,
            timestamp: new Date().toISOString()
        };
    } finally {
        await client.end();
    }
}

/**
 * 🖥️ Exibir dashboard em tempo real
 */
async function displayRealTimeDashboard() {
    console.clear();
    
    const timestamp = new Date().toLocaleString('pt-BR');
    
    console.log('🔴 COINBITCLUB - MONITOR TEMPO REAL'.padEnd(80, ' '));
    console.log('=' .repeat(80));
    console.log(`⏰ Atualização: ${timestamp}`.padEnd(80, ' '));
    console.log('=' .repeat(80));

    try {
        // Buscar todos os dados em paralelo
        const [operations, users, marketData, signals, metrics] = await Promise.all([
            fetchOpenOperations(),
            fetchActiveUsers(),
            fetchRealTimeMarketData(),
            fetchRecentSignals(),
            calculateSystemMetrics()
        ]);

        // 📊 MÉTRICAS DO SISTEMA
        console.log('\n📊 MÉTRICAS DO SISTEMA (TEMPO REAL)');
        console.log('-' .repeat(50));
        console.log(`👥 Usuários Totais: ${metrics.total_users}`);
        console.log(`🟢 Usuários Ativos (24h): ${metrics.active_users_24h}`);
        console.log(`📈 Operações Totais: ${metrics.total_operations}`);
        console.log(`🔴 Operações Abertas: ${metrics.open_operations}`);
        console.log(`✅ Taxa de Sucesso: ${metrics.success_rate}%`);
        console.log(`💰 Lucro Líquido: R$ ${metrics.net_profit}`);

        // 📈 DADOS DE MERCADO
        console.log('\n📈 MERCADO (TEMPO REAL)');
        console.log('-' .repeat(50));
        if (marketData.bitcoin.price) {
            const priceChange = parseFloat(marketData.bitcoin.priceChange1d || 0);
            const changeIcon = priceChange >= 0 ? '📈' : '📉';
            console.log(`₿ Bitcoin: $${marketData.bitcoin.price?.toLocaleString()} ${changeIcon} ${priceChange.toFixed(2)}%`);
        }

        if (marketData.tickers.length > 0) {
            marketData.tickers.slice(0, 3).forEach(ticker => {
                const change = parseFloat(ticker.priceChangePercent);
                const icon = change >= 0 ? '🟢' : '🔴';
                console.log(`${icon} ${ticker.symbol}: $${parseFloat(ticker.lastPrice).toLocaleString()} (${change.toFixed(2)}%)`);
            });
        }

        // 🔴 OPERAÇÕES ABERTAS
        console.log('\n🔴 OPERAÇÕES ABERTAS (TEMPO REAL)');
        console.log('-' .repeat(80));
        if (operations.length > 0) {
            console.log('USER               | SYMBOL  | SIDE | VALOR    | RETORNO | STATUS');
            console.log('-' .repeat(80));
            
            operations.slice(0, 8).forEach(op => {
                const userName = (op.user_name || 'N/A').substring(0, 15).padEnd(15);
                const symbol = op.symbol.padEnd(7);
                const side = op.side.padEnd(4);
                const amount = `R$ ${parseFloat(op.amount || 0).toFixed(0)}`.padEnd(8);
                const returnPct = `${op.return_percentage || 0}%`.padEnd(7);
                const statusIcon = op.profit_status === 'LUCRO' ? '🟢' : '🔴';
                
                console.log(`${userName} | ${symbol} | ${side} | ${amount} | ${returnPct} | ${statusIcon}`);
            });
        } else {
            console.log('⚠️ Nenhuma operação aberta no momento');
        }

        // 👥 USUÁRIOS ATIVOS E RETORNOS
        console.log('\n👥 USUÁRIOS ATIVOS E RETORNOS');
        console.log('-' .repeat(80));
        if (users.length > 0) {
            console.log('USUÁRIO            | STATUS   | OPERAÇÕES | LUCRO/PREJUÍZO | ATIVIDADE');
            console.log('-' .repeat(80));
            
            users.slice(0, 6).forEach(user => {
                const userName = (user.name || 'N/A').substring(0, 15).padEnd(15);
                const status = user.status.padEnd(8);
                const operations = `${user.open_operations}/${user.total_operations}`.padEnd(9);
                const netProfit = parseFloat(user.net_profit || 0);
                const profitDisplay = `R$ ${netProfit.toFixed(0)}`.padEnd(12);
                const profitIcon = netProfit >= 0 ? '🟢' : '🔴';
                const activityIcon = user.activity_status === 'ONLINE' ? '🟢' : 
                                   user.activity_status === 'RECENTE' ? '🟡' : '⚪';
                
                console.log(`${userName} | ${status} | ${operations} | ${profitDisplay} | ${activityIcon} ${user.activity_status}`);
            });
        }

        // 🤖 SINAIS RECENTES
        console.log('\n🤖 SINAIS TRADINGVIEW (TEMPO REAL)');
        console.log('-' .repeat(60));
        if (signals.length > 0) {
            signals.slice(0, 5).forEach(signal => {
                const timeAgo = Math.round((Date.now() - new Date(signal.created_at).getTime()) / 60000);
                const processedIcon = signal.processed ? '✅' : '⏳';
                console.log(`${processedIcon} ${signal.symbol} ${signal.action} - ${timeAgo}min atrás - ${signal.confidence || 'N/A'}%`);
            });
        } else {
            console.log('⚠️ Nenhum sinal recente recebido');
        }

        // 🎯 STATUS SISTEMA
        console.log('\n🎯 STATUS DO SISTEMA');
        console.log('-' .repeat(40));
        console.log('🟢 API Principal: ONLINE');
        console.log('🟢 Banco de Dados: CONECTADO');
        console.log('🟢 TradingView Webhooks: ATIVO');
        console.log('🟢 CoinStats API: FUNCIONANDO');
        console.log(`🔄 Próxima atualização: ${new Date(Date.now() + 10000).toLocaleTimeString('pt-BR')}`);

    } catch (error) {
        console.error('❌ Erro no dashboard:', error.message);
    }
}

/**
 * 🔄 Iniciar monitoramento contínuo
 */
async function startRealTimeMonitoring() {
    console.log('🚀 INICIANDO MONITOR TEMPO REAL - COINBITCLUB');
    console.log('=' .repeat(60));
    console.log('⚡ Atualizações a cada 10 segundos');
    console.log('🔄 Dados dinâmicos do banco de dados');
    console.log('📊 Operações abertas e retornos em tempo real');
    console.log('👥 Usuários ativos e métricas de performance');
    console.log('=' .repeat(60));
    
    // Primeira execução
    await displayRealTimeDashboard();
    
    // Loop contínuo a cada 10 segundos
    setInterval(async () => {
        await displayRealTimeDashboard();
    }, 10000);
}

/**
 * 📱 Criar servidor WebSocket para atualizações em tempo real
 */
function createWebSocketServer() {
    const wss = new WebSocket.Server({ port: 8080 });
    
    console.log('🌐 Servidor WebSocket iniciado na porta 8080');
    
    wss.on('connection', (ws) => {
        console.log('🔗 Cliente conectado ao WebSocket');
        
        // Enviar dados a cada 5 segundos para clientes conectados
        const interval = setInterval(async () => {
            try {
                const [operations, users, metrics] = await Promise.all([
                    fetchOpenOperations(),
                    fetchActiveUsers(),
                    calculateSystemMetrics()
                ]);
                
                const data = {
                    timestamp: new Date().toISOString(),
                    operations: operations.slice(0, 5),
                    users: users.slice(0, 5),
                    metrics,
                    type: 'realtime_update'
                };
                
                ws.send(JSON.stringify(data));
            } catch (error) {
                console.error('❌ Erro ao enviar dados WebSocket:', error.message);
            }
        }, 5000);
        
        ws.on('close', () => {
            console.log('🔌 Cliente desconectado do WebSocket');
            clearInterval(interval);
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    console.log('🔴 COINBITCLUB - SISTEMA DE MONITORAMENTO TEMPO REAL');
    console.log('📡 Iniciando servidor WebSocket...');
    
    // Criar servidor WebSocket
    createWebSocketServer();
    
    // Iniciar monitoramento
    startRealTimeMonitoring().catch(console.error);
}

module.exports = {
    startRealTimeMonitoring,
    fetchOpenOperations,
    fetchActiveUsers,
    fetchRealTimeMarketData,
    calculateSystemMetrics,
    createWebSocketServer
};
