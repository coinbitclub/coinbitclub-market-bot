const { Pool } = require('pg');

// Verificar qual banco está sendo usado atualmente
const currentUrl = process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';

console.log('🔍 VERIFICAÇÃO DO BANCO ATUAL');
console.log('============================');
console.log('URL atual:', currentUrl.substring(0, 50) + '...');

const pool = new Pool({
  connectionString: currentUrl,
  ssl: { rejectUnauthorized: false }
});

async function verifyCurrentDatabase() {
  try {
    const client = await pool.connect();
    
    // Verificar quantas tabelas existem
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tableCount = parseInt(tablesResult.rows[0].table_count);
    console.log(`📊 Tabelas encontradas: ${tableCount}`);
    
    // Verificar algumas tabelas específicas que sabemos que foram migradas
    const specificTables = ['api_configurations', 'btc_dominance', 'fear_greed_index', 'stripe_products'];
    
    for (const table of specificTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        console.log(`✅ ${table}: ${count} registros`);
      } catch (error) {
        console.log(`❌ ${table}: não encontrada`);
      }
    }
    
    // Verificar dados específicos que sabemos que foram migrados
    try {
      const configResult = await client.query('SELECT COUNT(*) as count FROM api_configurations');
      const configCount = parseInt(configResult.rows[0].count);
      
      if (configCount >= 10) {
        console.log('');
        console.log('🎉 BANCO NOVO DETECTADO!');
        console.log('✅ Dados migrados encontrados');
        console.log('✅ Servidor já está conectado ao banco correto');
        console.log('');
        console.log('💡 PRÓXIMOS PASSOS:');
        console.log('  1. Testar endpoints do servidor');
        console.log('  2. Verificar se webhooks estão funcionando');
        console.log('  3. Executar testes completos');
      } else {
        console.log('');
        console.log('⚠️ POSSÍVEL BANCO ANTIGO');
        console.log('📊 Poucos dados encontrados - pode precisar atualizar DATABASE_URL');
      }
    } catch (error) {
      console.log('');
      console.log('❌ TABELAS NÃO ENCONTRADAS');
      console.log('💡 Pode ser necessário atualizar DATABASE_URL para o novo banco');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    await pool.end();
  }
}

verifyCurrentDatabase();
