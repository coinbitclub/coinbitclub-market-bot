const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
  database: 'railway'
});

async function listarOperacoes() {
  try {
    console.log('🔍 Listando operações diretamente...\n');

    // Operações sem JOIN primeiro
    const ops = await pool.query(`
      SELECT 
        id,
        user_id,
        symbol,
        side,
        entry_price,
        exit_price,
        profit,
        quantity,
        leverage,
        status,
        exchange,
        environment,
        opened_at,
        closed_at,
        created_at
      FROM operations 
      ORDER BY created_at DESC
    `);

    console.log(`📊 Total: ${ops.rows.length} operações\n`);

    // Listar cada operação
    for (let i = 0; i < ops.rows.length; i++) {
      const op = ops.rows[i];
      console.log(`🔸 OPERAÇÃO #${i + 1}:`);
      console.log(`   ID: ${op.id}`);
      console.log(`   👤 User ID: ${op.user_id}`);
      console.log(`   💱 Exchange: ${op.exchange || 'N/A'}`);
      console.log(`   🌍 Ambiente: ${op.environment || 'N/A'}`);
      console.log(`   📈 Par: ${op.symbol || 'N/A'}`);
      console.log(`   ⚡ Lado: ${op.side || 'N/A'}`);
      console.log(`   📊 Quantidade: ${op.quantity || 'N/A'}`);
      console.log(`   🔢 Alavancagem: ${op.leverage || 'N/A'}x`);
      console.log(`   💰 Entrada: $${op.entry_price || 'N/A'}`);
      console.log(`   💸 Saída: $${op.exit_price || 'N/A'}`);
      console.log(`   💵 P&L: $${op.profit || 'N/A'}`);
      console.log(`   ✅ Status: ${op.status || 'N/A'}`);
      console.log(`   📅 Aberta: ${op.opened_at ? new Date(op.opened_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   📅 Fechada: ${op.closed_at ? new Date(op.closed_at).toLocaleString('pt-BR') : 'Ainda aberta'}`);
      console.log(`   📅 Criada: ${op.created_at ? new Date(op.created_at).toLocaleString('pt-BR') : 'N/A'}`);
      
      // Buscar dados do usuário separadamente
      try {
        const userQuery = await pool.query(`
          SELECT name, email, vip_status 
          FROM users 
          WHERE id = $1
        `, [op.user_id]);
        
        if (userQuery.rows.length > 0) {
          const user = userQuery.rows[0];
          console.log(`   👤 Nome: ${user.name || 'N/A'}`);
          console.log(`   📧 Email: ${user.email || 'N/A'}`);
          console.log(`   👑 VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
        } else {
          console.log(`   👤 Usuário não encontrado`);
        }
      } catch (userError) {
        console.log(`   👤 Erro ao buscar usuário: ${userError.message}`);
      }
      
      console.log('   ' + '-'.repeat(60));
    }

    // Resumo por usuário
    if (ops.rows.length > 0) {
      console.log('\n📈 RESUMO POR USUÁRIO:');
      const userOps = {};
      ops.rows.forEach(op => {
        const userId = op.user_id;
        if (!userOps[userId]) {
          userOps[userId] = {
            count: 0,
            symbols: new Set(),
            totalProfit: 0
          };
        }
        userOps[userId].count++;
        if (op.symbol) userOps[userId].symbols.add(op.symbol);
        if (op.profit) userOps[userId].totalProfit += parseFloat(op.profit);
      });

      Object.entries(userOps).forEach(([userId, stats]) => {
        console.log(`   👤 User ${userId}: ${stats.count} operações`);
        console.log(`      📈 Pares: ${Array.from(stats.symbols).join(', ') || 'N/A'}`);
        console.log(`      💵 P&L Total: $${stats.totalProfit.toFixed(2)}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

listarOperacoes();
