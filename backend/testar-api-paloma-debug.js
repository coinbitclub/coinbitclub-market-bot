/**
 * 🧪 TESTAR API PALOMA - DIAGNÓSTICO
 * Verificar por que API retorna 0 operações
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function testarAPIPaloma() {
    try {
        console.log('🧪 TESTANDO API PALOMA - DIAGNÓSTICO');
        console.log('='.repeat(50));
        
        // 1. Buscar Paloma
        const userQuery = `SELECT id, name, email FROM users WHERE email = 'pamaral15@hotmail.com';`;
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Paloma não encontrada');
            return;
        }
        
        const palomaId = userResult.rows[0].id;
        console.log(`✅ Paloma ID: ${palomaId}`);
        
        // 2. Consulta que IA Supervisor usa
        console.log('\n📊 CONSULTA IA SUPERVISOR:');
        const iaSupervisorQuery = `
            SELECT 
                uo.id, uo.user_id, uo.symbol, uo.operation_type as side,
                uo.entry_price, uo.current_price, uo.amount as quantity, uo.leverage,
                uo.take_profit, uo.stop_loss,
                uo.status, uo.created_at, uo.updated_at,
                u.name as user_name, u.email,
                EXTRACT(MINUTES FROM (NOW() - uo.created_at)) as minutos_aberta
            FROM user_operations uo
            JOIN users u ON uo.user_id = u.id
            WHERE uo.status = 'open'
            ORDER BY uo.created_at ASC
        `;
        
        const iaResult = await pool.query(iaSupervisorQuery);
        console.log(`   Resultado: ${iaResult.rows.length} operações`);
        iaResult.rows.forEach(op => {
            console.log(`   - ID: ${op.id}, Usuário: ${op.user_name}, ${op.side} ${op.symbol}, Status: ${op.status}`);
        });
        
        // 3. Consulta específica para Paloma
        console.log('\n📊 CONSULTA ESPECÍFICA PALOMA:');
        const palomaOpsQuery = `
            SELECT 
                uo.id, uo.user_id, uo.symbol, uo.operation_type,
                uo.entry_price, uo.current_price, uo.amount, uo.leverage,
                uo.status, uo.created_at
            FROM user_operations uo
            WHERE uo.user_id = $1
            ORDER BY uo.created_at DESC
        `;
        
        const palomaOpsResult = await pool.query(palomaOpsQuery, [palomaId]);
        console.log(`   Total operações Paloma: ${palomaOpsResult.rows.length}`);
        palomaOpsResult.rows.forEach(op => {
            console.log(`   - ID: ${op.id}, ${op.operation_type} ${op.symbol}, Status: ${op.status}, Criada: ${op.created_at}`);
        });
        
        // 4. Verificar cálculo de performance
        console.log('\n📈 CÁLCULO DE PERFORMANCE:');
        const perfQuery = `
            SELECT 
                COUNT(*) as total_operacoes,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as operacoes_abertas,
                COUNT(CASE WHEN status = 'closed' AND pnl > 0 THEN 1 END) as operacoes_lucro,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as operacoes_fechadas,
                COALESCE(SUM(CASE WHEN status = 'closed' THEN pnl ELSE 0 END), 0) as total_pnl
            FROM user_operations 
            WHERE user_id = $1
        `;
        
        const perfResult = await pool.query(perfQuery, [palomaId]);
        const perf = perfResult.rows[0];
        
        console.log(`   Total operações: ${perf.total_operacoes}`);
        console.log(`   Operações abertas: ${perf.operacoes_abertas}`);
        console.log(`   Operações fechadas: ${perf.operacoes_fechadas}`);
        console.log(`   Operações com lucro: ${perf.operacoes_lucro}`);
        console.log(`   Total P&L: ${perf.total_pnl}`);
        
        const taxaAcerto = perf.operacoes_fechadas > 0 
            ? (perf.operacoes_lucro / perf.operacoes_fechadas * 100).toFixed(1)
            : 0;
        
        console.log(`   Taxa de acerto: ${taxaAcerto}%`);
        
        // 5. Teste da resposta da API
        console.log('\n🔗 SIMULANDO RESPOSTA DA API:');
        const apiResponse = {
            usuario: {
                nome: userResult.rows[0].name,
                email: userResult.rows[0].email,
                saldo: 1000.00
            },
            operacoes: {
                ativas: parseInt(perf.operacoes_abertas),
                total: parseInt(perf.total_operacoes),
                fechadas: parseInt(perf.operacoes_fechadas)
            },
            performance: {
                taxaAcerto: parseFloat(taxaAcerto),
                totalPnL: parseFloat(perf.total_pnl),
                operacoesLucro: parseInt(perf.operacoes_lucro)
            },
            timestamp: new Date().toISOString()
        };
        
        console.log(JSON.stringify(apiResponse, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

testarAPIPaloma();
