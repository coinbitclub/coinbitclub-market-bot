const { Pool } = require('pg');

// Configuração do banco Railway
const pool = new Pool({
  user: 'postgres',
  host: 'maglev.proxy.rlwy.net',
  database: 'railway',
  password: 'OXaHZcyMxxtXsLfyVKrUswUzqGWqbJcL',
  port: 42095,
});

console.log('🔍 VERIFICANDO CHAVES NO BANCO DE DADOS');
console.log('='.repeat(60));

async function verificarChavesBanco() {
  try {
    console.log('📊 Conectando ao banco...');
    
    // Buscar todas as chaves API
    const result = await pool.query('SELECT * FROM user_api_keys ORDER BY user_id');
    
    console.log(`\n📋 ${result.rows.length} chaves encontradas no banco:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`👤 Usuário ${index + 1}:`);
      console.log(`   🆔 ID: ${row.user_id}`);
      console.log(`   📧 Email: ${row.user_email}`);
      console.log(`   🔑 API Key: ${row.api_key}`);
      console.log(`   🔐 Secret: ${row.api_secret}`);
      console.log(`   ⚡ Ativo: ${row.is_active}`);
      console.log(`   📅 Criado: ${row.created_at}`);
      console.log(`   🔄 Atualizado: ${row.updated_at}`);
      console.log('');
    });
    
    // Procurar especificamente pela Luiza
    const luizaQuery = await pool.query(
      "SELECT * FROM user_api_keys WHERE user_email ILIKE '%luiza%' OR user_email ILIKE '%maria%'"
    );
    
    console.log('\n🔍 FOCO NA LUIZA:');
    console.log('-'.repeat(40));
    
    if (luizaQuery.rows.length > 0) {
      const luiza = luizaQuery.rows[0];
      console.log(`👤 Usuária: ${luiza.user_email}`);
      console.log(`🔑 API Key no banco: "${luiza.api_key}"`);
      console.log(`🔐 Secret no banco: "${luiza.api_secret}"`);
      console.log('');
      
      // Chaves corretas da imagem
      const chaveCorreta = '9HZy9BiUW95iXprVRl';
      const secretCorreto = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';
      
      console.log('🎯 COMPARAÇÃO COM CHAVES CORRETAS:');
      console.log(`📝 Chave correta: "${chaveCorreta}"`);
      console.log(`📝 Secret correto: "${secretCorreto}"`);
      console.log('');
      
      // Verificar se são iguais
      const chaveIgual = luiza.api_key === chaveCorreta;
      const secretIgual = luiza.api_secret === secretCorreto;
      
      console.log(`✅ API Key igual: ${chaveIgual ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`✅ Secret igual: ${secretIgual ? '✅ SIM' : '❌ NÃO'}`);
      
      if (!chaveIgual) {
        console.log(`🔍 Diferença na API Key:`);
        console.log(`   Banco: "${luiza.api_key}" (${luiza.api_key.length} chars)`);
        console.log(`   Correto: "${chaveCorreta}" (${chaveCorreta.length} chars)`);
      }
      
      if (!secretIgual) {
        console.log(`🔍 Diferença no Secret:`);
        console.log(`   Banco: "${luiza.api_secret}" (${luiza.api_secret.length} chars)`);
        console.log(`   Correto: "${secretCorreto}" (${secretCorreto.length} chars)`);
      }
      
    } else {
      console.log('❌ Nenhuma entrada da Luiza encontrada no banco!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔚 Conexão fechada.');
  }
}

verificarChavesBanco();
