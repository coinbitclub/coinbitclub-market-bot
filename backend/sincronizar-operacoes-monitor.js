/**
 * 🔄 SINCRONIZADOR DE OPERAÇÕES PARA MONITOR
 * Migra dados da tabela operations para live_operations
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function sincronizarOperacoes() {
    try {
        console.log('🔄 SINCRONIZANDO OPERAÇÕES PARA MONITOR...');
        console.log('=====================================');

        // 1. Verificar se a tabela live_operations existe
        console.log('\n1️⃣ Verificando estrutura da tabela live_operations...');
        
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'live_operations'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('⚠️ Tabela live_operations não existe. Criando...');
            
            await pool.query(`
                CREATE TABLE live_operations (
                    id SERIAL PRIMARY KEY,
                    user_id UUID,
                    user_name VARCHAR(100),
                    symbol VARCHAR(20) NOT NULL,
                    side VARCHAR(10) NOT NULL,
                    quantity DECIMAL(20,8) NOT NULL,
                    entry_price DECIMAL(20,8),
                    current_price DECIMAL(20,8),
                    pnl_unrealized DECIMAL(20,8) DEFAULT 0,
                    pnl_realized DECIMAL(20,8) DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'OPEN',
                    order_id VARCHAR(100),
                    exchange VARCHAR(20) DEFAULT 'BYBIT',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    closed_at TIMESTAMP,
                    
                    stop_loss_price DECIMAL(20,8),
                    take_profit_price DECIMAL(20,8),
                    leverage INTEGER DEFAULT 1,
                    
                    signal_id UUID,
                    signal_source VARCHAR(50) DEFAULT 'TRADINGVIEW',
                    fear_greed_index INTEGER,
                    
                    max_profit DECIMAL(20,8) DEFAULT 0,
                    max_loss DECIMAL(20,8) DEFAULT 0,
                    duration_minutes INTEGER DEFAULT 0
                );
            `);
            
            console.log('✅ Tabela live_operations criada!');
        } else {
            console.log('✅ Tabela live_operations já existe');
        }

        // 2. Buscar usuários para mapear nomes
        console.log('\n2️⃣ Buscando dados de usuários...');
        
        const users = await pool.query(`
            SELECT id, name, email 
            FROM users 
            WHERE is_active = true
        `);
        
        const userMap = {};
        users.rows.forEach(user => {
            userMap[user.id] = user.name || user.email;
        });
        
        console.log(`✅ Encontrados ${users.rows.length} usuários ativos`);

        // 3. Buscar operações da tabela principal
        console.log('\n3️⃣ Buscando operações para sincronizar...');
        
        const operations = await pool.query(`
            SELECT 
                id, user_id, symbol, side, entry_price, exit_price,
                profit, opened_at, closed_at, status, signal_id,
                exchange, quantity, leverage, stop_loss, take_profit,
                created_at, updated_at
            FROM operations
            ORDER BY created_at DESC
            LIMIT 100
        `);
        
        console.log(`✅ Encontradas ${operations.rows.length} operações para processar`);

        // 4. Limpar tabela live_operations (opcional)
        console.log('\n4️⃣ Limpando tabela live_operations...');
        await pool.query('DELETE FROM live_operations');
        console.log('✅ Tabela limpa');

        // 5. Inserir operações sincronizadas
        console.log('\n5️⃣ Inserindo operações sincronizadas...');
        
        let inseridas = 0;
        let abertas = 0;
        let fechadas = 0;
        
        for (const op of operations.rows) {
            try {
                const userName = userMap[op.user_id] || 'Usuário Desconhecido';
                const isOpen = op.status === 'open' || op.status === 'active' || !op.closed_at;
                const status = isOpen ? 'ABERTA' : 'FECHADA';
                
                // Mapear side/tipo
                const tipo = op.side === 'buy' ? 'LONG' : 'SHORT';

                await pool.query(`
                    INSERT INTO live_operations (
                        user_id, symbol, tipo, quantidade,
                        preco_entrada, preco_saida, pnl,
                        status, exchange, aberta_em, fechada_em,
                        order_id, signal_id, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4,
                        $5, $6, $7,
                        $8, $9, $10, $11,
                        $12, $13, $14, $15
                    )
                `, [
                    op.user_id, op.symbol, tipo, op.quantity || 0,
                    op.entry_price, op.exit_price, op.profit || 0,
                    status, op.exchange || 'BYBIT', op.opened_at, op.closed_at,
                    op.id, op.signal_id, op.created_at, op.updated_at
                ]);

                inseridas++;
                if (isOpen) abertas++;
                else fechadas++;

                if (inseridas % 10 === 0) {
                    console.log(`   📊 Processadas ${inseridas}/${operations.rows.length} operações...`);
                }

            } catch (error) {
                console.error(`❌ Erro ao inserir operação ${op.id}:`, error.message);
            }
        }

        // 6. Estatísticas finais
        console.log('\n📊 SINCRONIZAÇÃO CONCLUÍDA!');
        console.log('==========================');
        console.log(`✅ Total inseridas: ${inseridas}`);
        console.log(`🔓 Operações abertas: ${abertas}`);
        console.log(`🔒 Operações fechadas: ${fechadas}`);

        // 7. Verificar resultado
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'ABERTA') as abertas,
                COUNT(*) FILTER (WHERE status = 'FECHADA') as fechadas,
                COUNT(*) FILTER (WHERE status = 'FECHADA' AND pnl > 0) as lucrativas
            FROM live_operations
        `);

        const stats = result.rows[0];
        const taxaSucesso = stats.fechadas > 0 ? Math.round((stats.lucrativas / stats.fechadas) * 100) : 0;

        console.log('\n📈 ESTATÍSTICAS DA SINCRONIZAÇÃO:');
        console.log(`   📊 Total de operações: ${stats.total}`);
        console.log(`   🔓 Operações abertas: ${stats.abertas}`);
        console.log(`   🔒 Operações fechadas: ${stats.fechadas}`);
        console.log(`   💰 Operações lucrativas: ${stats.lucrativas}`);
        console.log(`   📊 Taxa de sucesso: ${taxaSucesso}%`);

        console.log('\n🎯 Monitor de operações pronto para uso!');
        console.log('   🌐 Acesse: http://localhost:3000/operations');

    } catch (error) {
        console.error('❌ Erro na sincronização:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar sincronização
sincronizarOperacoes();
