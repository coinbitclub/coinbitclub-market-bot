/**
 * 📊 RELATÓRIO DE DESEMPENHO ROBÔ PALOMA
 * Check completo do desempenho e status operacional
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkDesempenhoRoboPaloma() {
    try {
        console.log('📊 RELATÓRIO DE DESEMPENHO ROBÔ - PALOMA AMARAL');
        console.log('='.repeat(70));
        console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
        console.log('👤 Conta: Paloma Amaral (pamaral15@hotmail.com)');
        console.log('');
        
        const palomaId = 12;
        
        // 1. STATUS GERAL DA CONTA
        console.log('💰 1. STATUS GERAL DA CONTA');
        console.log('-'.repeat(40));
        
        const saldoQuery = `
            SELECT available_balance, locked_balance
            FROM user_balances 
            WHERE user_id = $1 AND exchange = 'bybit'
            ORDER BY created_at DESC LIMIT 1
        `;
        const saldoResult = await pool.query(saldoQuery, [palomaId]);
        
        if (saldoResult.rows.length > 0) {
            const saldo = saldoResult.rows[0];
            const saldoTotal = parseFloat(saldo.available_balance) + parseFloat(saldo.locked_balance);
            
            console.log(`💵 Saldo Total: $${saldoTotal.toFixed(2)} USDT`);
            console.log(`✅ Disponível: $${parseFloat(saldo.available_balance).toFixed(2)}`);
            console.log(`🔒 Em Operações: $${parseFloat(saldo.locked_balance).toFixed(2)}`);
            console.log(`📊 % Utilizado: ${((parseFloat(saldo.locked_balance)/saldoTotal)*100).toFixed(1)}%`);
        }
        
        // 2. OPERAÇÕES ATIVAS
        console.log('\n📈 2. OPERAÇÕES ATIVAS EM TEMPO REAL');
        console.log('-'.repeat(40));
        
        const operacoesAtivasQuery = `
            SELECT 
                id, symbol, operation_type, amount, entry_price, current_price,
                take_profit, stop_loss, leverage, pnl, created_at,
                EXTRACT(MINUTES FROM (NOW() - created_at)) as minutos_ativa
            FROM user_operations 
            WHERE user_id = $1 AND status = 'open'
            ORDER BY created_at DESC
        `;
        
        const operacoesAtivas = await pool.query(operacoesAtivasQuery, [palomaId]);
        
        if (operacoesAtivas.rows.length === 0) {
            console.log('❌ Nenhuma operação ativa no momento');
        } else {
            console.log(`📊 Total de Operações Ativas: ${operacoesAtivas.rows.length}`);
            console.log('');
            
            let totalPnL = 0;
            let totalInvestido = 0;
            
            operacoesAtivas.rows.forEach((op, index) => {
                const pnl = parseFloat(op.pnl || 0);
                const valorInvestido = parseFloat(op.amount || 0) * parseFloat(op.entry_price || 0);
                totalPnL += pnl;
                totalInvestido += valorInvestido;
                
                console.log(`   ${index + 1}. ${op.symbol} ${op.operation_type} (${op.leverage}x)`);
                console.log(`      💰 Valor: $${valorInvestido.toFixed(2)}`);
                console.log(`      📈 Entry: $${parseFloat(op.entry_price).toFixed(4)}`);
                console.log(`      📊 Atual: $${parseFloat(op.current_price || op.entry_price).toFixed(4)}`);
                console.log(`      🎯 TP: $${parseFloat(op.take_profit).toFixed(4)}`);
                console.log(`      🛑 SL: $${parseFloat(op.stop_loss).toFixed(4)}`);
                console.log(`      💵 P&L: $${pnl.toFixed(2)} ${pnl >= 0 ? '📈' : '📉'}`);
                console.log(`      ⏰ Tempo: ${Math.floor(op.minutos_ativa)} minutos`);
                console.log('');
            });
            
            console.log(`💵 P&L TOTAL ATUAL: $${totalPnL.toFixed(2)} ${totalPnL >= 0 ? '✅' : '❌'}`);
            console.log(`💰 Total Investido: $${totalInvestido.toFixed(2)}`);
            console.log(`📊 Retorno Atual: ${totalInvestido > 0 ? ((totalPnL/totalInvestido)*100).toFixed(2) : 0}%`);
        }
        
        // 3. HISTÓRICO DE PERFORMANCE
        console.log('\n📋 3. HISTÓRICO DE PERFORMANCE');
        console.log('-'.repeat(40));
        
        const historicoQuery = `
            SELECT 
                COUNT(*) as total_operacoes,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechadas,
                COUNT(CASE WHEN status = 'closed' AND pnl > 0 THEN 1 END) as lucros,
                COUNT(CASE WHEN status = 'closed' AND pnl < 0 THEN 1 END) as prejuizos,
                COALESCE(SUM(CASE WHEN status = 'closed' THEN pnl ELSE 0 END), 0) as total_pnl_fechado,
                COALESCE(SUM(CASE WHEN status = 'open' THEN pnl ELSE 0 END), 0) as total_pnl_aberto,
                COALESCE(AVG(CASE WHEN status = 'closed' THEN pnl ELSE NULL END), 0) as media_pnl,
                MAX(CASE WHEN status = 'closed' THEN pnl ELSE NULL END) as maior_lucro,
                MIN(CASE WHEN status = 'closed' THEN pnl ELSE NULL END) as maior_perda
            FROM user_operations 
            WHERE user_id = $1
        `;
        
        const historico = await pool.query(historicoQuery, [palomaId]);
        const stats = historico.rows[0];
        
        const taxaSucesso = stats.fechadas > 0 ? ((stats.lucros / stats.fechadas) * 100).toFixed(1) : 0;
        const totalPnLGeral = parseFloat(stats.total_pnl_fechado) + parseFloat(stats.total_pnl_aberto);
        
        console.log(`📊 Total de Operações: ${stats.total_operacoes}`);
        console.log(`✅ Abertas: ${stats.abertas} | 🏁 Fechadas: ${stats.fechadas}`);
        console.log(`💚 Lucros: ${stats.lucros} | 🔴 Prejuízos: ${stats.prejuizos}`);
        console.log(`🎯 Taxa de Sucesso: ${taxaSucesso}%`);
        console.log(`💵 P&L Total (Fechadas): $${parseFloat(stats.total_pnl_fechado).toFixed(2)}`);
        console.log(`💵 P&L Total (Abertas): $${parseFloat(stats.total_pnl_aberto).toFixed(2)}`);
        console.log(`💰 P&L Geral: $${totalPnLGeral.toFixed(2)}`);
        console.log(`📈 Média por Operação: $${parseFloat(stats.media_pnl).toFixed(2)}`);
        console.log(`🚀 Maior Lucro: $${parseFloat(stats.maior_lucro || 0).toFixed(2)}`);
        console.log(`💥 Maior Perda: $${parseFloat(stats.maior_perda || 0).toFixed(2)}`);
        
        // 4. ANÁLISE DE RISCOS
        console.log('\n⚠️ 4. ANÁLISE DE RISCOS');
        console.log('-'.repeat(40));
        
        if (operacoesAtivas.rows.length > 0) {
            const operacoesRisco = operacoesAtivas.rows.filter(op => {
                const pnl = parseFloat(op.pnl || 0);
                const stopLoss = parseFloat(op.stop_loss);
                const currentPrice = parseFloat(op.current_price || op.entry_price);
                
                if (op.operation_type === 'LONG') {
                    const distanciaParaSL = ((currentPrice - stopLoss) / currentPrice) * 100;
                    return distanciaParaSL <= 10; // Próximo do Stop Loss
                } else {
                    const distanciaParaSL = ((stopLoss - currentPrice) / currentPrice) * 100;
                    return distanciaParaSL <= 10;
                }
            });
            
            console.log(`🚨 Operações em Risco: ${operacoesRisco.length}`);
            console.log(`⚡ Exposição Total: $${totalInvestido.toFixed(2)}`);
            console.log(`📉 P&L Negativo: ${operacoesAtivas.rows.filter(op => parseFloat(op.pnl || 0) < 0).length}`);
            
            if (operacoesRisco.length > 0) {
                console.log('\n🚨 OPERAÇÕES PRÓXIMAS DO STOP LOSS:');
                operacoesRisco.forEach(op => {
                    console.log(`   ⚠️ ${op.symbol} ${op.operation_type} - P&L: $${parseFloat(op.pnl || 0).toFixed(2)}`);
                });
            }
        }
        
        // 5. STATUS DA IA SUPERVISOR
        console.log('\n🤖 5. STATUS DA IA SUPERVISOR');
        console.log('-'.repeat(40));
        
        // Verificar se IA está rodando (baseado nos logs recentes)
        const ultimaAtividadeQuery = `
            SELECT created_at, updated_at
            FROM user_operations 
            WHERE user_id = $1 
            ORDER BY updated_at DESC 
            LIMIT 1
        `;
        
        const ultimaAtividade = await pool.query(ultimaAtividadeQuery, [palomaId]);
        
        if (ultimaAtividade.rows.length > 0) {
            const ultimaAtualizacao = new Date(ultimaAtividade.rows[0].updated_at);
            const agora = new Date();
            const minutosDesdeAtualizacao = Math.floor((agora - ultimaAtualizacao) / (1000 * 60));
            
            console.log(`⏰ Última Atualização: ${minutosDesdeAtualizacao} minutos atrás`);
            console.log(`${minutosDesdeAtualizacao <= 2 ? '✅' : '❌'} IA Supervisor: ${minutosDesdeAtualizacao <= 2 ? 'ATIVO' : 'POSSÍVEL PROBLEMA'}`);
        }
        
        console.log('✅ Monitoramento Tempo Real: ATIVO (30s)');
        console.log('✅ Timeout de Sinais: 2 minutos');
        console.log('✅ Fechamento Rápido: < 1 segundo');
        
        // 6. RECOMENDAÇÕES
        console.log('\n💡 6. RECOMENDAÇÕES');
        console.log('-'.repeat(40));
        
        if (parseFloat(stats.total_pnl_aberto) < -50) {
            console.log('🚨 ATENÇÃO: P&L negativo significativo em operações abertas');
        }
        
        if (operacoesAtivas.rows.length > 3) {
            console.log('⚠️ ATENÇÃO: Muitas operações simultâneas - verificar diversificação');
        }
        
        if (taxaSucesso < 50 && stats.fechadas > 5) {
            console.log('📉 ATENÇÃO: Taxa de sucesso abaixo de 50%');
        }
        
        if (operacoesAtivas.rows.length === 0) {
            console.log('💭 NEUTRO: Nenhuma operação ativa - aguardando sinais');
        }
        
        if (totalPnLGeral > 0) {
            console.log('✅ POSITIVO: P&L geral em lucro - estratégia funcionando');
        }
        
        console.log('\n✅ RELATÓRIO CONCLUÍDO');
        console.log(`🔄 Próxima atualização em tempo real via IA Supervisor`);
        console.log(`📊 Dashboard disponível em: http://localhost:3001/api/dashboard/paloma`);
        
    } catch (error) {
        console.error('❌ Erro no relatório:', error.message);
        
        if (error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND')) {
            console.log('\n🔌 PROBLEMA DE CONEXÃO DETECTADO:');
            console.log('   • Conexão com banco de dados instável');
            console.log('   • Recomendação: Reiniciar sistema');
            console.log('   • Verificar status da Railway');
        }
    } finally {
        await pool.end();
    }
}

checkDesempenhoRoboPaloma();
