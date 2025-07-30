const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarSistemaChaves() {
  try {
    console.log('🔍 VERIFICANDO SISTEMA DE CHAVES API...');
    console.log('=' .repeat(60));
    
    // 1. Verificar estrutura das tabelas relacionadas a chaves
    console.log('📋 VERIFICANDO ESTRUTURA DAS TABELAS:');
    
    const tabelas = ['user_api_keys', 'system_api_keys', 'user_credentials', 'users'];
    
    for (const tabela of tabelas) {
      try {
        const colunas = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tabela]);
        
        if (colunas.rows.length > 0) {
          console.log(`✅ Tabela ${tabela}:`);
          colunas.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
          });
        } else {
          console.log(`❌ Tabela ${tabela} não encontrada`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar ${tabela}:`, error.message);
      }
    }
    
    // 2. Buscar usuários Luiza
    console.log('\n👤 BUSCANDO USUÁRIOS LUIZA:');
    const users = await pool.query(`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE name ILIKE '%luiza%' OR email ILIKE '%luiza%'
      ORDER BY id
    `);
    
    console.log(`Encontrados ${users.rows.length} usuários:`);
    users.rows.forEach(user => {
      console.log(`   ID: ${user.id} | Nome: ${user.name} | Email: ${user.email}`);
    });
    
    // 3. Verificar chaves em todas as tabelas possíveis
    if (users.rows.length > 0) {
      for (const user of users.rows) {
        console.log(`\n🔑 VERIFICANDO CHAVES PARA ${user.name} (ID: ${user.id}):`);
        
        // Verificar user_api_keys
        try {
          const apiKeys = await pool.query(`SELECT * FROM user_api_keys WHERE user_id = $1`, [user.id]);
          console.log(`   user_api_keys: ${apiKeys.rows.length} registros`);
          if (apiKeys.rows.length > 0) {
            apiKeys.rows.forEach((key, idx) => {
              console.log(`     Chave ${idx + 1}:`, Object.keys(key).map(k => `${k}: ${key[k]}`).join(', '));
            });
          }
        } catch (error) {
          console.log(`   user_api_keys: Erro - ${error.message}`);
        }
        
        // Verificar system_api_keys
        try {
          const sysKeys = await pool.query(`SELECT * FROM system_api_keys WHERE user_id = $1`, [user.id]);
          console.log(`   system_api_keys: ${sysKeys.rows.length} registros`);
          if (sysKeys.rows.length > 0) {
            sysKeys.rows.forEach((key, idx) => {
              console.log(`     Chave ${idx + 1}:`, Object.keys(key).map(k => `${k}: ${key[k]}`).join(', '));
            });
          }
        } catch (error) {
          console.log(`   system_api_keys: Erro - ${error.message}`);
        }
        
        // Verificar user_credentials
        try {
          const creds = await pool.query(`SELECT * FROM user_credentials WHERE user_id = $1`, [user.id]);
          console.log(`   user_credentials: ${creds.rows.length} registros`);
          if (creds.rows.length > 0) {
            creds.rows.forEach((cred, idx) => {
              console.log(`     Credencial ${idx + 1}:`, Object.keys(cred).map(k => `${k}: ${cred[k]}`).join(', '));
            });
          }
        } catch (error) {
          console.log(`   user_credentials: Erro - ${error.message}`);
        }
      }
    }
    
    // 4. Verificar saldos/créditos para usuários Luiza
    console.log('\n💰 VERIFICANDO SALDOS E CRÉDITOS:');
    
    for (const user of users.rows) {
      console.log(`\n💳 SALDOS PARA ${user.name} (ID: ${user.id}):`);
      
      // Verificar user_balances
      try {
        const balances = await pool.query(`SELECT * FROM user_balances WHERE user_id = $1`, [user.id]);
        if (balances.rows.length > 0) {
          balances.rows.forEach(balance => {
            console.log(`   Balance ID ${balance.id}:`);
            Object.keys(balance).forEach(key => {
              if (balance[key] !== null) {
                console.log(`     ${key}: ${balance[key]}`);
              }
            });
          });
        } else {
          console.log(`   user_balances: Nenhum registro encontrado`);
        }
      } catch (error) {
        console.log(`   user_balances: Erro - ${error.message}`);
      }
      
      // Verificar user_financial
      try {
        const financial = await pool.query(`SELECT * FROM user_financial WHERE user_id = $1`, [user.id]);
        if (financial.rows.length > 0) {
          financial.rows.forEach(fin => {
            console.log(`   Financial ID ${fin.id}:`);
            Object.keys(fin).forEach(key => {
              if (fin[key] !== null) {
                console.log(`     ${key}: ${fin[key]}`);
              }
            });
          });
        } else {
          console.log(`   user_financial: Nenhum registro encontrado`);
        }
      } catch (error) {
        console.log(`   user_financial: Erro - ${error.message}`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA CONCLUÍDA');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarSistemaChaves().catch(console.error);
