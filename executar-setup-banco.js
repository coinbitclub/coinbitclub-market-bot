// SETUP COMPLETO DO BANCO DE DADOS MARKETBOT
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco Railway
const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('🚀 SETUP COMPLETO DO BANCO MARKETBOT');
console.log('=' * 50);

async function setupDatabase() {
  try {
    console.log('\n📊 Conectando ao banco de dados...');
    const client = await pool.connect();
    
    console.log('✅ Conexão estabelecida com PostgreSQL');
    
    // Ler arquivo SQL
    console.log('\n📝 Lendo script de configuração...');
    const sqlPath = path.join(__dirname, 'setup-database-completo.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('✅ Script carregado com sucesso');
    
    // Executar script
    console.log('\n🔧 Executando configuração do banco...');
    await client.query(sqlScript);
    
    console.log('✅ Todas as tabelas criadas com sucesso');
    
    // Verificar resultados
    console.log('\n🔍 Verificando estrutura criada...');
    
    const tables = ['usuarios', 'sinais', 'ordens', 'configuracoes_trading', 'market_intelligence', 'webhook_signals'];
    
    for (const table of tables) {
      const result = await client.query('SELECT COUNT(*) as count FROM ' + table);
      console.log(`   📊 Tabela '${table}': ${result.rows[0].count} registros`);
    }
    
    // Verificar usuários ativos
    console.log('\n👥 Verificando usuários ativos...');
    const activeUsers = await client.query('SELECT nome, email, saldo_disponivel FROM usuarios WHERE trading_ativo = true');
    
    activeUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nome} (${user.email}) - Saldo: $${user.saldo_disponivel}`);
    });
    
    console.log('\n✅ BANCO CONFIGURADO COM SUCESSO!');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Estrutura do banco criada');
    console.log('2. ✅ Usuários de teste cadastrados');
    console.log('3. ✅ Configurações de trading definidas');
    console.log('4. 🚀 Sistema pronto para receber sinais e processar ordens');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro durante setup:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar setup
setupDatabase()
  .then(() => {
    console.log('\n🎉 Setup finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha no setup:', error.message);
    process.exit(1);
  });
