/**
 * 🚀 POPULADOR DE OPERAÇÕES DE EXEMPLO
 * Cria operações realistas para demonstração do sistema
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function popularOperacoes() {
    try {
        console.log('🚀 POPULANDO OPERAÇÕES DE EXEMPLO...');
        console.log('=====================================');

        // 1. Buscar usuários ativos
        const users = await pool.query(`
            SELECT id, name FROM users WHERE is_active = true LIMIT 5
        `);

        if (users.rows.length === 0) {
            console.log('❌ Nenhum usuário ativo encontrado');
            return;
        }

        console.log(`✅ Encontrados ${users.rows.length} usuários ativos`);

        // 2. Limpar operações existentes na tabela live_operations
        await pool.query('DELETE FROM live_operations');
        console.log('🧹 Tabela live_operations limpa');

        // 3. Criar operações de exemplo
        const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'LINKUSDT', 'SOLUSDT'];
        const sides = ['Buy', 'Sell'];
        let totalInserted = 0;

        // Operações fechadas (histórico)
        for (let i = 0; i < 8; i++) {
            const user = users.rows[Math.floor(Math.random() * users.rows.length)];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const tipo = sides[Math.floor(Math.random() * sides.length)] === 'Buy' ? 'LONG' : 'SHORT';
            const quantidade = (Math.random() * 0.5 + 0.1).toFixed(8);
            const precoEntrada = Math.random() * 10000 + 50000;
            const isProfit = Math.random() > 0.2; // 80% de chance de lucro
            const pnlPercent = isProfit ? Math.random() * 0.08 + 0.01 : -(Math.random() * 0.05 + 0.01);
            const pnl = precoEntrada * parseFloat(quantidade) * pnlPercent;
            const precoSaida = precoEntrada * (1 + pnlPercent);
            const durationMinutes = Math.floor(Math.random() * 240) + 30; // 30min - 4h
            
            const abertaEm = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
            const fechadaEm = new Date(abertaEm.getTime() + durationMinutes * 60 * 1000);

            await pool.query(`
                INSERT INTO live_operations (
                    user_id, symbol, tipo, quantidade,
                    preco_entrada, preco_saida, pnl,
                    status, exchange, aberta_em, fechada_em,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                )
            `, [
                user.id, symbol, tipo, quantidade,
                precoEntrada, precoSaida, pnl,
                'FECHADA', 'BYBIT', abertaEm, fechadaEm,
                abertaEm, fechadaEm
            ]);

            totalInserted++;
            console.log(`   ✅ Operação fechada criada: ${symbol} ${tipo} - ${isProfit ? 'LUCRO' : 'PREJUÍZO'} $${pnl.toFixed(2)}`);
        }

        // Operações abertas (em andamento)
        for (let i = 0; i < 3; i++) {
            const user = users.rows[Math.floor(Math.random() * users.rows.length)];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const tipo = sides[Math.floor(Math.random() * sides.length)] === 'Buy' ? 'LONG' : 'SHORT';
            const quantidade = (Math.random() * 0.3 + 0.05).toFixed(8);
            const precoEntrada = Math.random() * 10000 + 50000;
            const precoAtual = precoEntrada * (1 + (Math.random() - 0.4) * 0.05); // -2% a +3%
            const pnlAtual = (precoAtual - precoEntrada) * parseFloat(quantidade);
            
            const abertaEm = new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000); // Últimas 2 horas

            await pool.query(`
                INSERT INTO live_operations (
                    user_id, symbol, tipo, quantidade,
                    preco_entrada, preco_saida, pnl_atual,
                    status, exchange, aberta_em,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                )
            `, [
                user.id, symbol, tipo, quantidade,
                precoEntrada, precoAtual, pnlAtual,
                'ABERTA', 'BYBIT', abertaEm,
                abertaEm, new Date()
            ]);

            totalInserted++;
            console.log(`   🔓 Operação aberta criada: ${symbol} ${tipo} - P&L: $${pnlAtual.toFixed(2)}`);
        }

        console.log('\n📊 RESUMO DA POPULAÇÃO:');
        console.log(`   ✅ Total de operações criadas: ${totalInserted}`);
        console.log(`   🔒 Operações fechadas: ${totalInserted - 3}`);
        console.log(`   🔓 Operações abertas: 3`);

        // 4. Verificar resultados
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'ABERTA') as abertas,
                COUNT(*) FILTER (WHERE status = 'FECHADA') as fechadas,
                COUNT(*) FILTER (WHERE status = 'FECHADA' AND pnl > 0) as lucrativas,
                COALESCE(SUM(pnl), 0) as pnl_total
            FROM live_operations
        `);

        const result = stats.rows[0];
        const taxaSucesso = result.fechadas > 0 ? Math.round((result.lucrativas / result.fechadas) * 100) : 0;

        console.log('\n🎯 ESTATÍSTICAS FINAIS:');
        console.log(`   📊 Total: ${result.total} operações`);
        console.log(`   🔓 Abertas: ${result.abertas}`);
        console.log(`   🔒 Fechadas: ${result.fechadas}`);
        console.log(`   💰 Lucrativas: ${result.lucrativas}`);
        console.log(`   📈 Taxa de sucesso: ${taxaSucesso}%`);
        console.log(`   💵 PnL total: $${parseFloat(result.pnl_total).toFixed(2)}`);

        console.log('\n🎉 População concluída com sucesso!');
        console.log('🌐 Acesse: http://localhost:3000/live para ver os dados em tempo real');

    } catch (error) {
        console.error('❌ Erro na população:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar população
popularOperacoes();
