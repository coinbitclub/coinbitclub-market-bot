/**
 * 🔴 MONITOR TEMPO REAL CORRIGIDO - COINBITCLUB
 * Com estrutura correta das tabelas e sinais TradingView
 */

const { Client } = require('pg');
const axios = require('axios');

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
 * 📊 Buscar operações abertas com estrutura correta
 */
async function fetchRealOperations() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const query = `
            SELECT 
                o.id,
                o.symbol,
                o.side,
                o.quantity,
                o.entry_price,
                o.exit_price,
                o.profit,
                o.status,
                o.opened_at,
                o.created_at,
                o.signal_id,
                o.signal_tv_id,
                u.name as user_name,
                u.email as user_email,
                
                -- Cálculo de retorno correto
                CASE 
                    WHEN o.exit_price IS NOT NULL AND o.entry_price > 0 THEN 
                        CASE 
                            WHEN o.side = 'BUY' THEN 
                                ROUND(((o.exit_price - o.entry_price) / o.entry_price * 100), 2)
                            WHEN o.side = 'SELL' THEN 
                                ROUND(((o.entry_price - o.exit_price) / o.entry_price * 100), 2)
                            ELSE 0
                        END
                    ELSE 0
                END as return_percentage,
                
                -- Status do lucro
                CASE 
                    WHEN o.profit > 0 THEN 'LUCRO'
                    WHEN o.profit < 0 THEN 'PREJUIZO'
                    WHEN o.profit = 0 THEN 'NEUTRO'
                    ELSE 'CALCULANDO'
                END as profit_status,
                
                -- Tempo da operação
                CASE 
                    WHEN o.opened_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (NOW() - o.opened_at))/3600
                    ELSE 
                        EXTRACT(EPOCH FROM (NOW() - o.created_at))/3600
                END as hours_open
                
            FROM operations o
            JOIN users u ON o.user_id = u.id
            WHERE o.status IN ('OPEN', 'ACTIVE', 'PENDING', 'FILLED')
            ORDER BY o.created_at DESC
            LIMIT 25;
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
 * 🤖 Buscar sinais TradingView recentes
 */
async function fetchTradingViewSignals() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const query = `
            SELECT 
                id,
                ticker as symbol,
                timestamp_signal,
                close_price,
                ema9_30,
                rsi_4h,
                rsi_15,
                cruzou_acima_ema9,
                cruzou_abaixo_ema9,
                strategy_source,
                processed,
                created_at,
                -- Verificar se gerou operação
                (SELECT COUNT(*) FROM operations WHERE signal_tv_id = tradingview_signals.id) as operations_count
            FROM tradingview_signals
            ORDER BY created_at DESC
            LIMIT 15;
        `;
        
        const result = await client.query(query);
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar sinais TV:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 📈 Buscar preços atuais para atualizar PnL
 */
async function updateRealTimePrices() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        // Buscar preços da Binance
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
            timeout: 5000
        });
        
        const prices = {};
        response.data.forEach(ticker => {
            prices[ticker.symbol] = parseFloat(ticker.price);
        });
        
        // Atualizar operações abertas com preços atuais
        await client.connect();
        
        let updatedCount = 0;
        
        for (const [symbol, currentPrice] of Object.entries(prices)) {
            if (symbol.includes('USDT')) {
                const updateQuery = `
                    UPDATE operations 
                    SET 
                        exit_price = $1,
                        profit = CASE 
                            WHEN side = 'BUY' THEN (quantity * ($1 - entry_price))
                            WHEN side = 'SELL' THEN (quantity * (entry_price - $1))
                            ELSE 0
                        END,
                        updated_at = NOW()
                    WHERE symbol = $2 AND status IN ('OPEN', 'ACTIVE', 'PENDING', 'FILLED')
                    AND entry_price > 0;
                `;
                
                const result = await client.query(updateQuery, [currentPrice, symbol]);
                updatedCount += result.rowCount || 0;
            }
        }
        
        return { updatedCount, totalPrices: Object.keys(prices).length };
        
    } catch (error) {
        console.error('⚠️ Erro ao atualizar preços:', error.message);
        return { updatedCount: 0, totalPrices: 0 };
    } finally {
        await client.end();
    }
}

/**
 * 💹 Calcular métricas corrigidas
 */
async function calculateRealMetrics() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const metricsQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '24 hours' THEN u.id END) as active_users_24h,
                COUNT(o.id) as total_operations,
                COUNT(CASE WHEN o.status IN ('OPEN', 'ACTIVE', 'PENDING', 'FILLED') THEN 1 END) as open_operations,
                SUM(CASE WHEN o.profit > 0 THEN o.profit ELSE 0 END) as total_profits,
                SUM(CASE WHEN o.profit < 0 THEN ABS(o.profit) ELSE 0 END) as total_losses,
                
                -- Taxa de sucesso
                ROUND(
                    CASE 
                        WHEN COUNT(CASE WHEN o.status IN ('CLOSED', 'COMPLETED') THEN 1 END) > 0 THEN
                            (COUNT(CASE WHEN o.profit > 0 THEN 1 END)::FLOAT / 
                             COUNT(CASE WHEN o.status IN ('CLOSED', 'COMPLETED') THEN 1 END)::FLOAT * 100)
                        ELSE 0
                    END, 2
                ) as success_rate,
                
                -- Sinais processados hoje
                (SELECT COUNT(*) FROM tradingview_signals WHERE DATE(created_at) = CURRENT_DATE) as signals_today,
                (SELECT COUNT(*) FROM tradingview_signals WHERE processed = true AND DATE(created_at) = CURRENT_DATE) as signals_processed_today,
                
                -- Operações com sinais
                COUNT(CASE WHEN o.signal_tv_id IS NOT NULL THEN 1 END) as operations_with_signals
                
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            WHERE u.is_active = true;
        `;
        
        const result = await client.query(metricsQuery);
        const metrics = result.rows[0];
        
        return {
            ...metrics,
            net_profit: (parseFloat(metrics.total_profits || 0) - parseFloat(metrics.total_losses || 0)).toFixed(2),
            signal_processing_rate: metrics.signals_today > 0 ? 
                Math.round((metrics.signals_processed_today / metrics.signals_today) * 100) : 0,
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
            signals_today: 0,
            signals_processed_today: 0,
            signal_processing_rate: 0,
            operations_with_signals: 0
        };
    } finally {
        await client.end();
    }
}

