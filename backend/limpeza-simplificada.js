const { Pool } = require('pg');

// Configuração de conexão Railway (multiple fallbacks)
const configs = [
  {
    name: 'Railway Alternative',
    connectionString: 'postgresql://postgres:ZJQIWGTaPdaHUbfOFHTyJCnhqCKXCGAC@maglev.proxy.rlwy.net:42095/railway'
  },
  {
    name: 'Railway Primary',
    connectionString: 'postgresql://postgres:ZJQIWGTaPdaHUbfOFHTyJCnhqCKXCGAC@yamabiko.proxy.rlwy.net:42095/railway'
  },
  {
    name: 'Railway Secondary',
    connectionString: 'postgresql://postgres:ZJQIWGTaPdaHUbfOFHTyJCnhqCKXCGAC@yamabiko.proxy.rlwy.net:32866/railway'
  }
];

let pool = null;

async function createConnection() {
  for (const config of configs) {
    try {
      console.log(`🔄 Tentando conexão: ${config.name}...`);
      const testPool = new Pool({
        connectionString: config.connectionString,
        ssl: false,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 5
      });
      
      // Testar conexão
      await testPool.query('SELECT 1');
      console.log(`✅ Conexão bem-sucedida: ${config.name}`);
      pool = testPool;
      return true;
    } catch (error) {
      console.log(`❌ Falha na conexão ${config.name}: ${error.message}`);
      continue;
    }
  }
  throw new Error('Todas as tentativas de conexão falharam');
}

async function limpezaSimplificada() {
  try {
    console.log('🔍 LIMPEZA SIMPLIFICADA DO SISTEMA');
    
    // Estabelecer conexão
    await createConnection();
    
    // 1. Identificar usuários válidos com chaves ativas
    const validUsersQuery = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.vip_status, u.created_at
      FROM users u
      INNER JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE uak.is_active = true 
        AND uak.validation_status = 'valid'
      ORDER BY u.id
    `);

    console.log(`✅ Encontrados ${validUsersQuery.rows.length} usuários VÁLIDOS:`);
    validUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email}) - VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      console.log(`      ID: ${user.id}`);
    });

    if (validUsersQuery.rows.length === 0) {
      console.log('❌ NENHUM usuário válido encontrado! Operação cancelada.');
      return;
    }

    const validUserIds = validUsersQuery.rows.map(u => u.id);
    
    // 2. Contar usuários que serão removidos
    const invalidUsersCount = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE id NOT IN (${validUserIds.join(',')})
    `);
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   ✅ Manter: ${validUsersQuery.rows.length} usuários válidos`);
    console.log(`   🗑️  Remover: ${invalidUsersCount.rows[0].count} usuários inválidos`);
    
    // 3. Confirmar operação
    console.log('\n⚠️  Esta operação REMOVERÁ PERMANENTEMENTE todos os usuários sem chaves válidas!');
    console.log('⏰ Iniciando em 3 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Remover usuários inválidos (cascade vai remover dados relacionados)
    console.log('\n🔄 Removendo usuários inválidos...');
    const deleteResult = await pool.query(`
      DELETE FROM users 
      WHERE id NOT IN (${validUserIds.join(',')})
      RETURNING id, name, email
    `);
    
    console.log(`✅ ${deleteResult.rowCount} usuários removidos:`);
    deleteResult.rows.forEach(user => {
      console.log(`   🗑️  ${user.name || 'N/A'} (${user.email}) - ID: ${user.id}`);
    });
    
    // 5. Verificar resultado final
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log(`\n🎯 LIMPEZA CONCLUÍDA!`);
    console.log(`   📊 Total de usuários restantes: ${finalCount.rows[0].total}`);
    console.log(`   ✅ Sistema limpo - apenas usuários com chaves válidas mantidos`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  } finally {
    await pool.end();
  }
}

limpezaSimplificada();
