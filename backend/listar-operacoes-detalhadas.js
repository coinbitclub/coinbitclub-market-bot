const { Pool } = require('pg');

// Configuração da conexão com Railway PostgreSQL
const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
  database: 'railway',
  ssl: false,
  connectionTimeoutMillis: 10000
});

async function listarOperacoesDetalhadas() {
  try {
    console.log('🔍 Listando todas as operações detalhadas...\n');

    // Primeiro verificar a estrutura da tabela operations
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'operations'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela operations:');
    tableStructure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // Buscar operações com detalhes dos usuários (UUID para UUID)
    const operationsQuery = await pool.query(`
      SELECT 
        o.id as operation_id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        u.vip_status,
        o.symbol,
        o.side,
        o.entry_price,
        o.exit_price,
        o.profit,
        o.quantity,
        o.leverage,
        o.status,
        o.opened_at,
        o.closed_at,
        o.created_at,
        o.updated_at,
        o.exchange,
        o.environment,
        o.stop_loss,
        o.take_profit,
        o.commission
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    console.log(`📊 Total de operações encontradas: ${operationsQuery.rows.length}\n`);

    if (operationsQuery.rows.length === 0) {
      console.log('❌ Nenhuma operação encontrada na tabela operations');
      
      // Verificar outras tabelas de operações
      console.log('\n🔍 Verificando outras tabelas...');
      
      const userOpsQuery = await pool.query(`
        SELECT COUNT(*) as total FROM user_operations
      `);
      console.log(`📈 user_operations: ${userOpsQuery.rows[0].total} registros`);
      
      const tradingOpsQuery = await pool.query(`
        SELECT COUNT(*) as total FROM trading_operations
      `);
      console.log(`💹 trading_operations: ${tradingOpsQuery.rows[0].total} registros`);
      
      const liveOpsQuery = await pool.query(`
        SELECT COUNT(*) as total FROM live_operations
      `);
      console.log(`🔴 live_operations: ${liveOpsQuery.rows[0].total} registros`);
      
      return;
    }

    // Listar cada operação detalhadamente
    operationsQuery.rows.forEach((op, index) => {
      console.log(`\n🔸 OPERAÇÃO #${index + 1}:`);
      console.log(`   ID: ${op.operation_id}`);
      console.log(`   👤 Usuário: ${op.user_name || 'N/A'} (${op.user_email || 'N/A'})`);
      console.log(`   🆔 User ID: ${op.user_id}`);
      console.log(`   👑 VIP: ${op.vip_status ? 'Sim' : 'Não'}`);
      console.log(`   💱 Exchange: ${op.exchange || 'N/A'}`);
      console.log(`   🌍 Ambiente: ${op.environment || 'N/A'}`);
      console.log(`   📈 Par: ${op.symbol || 'N/A'}`);
      console.log(`   ⚡ Lado: ${op.side || 'N/A'}`);
      console.log(`   📊 Quantidade: ${op.quantity || 'N/A'}`);
      console.log(`   � Alavancagem: ${op.leverage || 'N/A'}x`);
      console.log(`   �💰 Preço Entrada: $${op.entry_price || 'N/A'}`);
      console.log(`   � Preço Saída: $${op.exit_price || 'N/A'}`);
      console.log(`   💵 Lucro/Prejuízo: $${op.profit || 'N/A'}`);
      console.log(`   💼 Comissão: $${op.commission || 'N/A'}`);
      console.log(`   🛑 Stop Loss: $${op.stop_loss || 'N/A'}`);
      console.log(`   🎯 Take Profit: $${op.take_profit || 'N/A'}`);
      console.log(`   ✅ Status: ${op.status || 'N/A'}`);
      console.log(`   📅 Aberta: ${op.opened_at ? new Date(op.opened_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   📅 Fechada: ${op.closed_at ? new Date(op.closed_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   📅 Criada: ${op.created_at ? new Date(op.created_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log(`   🔄 Atualizada: ${op.updated_at ? new Date(op.updated_at).toLocaleString('pt-BR') : 'N/A'}`);
      console.log('   ' + '-'.repeat(60));
    });

    // Estatísticas por usuário
    console.log('\n📈 ESTATÍSTICAS POR USUÁRIO:');
    const userStats = {};
    operationsQuery.rows.forEach(op => {
      const userName = op.user_name || `User ID ${op.user_id}`;
      if (!userStats[userName]) {
        userStats[userName] = {
          total: 0,
          vip: op.vip_status,
          email: op.user_email
        };
      }
      userStats[userName].total++;
    });

    Object.entries(userStats).forEach(([name, stats]) => {
      console.log(`   👤 ${name}: ${stats.total} operações ${stats.vip ? '👑' : ''}`);
      console.log(`      📧 ${stats.email || 'Email não informado'}`);
    });

    await pool.end();

  } catch (error) {
    console.error('❌ Erro ao listar operações:', error.message);
    await pool.end();
  }
}

// Executar
listarOperacoesDetalhadas();
