#!/usr/bin/env node

/**
 * Script de Correção do Esquema do Banco de Dados
 * Adiciona as colunas necessárias que estão faltando
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fixDatabaseSchema() {
  console.log('🔧 Iniciando correção do esquema do banco de dados...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // 1. Adicionar coluna phone na tabela users
    console.log('📞 Adicionando coluna phone na tabela users...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      `);
      console.log('✅ Coluna phone adicionada com sucesso');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna phone já existe');
      } else {
        throw error;
      }
    }

    // 2. Adicionar coluna user_type na tabela users
    console.log('👤 Adicionando coluna user_type na tabela users...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user';
      `);
      console.log('✅ Coluna user_type adicionada com sucesso');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna user_type já existe');
      } else {
        throw error;
      }
    }

    // 3. Adicionar colunas de reset de senha na tabela users
    console.log('🔐 Adicionando colunas de reset de senha na tabela users...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
      `);
      console.log('✅ Colunas de reset de senha adicionadas com sucesso');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Colunas de reset de senha já existem');
      } else {
        throw error;
      }
    }

    // 4. Adicionar coluna is_active na tabela users
    console.log('👤 Adicionando coluna is_active na tabela users...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `);
      console.log('✅ Coluna is_active adicionada na tabela users');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna is_active já existe na tabela users');
      } else {
        throw error;
      }
    }

    // 5. Adicionar coluna email_verification_token na tabela users
    console.log('📧 Adicionando coluna email_verification_token na tabela users...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
      `);
      console.log('✅ Coluna email_verification_token adicionada na tabela users');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna email_verification_token já existe na tabela users');
      } else {
        throw error;
      }
    }

    // 6. Adicionar coluna is_active na tabela affiliates
    console.log('🤝 Adicionando coluna is_active na tabela affiliates...');
    try {
      await client.query(`
        ALTER TABLE affiliates 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `);
      console.log('✅ Coluna is_active adicionada na tabela affiliates');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Coluna is_active já existe na tabela affiliates');
      } else {
        throw error;
      }
    }

    // 7. Verificar e exibir estrutura atual das tabelas
    console.log('\n📊 Verificando estrutura atual das tabelas...');
    
    // Estrutura da tabela users
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.log('\n👥 Colunas da tabela USERS:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Estrutura da tabela affiliates
    const affiliatesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'affiliates' 
      ORDER BY ordinal_position;
    `);
    console.log('\n🤝 Colunas da tabela AFFILIATES:');
    affiliatesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    console.log('\n🎉 Correção do esquema concluída com sucesso!');
    console.log('🚀 Agora as APIs devem funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro na correção do esquema:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };
