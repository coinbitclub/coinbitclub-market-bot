/**
 * 💹 MONITOR OPERAÇÕES E RETORNOS - TEMPO REAL
 * Foco específico em operações abertas e performance dos usuários
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
 * 📊 Buscar operações detalhadas com retornos em tempo real
 */
async function fetchDetailedOperations() {
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
                u.email,
                ub.test_credit_balance,
                ub.available_balance,
                
                -- Cálculo de retorno em %
                CASE 
                    WHEN o.side = 'BUY' AND o.current_price IS NOT NULL THEN 
                        ROUND(((o.current_price - o.entry_price) / o.entry_price * 100), 2)
                    WHEN o.side = 'SELL' AND o.current_price IS NOT NULL THEN 
                        ROUND(((o.entry_price - o.current_price) / o.entry_price * 100), 2)
                    ELSE 0
                END as return_percentage,
                
                -- Status do lucro
                CASE 
                    WHEN o.pnl > 0 THEN 'LUCRO'
                    WHEN o.pnl < 0 THEN 'PREJUIZO'
                    WHEN o.pnl = 0 THEN 'NEUTRO'
                    ELSE 'CALCULANDO'
                END as profit_status,
                
                -- Valor atual da posição
                CASE 
                    WHEN o.current_price IS NOT NULL THEN 
                        ROUND((o.amount * o.current_price), 2)
                    ELSE 
                        ROUND((o.amount * o.entry_price), 2)
                END as current_position_value,
                
                -- Tempo da operação
                EXTRACT(EPOCH FROM (NOW() - o.created_at))/3600 as hours_open,
                
                -- Histórico de operações do usuário
                (SELECT COUNT(*) FROM operations o2 WHERE o2.user_id = u.id) as user_total_operations,
                (SELECT COUNT(*) FROM operations o3 WHERE o3.user_id = u.id AND o3.pnl > 0) as user_winning_operations
                
            FROM operations o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.currency = 'BRL'
            WHERE o.status IN ('OPEN', 'ACTIVE', 'PENDING')
            ORDER BY o.created_at DESC;
        `;
        
        const result = await client.query(query);
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar operações detalhadas:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 🏆 Ranking de usuários por performance
 */
async function fetchUserPerformanceRanking() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        const query = `
            SELECT 
                u.name,
                u.email,
                COUNT(o.id) as total_operations,
                COUNT(CASE WHEN o.status IN ('OPEN', 'ACTIVE') THEN 1 END) as open_operations,
                COUNT(CASE WHEN o.pnl > 0 THEN 1 END) as winning_operations,
                COUNT(CASE WHEN o.pnl < 0 THEN 1 END) as losing_operations,
                ROUND(SUM(CASE WHEN o.pnl > 0 THEN o.pnl ELSE 0 END), 2) as total_profits,
                ROUND(SUM(CASE WHEN o.pnl < 0 THEN ABS(o.pnl) ELSE 0 END), 2) as total_losses,
                ROUND(SUM(o.pnl), 2) as net_profit,
                
                -- Taxa de acerto
                CASE 
                    WHEN COUNT(CASE WHEN o.status IN ('CLOSED', 'COMPLETED') THEN 1 END) > 0 THEN
                        ROUND(
                            (COUNT(CASE WHEN o.pnl > 0 THEN 1 END)::FLOAT / 
                             COUNT(CASE WHEN o.status IN ('CLOSED', 'COMPLETED') THEN 1 END)::FLOAT * 100), 
                            2
                        )
                    ELSE 0
                END as win_rate,
                
                -- Valor investido total
                ROUND(SUM(o.amount * o.entry_price), 2) as total_invested,
                
                -- ROI
                CASE 
                    WHEN SUM(o.amount * o.entry_price) > 0 THEN
                        ROUND((SUM(o.pnl) / SUM(o.amount * o.entry_price) * 100), 2)
                    ELSE 0
                END as roi_percentage,
                
                -- Saldos atuais
                ub.test_credit_balance,
                ub.available_balance,
                
                -- Última atividade
                MAX(o.created_at) as last_operation,
                u.last_login_at
                
            FROM users u
            LEFT JOIN operations o ON u.id = o.user_id
            LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.currency = 'BRL'
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.email, ub.test_credit_balance, ub.available_balance, u.last_login_at
            HAVING COUNT(o.id) > 0
            ORDER BY net_profit DESC, win_rate DESC
            LIMIT 20;
        `;
        
        const result = await client.query(query);
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar ranking:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 📈 Buscar preços atuais das criptos em operação
 */
async function fetchCurrentPrices() {
    try {
        // Buscar símbolos únicos das operações abertas
        const client = new Client(DATABASE_CONFIG);
        await client.connect();
        
        const symbolsQuery = `
            SELECT DISTINCT symbol 
            FROM operations 
            WHERE status IN ('OPEN', 'ACTIVE', 'PENDING')
        `;
        
        const symbolsResult = await client.query(symbolsQuery);
        await client.end();
        
        const symbols = symbolsResult.rows.map(row => row.symbol);
        
        if (symbols.length === 0) return {};
        
        // Buscar preços na Binance
        const binanceSymbols = symbols
            .map(s => s.replace('/', ''))
            .filter(s => s.includes('USDT'))
            .slice(0, 10); // Limitar a 10 símbolos
        
        if (binanceSymbols.length === 0) return {};
        
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price`, {
            timeout: 5000
        });
        
        const prices = {};
        response.data.forEach(ticker => {
            if (binanceSymbols.includes(ticker.symbol)) {
                prices[ticker.symbol] = parseFloat(ticker.price);
            }
        });
        
        return prices;
        
    } catch (error) {
        console.error('⚠️ Erro ao buscar preços:', error.message);
        return {};
    }
}

