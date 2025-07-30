const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuração do banco de dados Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetUserPassword(email, newPassword) {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Procurando usuário com email: ${email}`);
    
    // Verificar se o usuário existe
    const userQuery = 'SELECT id, email, name, role FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado!');
      return false;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Atualizar senha no banco
    const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
    await client.query(updateQuery, [hashedPassword, user.id]);
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Nova senha: ${newPassword}`);
    console.log(`🎭 Role: ${user.role}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    return false;
  } finally {
    client.release();
  }
}

async function createNewUser(email, password, name, role = 'user') {
  const client = await pool.connect();
  
  try {
    console.log(`🆕 Criando novo usuário: ${email}`);
    
    // Verificar se usuário já existe
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ Usuário já existe!');
      return false;
    }
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Criar usuário
    const insertQuery = `
      INSERT INTO users (email, password_hash, name, role, status, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', true, NOW(), NOW())
      RETURNING id, email, name, role
    `;
    
    const result = await client.query(insertQuery, [email, hashedPassword, name, role]);
    const newUser = result.rows[0];
    
    console.log('✅ Usuário criado com sucesso!');
    console.log(`🆔 ID: ${newUser.id}`);
    console.log(`📧 Email: ${newUser.email}`);
    console.log(`👤 Nome: ${newUser.name}`);
    console.log(`🎭 Role: ${newUser.role}`);
    console.log(`🔐 Senha: ${password}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    return false;
  } finally {
    client.release();
  }
}

async function listUsers() {
  const client = await pool.connect();
  
  try {
    console.log('👥 Listando usuários...\n');
    
    const query = 'SELECT id, email, name, role, status, is_active, created_at FROM users ORDER BY created_at DESC';
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado!');
      return;
    }
    
    console.log(`📊 Total de usuários: ${result.rows.length}\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`👤 Usuário ${index + 1}:`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Nome: ${user.name || 'Não informado'}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   📊 Status: ${user.status}`);
      console.log(`   ✅ Ativo: ${user.is_active ? 'Sim' : 'Não'}`);
      console.log(`   📅 Criado: ${user.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } finally {
    client.release();
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔧 UTILITÁRIO DE GESTÃO DE USUÁRIOS - CoinBitClub

Comandos disponíveis:

📋 Listar usuários:
   node reset-password.js list

🔐 Resetar senha:
   node reset-password.js reset <email> <nova-senha>

🆕 Criar usuário:
   node reset-password.js create <email> <senha> <nome> [role]

Exemplos:
   node reset-password.js list
   node reset-password.js reset admin@coinbitclub.com minhaNovaSenh@123
   node reset-password.js create novo@coinbitclub.com senha123 "João Silva" admin
`);
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listUsers();
      break;
      
    case 'reset':
      if (args.length < 3) {
        console.log('❌ Uso: node reset-password.js reset <email> <nova-senha>');
        return;
      }
      await resetUserPassword(args[1], args[2]);
      break;
      
    case 'create':
      if (args.length < 4) {
        console.log('❌ Uso: node reset-password.js create <email> <senha> <nome> [role]');
        return;
      }
      const role = args[4] || 'user';
      await createNewUser(args[1], args[2], args[3], role);
      break;
      
    default:
      console.log('❌ Comando inválido! Use: list, reset ou create');
  }
  
  await pool.end();
}

// Executar
main().catch(console.error);