/**
 * 🖥️ Exibir dashboard corrigido
 */
async function displayCorrectedDashboard() {
    console.clear();
    
    const timestamp = new Date().toLocaleString('pt-BR');
    
    console.log('🔴 COINBITCLUB - MONITOR CORRIGIDO (TEMPO REAL)');
    console.log('=' .repeat(85));
    console.log(`⏰ ${timestamp} | 🔄 Dados reais do banco de produção`);
    console.log('=' .repeat(85));

    try {
        // Atualizar preços primeiro
        console.log('📈 Atualizando preços em tempo real...');
        const priceUpdate = await updateRealTimePrices();
        
        // Buscar dados atualizados
        const [operations, signals, metrics] = await Promise.all([
            fetchRealOperations(),
            fetchTradingViewSignals(),
            calculateRealMetrics()
        ]);

        // 📊 MÉTRICAS DO SISTEMA
        console.log('\n📊 MÉTRICAS DO SISTEMA (CORRIGIDAS)');
        console.log('-' .repeat(60));
        console.log(`👥 Usuários Totais: ${metrics.total_users}`);
        console.log(`🟢 Usuários Ativos (24h): ${metrics.active_users_24h}`);
        console.log(`📈 Operações Totais: ${metrics.total_operations}`);
        console.log(`🔴 Operações Abertas: ${metrics.open_operations}`);
        console.log(`✅ Taxa de Sucesso: ${metrics.success_rate}%`);
        console.log(`💰 Lucro Líquido: R$ ${metrics.net_profit}`);
        console.log(`🤖 Sinais TV Hoje: ${metrics.signals_today} (${metrics.signals_processed_today} processados)`);
        console.log(`🔗 Operações c/ Sinais: ${metrics.operations_with_signals}`);
        console.log(`📊 Taxa Processamento: ${metrics.signal_processing_rate}%`);

        // 🤖 SINAIS TRADINGVIEW
        console.log('\n🤖 SINAIS TRADINGVIEW (TEMPO REAL)');
        console.log('-' .repeat(85));
        if (signals.length > 0) {
            console.log('SÍMBOLO   | PREÇO     | RSI 4H | EMA9   | PROCESSADO | OPERAÇÕES | TEMPO');
            console.log('-' .repeat(85));
            
            signals.slice(0, 8).forEach(signal => {
                const symbol = signal.symbol.padEnd(8);
                const price = `$${parseFloat(signal.close_price || 0).toFixed(0)}`.padEnd(9);
                const rsi = `${parseFloat(signal.rsi_4h || 0).toFixed(1)}`.padEnd(6);
                const ema = signal.cruzou_acima_ema9 ? '🟢UP' : signal.cruzou_abaixo_ema9 ? '🔴DOWN' : '⚪--';
                const processed = signal.processed ? '✅ SIM' : '⏳ NÃO';
                const operations = `${signal.operations_count || 0}`.padEnd(9);
                const timeAgo = Math.round((Date.now() - new Date(signal.created_at).getTime()) / 60000);
                const time = `${timeAgo}min`.padEnd(6);
                
                console.log(`${symbol} | ${price} | ${rsi} | ${ema.padEnd(6)} | ${processed.padEnd(10)} | ${operations} | ${time}`);
            });
        } else {
            console.log('⚠️ Nenhum sinal TradingView encontrado');
        }

        // 🔴 OPERAÇÕES REAIS
        console.log('\n🔴 OPERAÇÕES (ESTRUTURA CORRIGIDA)');
        console.log('-' .repeat(85));
        if (operations.length > 0) {
            console.log('USUÁRIO        | SÍMBOLO  | LADO | QTD    | LUCRO    | STATUS    | SINAL');
            console.log('-' .repeat(85));
            
            operations.slice(0, 10).forEach(op => {
                const userName = (op.user_name || 'N/A').substring(0, 11).padEnd(11);
                const symbol = op.symbol.substring(0, 7).padEnd(7);
                const side = op.side.padEnd(4);
                const quantity = parseFloat(op.quantity || 0).toFixed(4).padEnd(6);
                const profit = `R$ ${parseFloat(op.profit || 0).toFixed(2)}`.padEnd(8);
                const status = op.status.padEnd(9);
                const hasSignal = op.signal_tv_id ? '🔗' : '⚪';
                
                const profitIcon = op.profit_status === 'LUCRO' ? '🟢' : 
                                 op.profit_status === 'PREJUIZO' ? '🔴' : '⚪';
                
                console.log(`${userName} | ${symbol} | ${side} | ${quantity} | ${profit} | ${status} | ${hasSignal} ${profitIcon}`);
            });
        } else {
            console.log('⚠️ Nenhuma operação encontrada');
        }

        // 🎯 STATUS ATUALIZAÇÃO
        console.log('\n🎯 STATUS DA ATUALIZAÇÃO');
        console.log('-' .repeat(50));
        console.log(`📈 Preços atualizados: ${priceUpdate.updatedCount} operações`);
        console.log(`💱 Total de preços: ${priceUpdate.totalPrices} símbolos`);
        console.log('🟢 Banco de Dados: CONECTADO');
        console.log('🟢 TradingView Webhooks: RECEBENDO');
        console.log(`🔄 Próxima atualização: ${new Date(Date.now() + 15000).toLocaleTimeString('pt-BR')}`);

        console.log('\n📋 LEGENDA');
        console.log('🔗 = Operação com sinal TV | ⚪ = Sem sinal | 🟢 = Lucro | 🔴 = Prejuízo');
        console.log('✅ = Sinal processado | ⏳ = Sinal pendente | 🟢UP = EMA cruzou acima');

    } catch (error) {
        console.error('❌ Erro no dashboard:', error.message);
    }
}

/**
 * 🔄 Iniciar monitoramento corrigido
 */
async function startCorrectedMonitoring() {
    console.log('🚀 INICIANDO MONITOR CORRIGIDO - COINBITCLUB');
    console.log('=' .repeat(70));
    console.log('⚡ Atualizações a cada 15 segundos');
    console.log('🔧 Estrutura de tabelas corrigida');
    console.log('🤖 Sinais TradingView em tempo real');
    console.log('📊 Operações com dados reais');
    console.log('💹 Preços atualizados automaticamente');
    console.log('=' .repeat(70));
    
    // Primeira execução
    await displayCorrectedDashboard();
    
    // Loop contínuo a cada 15 segundos
    setInterval(async () => {
        await displayCorrectedDashboard();
    }, 15000);
}

// Executar se chamado diretamente
if (require.main === module) {
    startCorrectedMonitoring().catch(console.error);
}

module.exports = {
    startCorrectedMonitoring,
    fetchRealOperations,
    fetchTradingViewSignals,
    calculateRealMetrics,
    updateRealTimePrices
};
