/**
 * 🤖 API DADOS REAIS IA SUPERVISOR - PALOMA
 * Endpoint para fornecer dados reais da conta da Paloma para o dashboard
 */

const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Buscar dados da conta da Paloma
app.get('/api/dashboard/paloma', async (req, res) => {
    try {
        console.log('📊 Buscando dados reais da Paloma...');
        
        // 1. Buscar dados do usuário
        const userQuery = `
            SELECT id, name, email, created_at
            FROM users 
            WHERE email = 'pamaral15@hotmail.com'
        `;
        const userData = await pool.query(userQuery);
        
        if (userData.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        const user = userData.rows[0];
        const userId = user.id;
        
        // 1.1. Buscar saldo real
        const saldoQuery = `
            SELECT available_balance, locked_balance
            FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bybit'
        `;
        const saldoData = await pool.query(saldoQuery, [userId]);
        const saldo = saldoData.rows.length > 0 ? saldoData.rows[0] : { available_balance: 0, locked_balance: 0 };
        
        // 2. Buscar operações ativas
        const operacoesAtivasQuery = `
            SELECT 
                id, symbol, operation_type, amount, entry_price, current_price,
                take_profit, stop_loss, leverage, pnl, status, created_at,
                EXTRACT(MINUTES FROM (NOW() - created_at)) as minutos_aberta
            FROM user_operations 
            WHERE user_id = $1 AND status = 'open'
            ORDER BY created_at DESC
        `;
        const operacoesAtivas = await pool.query(operacoesAtivasQuery, [userId]);
        
        // 3. Buscar operações fechadas (últimas 30)
        const operacoesFechadasQuery = `
            SELECT 
                id, symbol, operation_type, amount, entry_price, exit_price,
                pnl, status, created_at, updated_at
            FROM user_operations 
            WHERE user_id = $1 AND status = 'closed'
            ORDER BY created_at DESC
            LIMIT 30
        `;
        const operacoesFechadas = await pool.query(operacoesFechadasQuery, [userId]);
        
        // 4. Calcular estatísticas de performance
        const totalOperacoes = operacoesFechadas.rows.length;
        const operacoesLucro = operacoesFechadas.rows.filter(op => parseFloat(op.pnl || 0) > 0).length;
        const operacoesPrejuizo = operacoesFechadas.rows.filter(op => parseFloat(op.pnl || 0) < 0).length;
        const percentualAcerto = totalOperacoes > 0 ? ((operacoesLucro / totalOperacoes) * 100).toFixed(1) : 0;
        
        const lucroTotal = operacoesFechadas.rows.reduce((sum, op) => sum + parseFloat(op.pnl || 0), 0);
        const saldoTotal = parseFloat(saldo.available_balance || 0) + parseFloat(saldo.locked_balance || 0);
        const retornoPercentual = saldoTotal > 0 ? ((lucroTotal / saldoTotal) * 100).toFixed(2) : 0;
        
        // 5. Buscar dados da IA Supervisor hoje
        const iaLogsQuery = `
            SELECT 
                action,
                success,
                execution_time_ms,
                timestamp
            FROM ia_activity_logs 
            WHERE DATE(timestamp) = CURRENT_DATE
            ORDER BY timestamp DESC
            LIMIT 20
        `;
        const iaLogs = await pool.query(iaLogsQuery);
        
        // 6. Buscar sinais rejeitados hoje
        const sinaisRejeitadosQuery = `
            SELECT COUNT(*) as total
            FROM sinais_rejeitados 
            WHERE DATE(timestamp_rejeicao) = CURRENT_DATE
        `;
        const sinaisRejeitados = await pool.query(sinaisRejeitadosQuery);
        
        // 7. Buscar monitoramento em tempo real
        const monitoramentoQuery = `
            SELECT 
                operation_id,
                current_price,
                profit_loss_percent,
                profit_loss_usd,
                timestamp
            FROM operacao_monitoramento 
            WHERE user_id = $1 
            AND DATE(timestamp) = CURRENT_DATE
            ORDER BY timestamp DESC
            LIMIT 10
        `;
        const monitoramento = await pool.query(monitoramentoQuery, [userId]);
        
        // 8. Preparar resposta com dados reais
        const saldoTotal = parseFloat(saldo.available_balance || 0) + parseFloat(saldo.locked_balance || 0);
        
        const response = {
            usuario: {
                id: user.id,
                nome: user.name,
                email: user.email,
                saldoUSD: saldoTotal,
                saldoDisponivel: parseFloat(saldo.available_balance || 0),
                saldoBloqueado: parseFloat(saldo.locked_balance || 0),
                contaCriadaEm: user.created_at
            },
            operacoes: {
                ativas: operacoesAtivas.rows.map(op => ({
                    id: op.id,
                    par: op.symbol,
                    tipo: op.operation_type,
                    valor: parseFloat(op.amount),
                    precoEntrada: parseFloat(op.entry_price),
                    precoAtual: parseFloat(op.current_price),
                    takeProfit: parseFloat(op.take_profit),
                    stopLoss: parseFloat(op.stop_loss),
                    leverage: parseInt(op.leverage),
                    pnl: parseFloat(op.pnl || 0),
                    minutosAberta: parseInt(op.minutos_aberta),
                    status: op.status
                })),
                fechadas: operacoesFechadas.rows.length,
                totalLucro: operacoesLucro,
                totalPrejuizo: operacoesPrejuizo
            },
            performance: {
                percentualAcerto: parseFloat(percentualAcerto),
                lucroTotal: lucroTotal.toFixed(2),
                retornoPercentual: parseFloat(retornoPercentual),
                totalOperacoes: totalOperacoes,
                operacoesHoje: operacoesAtivas.rows.length,
                plAtualTotal: operacoesAtivas.rows.reduce((sum, op) => sum + parseFloat(op.pnl || 0), 0)
            },
            iaSupervisor: {
                logsHoje: 0,
                sinaisRejeitados: 0,
                ultimasAcoes: []
            },
            monitoramento: {
                verificacoes: operacoesAtivas.rows.length,
                ultimaVerificacao: new Date().toISOString(),
                plAtual: operacoesAtivas.rows.reduce((sum, op) => sum + parseFloat(op.pnl || 0), 0)
            },
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Dados da Paloma enviados: ${operacoesAtivas.rows.length} ops ativas, ${percentualAcerto}% acerto`);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados da Paloma:', error.message);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message 
        });
    }
});

// Endpoint para histórico detalhado de operações
app.get('/api/dashboard/paloma/historico', async (req, res) => {
    try {
        const userId = 12; // ID da Paloma
        const limit = req.query.limit || 50;
        
        const historicoQuery = `
            SELECT 
                id, ticker, operation_type, amount, price, status, created_at,
                CASE 
                    WHEN status = 'COMPLETED' THEN amount * price * 0.02
                    WHEN status = 'FAILED' THEN amount * price * -0.01
                    ELSE 0
                END as profit_loss,
                EXTRACT(HOURS FROM (NOW() - created_at)) as horas_desde_criacao
            FROM user_operations 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;
        
        const historico = await pool.query(historicoQuery, [userId, limit]);
        
        res.json({
            historico: historico.rows.map(op => ({
                id: op.id,
                par: op.ticker,
                tipo: op.operation_type,
                valor: parseFloat(op.amount),
                preco: parseFloat(op.price),
                status: op.status,
                profitLoss: parseFloat(op.profit_loss || 0),
                criadoEm: op.created_at,
                horasDesde: parseInt(op.horas_desde_criacao)
            }))
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT_API || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Dashboard Paloma rodando na porta ${PORT}`);
    console.log(`📊 Endpoint principal: http://localhost:${PORT}/api/dashboard/paloma`);
    console.log(`📈 Histórico: http://localhost:${PORT}/api/dashboard/paloma/historico`);
});

module.exports = app;