/**
 * 💰 Atualizar PnL das operações abertas
 */
async function updateOperationsPnL() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        const prices = await fetchCurrentPrices();
        if (Object.keys(prices).length === 0) return 0;
        
        await client.connect();
        
        let updatedCount = 0;
        
        for (const [symbol, currentPrice] of Object.entries(prices)) {
            const symbolFormatted = symbol.replace('USDT', '/USDT');
            
            const updateQuery = `
                UPDATE operations 
                SET 
                    current_price = $1,
                    pnl = CASE 
                        WHEN side = 'BUY' THEN (amount * ($1 - entry_price))
                        WHEN side = 'SELL' THEN (amount * (entry_price - $1))
                        ELSE 0
                    END,
                    updated_at = NOW()
                WHERE symbol = $2 AND status IN ('OPEN', 'ACTIVE', 'PENDING')
                RETURNING id;
            `;
            
            const result = await client.query(updateQuery, [currentPrice, symbolFormatted]);
            updatedCount += result.rowCount;
        }
        
        return updatedCount;
        
    } catch (error) {
        console.error('❌ Erro ao atualizar PnL:', error.message);
        return 0;
    } finally {
        await client.end();
    }
}

/**
 * 🖥️ Exibir monitor de operações e retornos
 */
async function displayOperationsMonitor() {
    console.clear();
    
    const timestamp = new Date().toLocaleString('pt-BR');
    
    console.log('💹 COINBITCLUB - OPERAÇÕES E RETORNOS (TEMPO REAL)');
    console.log('=' .repeat(85));
    console.log(`⏰ ${timestamp} | 🔄 Atualização automática a cada 15 segundos`);
    console.log('=' .repeat(85));

    try {
        // Atualizar PnL das operações
        console.log('🔄 Atualizando preços e PnL...');
        const updatedOps = await updateOperationsPnL();
        
        // Buscar dados atualizados
        const [operations, ranking] = await Promise.all([
            fetchDetailedOperations(),
            fetchUserPerformanceRanking()
        ]);

        // 🔴 OPERAÇÕES ABERTAS DETALHADAS
        console.log(`\n🔴 OPERAÇÕES ABERTAS (${operations.length} total) - PnL Atualizado: ${updatedOps} ops`);
        console.log('-' .repeat(85));
        
        if (operations.length > 0) {
            console.log('USUÁRIO          | SÍMBOLO   | LADO | VALOR    | RETORNO  | PnL      | TEMPO   ');
            console.log('-' .repeat(85));
            
            operations.slice(0, 12).forEach(op => {
                const userName = (op.user_name || 'N/A').substring(0, 13).padEnd(13);
                const symbol = op.symbol.substring(0, 8).padEnd(8);
                const side = op.side.padEnd(4);
                const amount = `R$ ${parseFloat(op.amount || 0).toFixed(0)}`.padEnd(8);
                const returnPct = `${op.return_percentage || 0}%`.padEnd(8);
                const pnl = `R$ ${parseFloat(op.pnl || 0).toFixed(0)}`.padEnd(8);
                const hours = `${Math.floor(op.hours_open || 0)}h`.padEnd(6);
                
                const statusIcon = op.profit_status === 'LUCRO' ? '🟢' : 
                                 op.profit_status === 'PREJUIZO' ? '🔴' : '⚪';
                
                console.log(`${userName} | ${symbol} | ${side} | ${amount} | ${returnPct} | ${pnl} | ${hours} ${statusIcon}`);
            });
        } else {
            console.log('⚠️ Nenhuma operação aberta no momento');
        }

        // 🏆 RANKING DE PERFORMANCE
        console.log('\n🏆 RANKING DE USUÁRIOS POR PERFORMANCE');
        console.log('-' .repeat(85));
        
        if (ranking.length > 0) {
            console.log('POS | USUÁRIO          | OPS  | TAXA | LUCRO LÍQUIDO | ROI   | SALDO     ');
            console.log('-' .repeat(85));
            
            ranking.slice(0, 10).forEach((user, index) => {
                const pos = `${index + 1}`.padEnd(3);
                const userName = (user.name || 'N/A').substring(0, 13).padEnd(13);
                const operations = `${user.open_operations}/${user.total_operations}`.padEnd(4);
                const winRate = `${user.win_rate || 0}%`.padEnd(4);
                const netProfit = parseFloat(user.net_profit || 0);
                const profit = `R$ ${netProfit.toFixed(0)}`.padEnd(11);
                const roi = `${user.roi_percentage || 0}%`.padEnd(5);
                const balance = `R$ ${parseFloat(user.test_credit_balance || 0).toFixed(0)}`.padEnd(8);
                
                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                const profitIcon = netProfit >= 0 ? '🟢' : '🔴';
                
                console.log(`${pos} | ${userName} | ${operations} | ${winRate} | ${profit} | ${roi} | ${balance} ${rankIcon}${profitIcon}`);
            });
        }

        // 📊 RESUMO GERAL
        const totalUsers = ranking.length;
        const totalOpenOps = operations.length;
        const totalProfit = ranking.reduce((sum, user) => sum + parseFloat(user.net_profit || 0), 0);
        const avgWinRate = ranking.length > 0 ? 
            (ranking.reduce((sum, user) => sum + parseFloat(user.win_rate || 0), 0) / ranking.length).toFixed(1) : 0;

        console.log('\n📊 RESUMO GERAL DO SISTEMA');
        console.log('-' .repeat(50));
        console.log(`👥 Usuários Ativos: ${totalUsers}`);
        console.log(`🔴 Operações Abertas: ${totalOpenOps}`);
        console.log(`💰 Lucro Líquido Total: R$ ${totalProfit.toFixed(2)}`);
        console.log(`📈 Taxa Média de Acerto: ${avgWinRate}%`);
        console.log(`🔄 Última Atualização PnL: ${updatedOps} operações atualizadas`);

        console.log('\n🎯 LEGENDA');
        console.log('🟢 Lucro | 🔴 Prejuízo | ⚪ Neutro | 🥇🥈🥉 Top 3 | OPS = Abertas/Total');

    } catch (error) {
        console.error('❌ Erro no monitor:', error.message);
    }
}

/**
 * 🔄 Iniciar monitoramento de operações
 */
async function startOperationsMonitoring() {
    console.log('🚀 INICIANDO MONITOR DE OPERAÇÕES E RETORNOS');
    console.log('=' .repeat(60));
    console.log('⚡ Atualizações a cada 15 segundos');
    console.log('💹 PnL calculado em tempo real');
    console.log('🏆 Ranking de performance dinâmico');
    console.log('📊 Dados diretos do banco de produção');
    console.log('=' .repeat(60));
    
    // Primeira execução
    await displayOperationsMonitor();
    
    // Loop contínuo a cada 15 segundos
    setInterval(async () => {
        await displayOperationsMonitor();
    }, 15000);
}

// Executar se chamado diretamente
if (require.main === module) {
    startOperationsMonitoring().catch(console.error);
}

module.exports = {
    startOperationsMonitoring,
    fetchDetailedOperations,
    fetchUserPerformanceRanking,
    updateOperationsPnL,
    displayOperationsMonitor
};
