import bcrypt from 'bcrypt';
import { db } from '../backend/common/db.js';

async function createAdminUser() {
  try {
    const email = 'faleconosco@coinbitclub.vip';
    const password = 'Apelido22@';
    const name = 'ERICA ANDRADE';
    const country = 'Brasil';
    
    // Verificar se o usuário já existe
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      console.log('Usuário admin já existe!');
      return;
    }
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Criar usuário admin
    const [adminUser] = await db('users').insert({
      email,
      password_hash: passwordHash,
      name,
      country,
      is_admin: true,
      is_active: true,
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('Nome:', name);
    console.log('País:', country);
    console.log('ID:', adminUser.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdminUser();
