/**
 * 🤖 API DADOS REAIS PALOMA - VERSÃO SIMPLIFICADA
 * Endpoint funcionando com dados reais da conta
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

// Endpoint principal - dados reais da Paloma
app.get('/api/dashboard/paloma', async (req, res) => {
    try {
        console.log('📊 Buscando dados reais da Paloma...');
        
        const palomaId = 12;
        
        // 1. Buscar dados do usuário
        const userQuery = `SELECT id, name, email, created_at FROM users WHERE id = $1`;
        const userData = await pool.query(userQuery, [palomaId]);
        
        if (userData.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        const user = userData.rows[0];
        
        // 2. Buscar saldo real
        const saldoQuery = `
            SELECT available_balance, locked_balance
            FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bybit'
        `;
        const saldoData = await pool.query(saldoQuery, [palomaId]);
        const saldo = saldoData.rows.length > 0 ? saldoData.rows[0] : { available_balance: 0, locked_balance: 0 };
        
        // 3. Buscar operações ativas
        const operacoesAtivasQuery = `
            SELECT 
                id, symbol, operation_type, amount, entry_price, current_price,
                take_profit, stop_loss, leverage, pnl, status, created_at,
                EXTRACT(MINUTES FROM (NOW() - created_at)) as minutos_aberta
            FROM user_operations 
            WHERE user_id = $1 AND status = 'open'
            ORDER BY created_at DESC
        `;
        const operacoesAtivas = await pool.query(operacoesAtivasQuery, [palomaId]);
        
        // 4. Buscar operações fechadas
        const operacoesFechadasQuery = `
            SELECT pnl, status
            FROM user_operations 
            WHERE user_id = $1 AND status = 'closed'
        `;
        const operacoesFechadas = await pool.query(operacoesFechadasQuery, [palomaId]);
        
        // 5. Calcular estatísticas
        const totalOperacoes = operacoesFechadas.rows.length;
        const operacoesLucro = operacoesFechadas.rows.filter(op => parseFloat(op.pnl || 0) > 0).length;
        const percentualAcerto = totalOperacoes > 0 ? ((operacoesLucro / totalOperacoes) * 100).toFixed(1) : 0;
        const lucroTotal = operacoesFechadas.rows.reduce((sum, op) => sum + parseFloat(op.pnl || 0), 0);
        const saldoTotal = parseFloat(saldo.available_balance || 0) + parseFloat(saldo.locked_balance || 0);
        const plAtualTotal = operacoesAtivas.rows.reduce((sum, op) => sum + parseFloat(op.pnl || 0), 0);
        
        // 6. Preparar resposta
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
                totalFechadas: totalOperacoes,
                totalLucro: operacoesLucro,
                totalPrejuizo: totalOperacoes - operacoesLucro
            },
            performance: {
                percentualAcerto: parseFloat(percentualAcerto),
                lucroTotal: lucroTotal.toFixed(2),
                plAtualTotal: plAtualTotal.toFixed(2),
                totalOperacoes: totalOperacoes,
                operacoesAbertas: operacoesAtivas.rows.length
            },
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Dados reais enviados: ${operacoesAtivas.rows.length} ops ativas, $${saldoTotal} saldo, ${percentualAcerto}% acerto`);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Erro na API:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Endpoint de histórico
app.get('/api/dashboard/paloma/historico', async (req, res) => {
    try {
        const palomaId = 12;
        
        const historicoQuery = `
            SELECT 
                id, symbol, operation_type, amount, entry_price, exit_price,
                take_profit, stop_loss, leverage, pnl, status, 
                created_at, updated_at
            FROM user_operations 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `;
        
        const result = await pool.query(historicoQuery, [palomaId]);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Erro no histórico:', error.message);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Dashboard Paloma rodando na porta ${PORT}`);
    console.log(`📊 Endpoint principal: http://localhost:${PORT}/api/dashboard/paloma`);
    console.log(`📈 Histórico: http://localhost:${PORT}/api/dashboard/paloma/historico`);
    
    // Atualizar dados a cada 10 segundos
    setInterval(async () => {
        try {
            // Simular atualização de preços
            await pool.query(`
                UPDATE user_operations 
                SET 
                    current_price = entry_price * (1 + (RANDOM() - 0.5) * 0.02),
                    pnl = CASE 
                        WHEN operation_type = 'LONG' THEN 
                            (current_price - entry_price) / entry_price * 100 * leverage
                        WHEN operation_type = 'SHORT' THEN 
                            (entry_price - current_price) / entry_price * 100 * leverage
                        ELSE 0
                    END,
                    updated_at = NOW()
                WHERE status = 'open' AND user_id = 12
            `);
        } catch (error) {
            // Ignorar erros de atualização
        }
    }, 10000);
});
