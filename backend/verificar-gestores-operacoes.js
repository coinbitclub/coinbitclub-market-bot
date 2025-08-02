const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
});

async function verificarGestoresEOperacoes() {
  try {
    console.log('🔍 Verificando Gestores e Operações Ativas...\n');
    
    // 1. Verificar se existem gestores reais na tabela users
    const gestoresReais = await pool.query(`
      SELECT 
        id, 
        username, 
        email, 
        status, 
        user_type,
        vip_status,
        last_login,
        created_at
      FROM users 
      WHERE user_type IN ('manager', 'supervisor', 'admin', 'bot') 
         OR username ILIKE '%gestor%' 
         OR username ILIKE '%manager%'
         OR username ILIKE '%supervisor%'
         OR username ILIKE '%bot%'
      ORDER BY created_at DESC
    `);
    
    console.log('📊 GESTORES REAIS ENCONTRADOS:', gestoresReais.rows.length);
    if (gestoresReais.rows.length > 0) {
      gestoresReais.rows.forEach(gestor => {
        console.log(`- ID: ${gestor.id} | User: ${gestor.username} | Type: ${gestor.user_type} | Status: ${gestor.status}`);
      });
    } else {
      console.log('❌ Nenhum gestor real encontrado na tabela users');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. Verificar operações ativas por usuário
    const operacoesAtivas = await pool.query(`
      SELECT 
        to.user_id,
        u.username,
        u.email,
        u.user_type,
        COUNT(*) as total_operacoes,
        COUNT(CASE WHEN to.status = 'pending' THEN 1 END) as pendentes,
        COUNT(CASE WHEN to.status = 'active' THEN 1 END) as ativas,
        COUNT(CASE WHEN to.status = 'partially_filled' THEN 1 END) as parciais,
        SUM(CASE WHEN to.pnl IS NOT NULL THEN to.pnl ELSE 0 END) as pnl_total,
        MAX(to.created_at) as ultima_operacao
      FROM trading_operations to
      LEFT JOIN users u ON to.user_id = u.id
      WHERE to.status IN ('pending', 'active', 'partially_filled')
      GROUP BY to.user_id, u.username, u.email, u.user_type
      ORDER BY total_operacoes DESC
    `);
    
    console.log('⚡ OPERAÇÕES ATIVAS POR USUÁRIO:', operacoesAtivas.rows.length, 'usuários com operações');
    if (operacoesAtivas.rows.length > 0) {
      operacoesAtivas.rows.forEach(op => {
        console.log(`- User ID: ${op.user_id} | Username: ${op.username || 'N/A'} | Type: ${op.user_type || 'N/A'}`);
        console.log(`  Operações: ${op.total_operacoes} (Pendentes: ${op.pendentes}, Ativas: ${op.ativas}, Parciais: ${op.parciais})`);
        console.log(`  P&L Total: $${parseFloat(op.pnl_total || 0).toFixed(2)} | Última: ${new Date(op.ultima_operacao).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma operação ativa encontrada');
    }
    
    console.log('='.repeat(60) + '\n');
    
    // 3. Verificar todas as operações recentes
    const operacoesRecentes = await pool.query(`
      SELECT 
        to.id,
        to.user_id,
        u.username,
        to.symbol,
        to.side,
        to.quantity,
        to.entry_price,
        to.current_price,
        to.pnl,
        to.status,
        to.created_at
      FROM trading_operations to
      LEFT JOIN users u ON to.user_id = u.id
      WHERE to.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY to.created_at DESC
      LIMIT 20
    `);
    
    console.log('📈 OPERAÇÕES ÚLTIMAS 24H:', operacoesRecentes.rows.length);
    if (operacoesRecentes.rows.length > 0) {
      operacoesRecentes.rows.forEach(op => {
        console.log(`- ID: ${op.id} | User: ${op.user_id} (${op.username || 'N/A'}) | ${op.symbol} ${op.side}`);
        console.log(`  Status: ${op.status} | Entry: $${parseFloat(op.entry_price || 0).toFixed(4)} | P&L: ${op.pnl || 0}`);
        console.log(`  Criado: ${new Date(op.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
    console.log('='.repeat(60) + '\n');
    
    // 4. Verificar usuários cadastrados
    const usuariosCadastrados = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
        COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN user_type = 'manager' THEN 1 END) as managers,
        COUNT(CASE WHEN user_type = 'user' THEN 1 END) as users,
        COUNT(CASE WHEN vip_status = true THEN 1 END) as vip
      FROM users
    `);
    
    console.log('👥 RESUMO DE USUÁRIOS:');
    const stats = usuariosCadastrados.rows[0];
    console.log(`- Total: ${stats.total}`);
    console.log(`- Ativos: ${stats.ativos}`);
    console.log(`- Admins: ${stats.admins}`);
    console.log(`- Managers: ${stats.managers}`);
    console.log(`- Users: ${stats.users}`);
    console.log(`- VIP: ${stats.vip}`);
    
    // 5. Verificar estrutura das tabelas
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('📋 ESTRUTURA DAS TABELAS:');
    
    const tabelasUsers = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🏗️ Colunas da tabela USERS:');
    tabelasUsers.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const tabelasOperations = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trading_operations' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n⚡ Colunas da tabela TRADING_OPERATIONS:');
    tabelasOperations.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarGestoresEOperacoes();
