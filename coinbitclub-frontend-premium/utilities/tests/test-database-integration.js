#!/usr/bin/env node

/**
 * Script para executar migrações e testar a integração com banco de dados
 * Execute: node test-database-integration.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  console.log('🔄 Executando migrações do banco de dados...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Verificar se as tabelas existem
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'affiliates', 'user_balances', 'user_trading_settings', 'subscriptions')
      `);
      
      console.log('📋 Tabelas existentes:', tablesResult.rows.map(r => r.table_name));
      
      // Adicionar coluna user_type se não existir
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user' 
        CHECK (user_type IN ('user', 'affiliate', 'admin'))
      `);
      console.log('✅ Coluna user_type adicionada/verificada');
      
      // Criar tabela de afiliados se não existir
      await client.query(`
        CREATE TABLE IF NOT EXISTS affiliates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          affiliate_code VARCHAR(20) UNIQUE NOT NULL,
          commission_rate DECIMAL(5,2) DEFAULT 10.00,
          total_referrals INTEGER DEFAULT 0,
          total_commission_earned DECIMAL(15,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Tabela affiliates criada/verificada');
      
      // Criar função para gerar código de afiliado
      await client.query(`
        CREATE OR REPLACE FUNCTION generate_affiliate_code() RETURNS VARCHAR(20) AS $$
        DECLARE
            code VARCHAR(20);
            exists_check INTEGER;
        BEGIN
            LOOP
                code := upper(substring(md5(random()::text) from 1 for 8));
                SELECT COUNT(*) INTO exists_check FROM affiliates WHERE affiliate_code = code;
                IF exists_check = 0 THEN
                    RETURN code;
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('✅ Função generate_affiliate_code criada');
      
      // Criar usuário de teste se não existir
      const testUserEmail = 'test@coinbitclub.com';
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [testUserEmail]);
      
      if (existingUser.rows.length === 0) {
        const passwordHash = await bcrypt.hash('password123', 12);
        const userResult = await client.query(`
          INSERT INTO users (name, email, password_hash, user_type, is_active, is_email_verified)
          VALUES ($1, $2, $3, $4, true, true)
          RETURNING id
        `, ['Usuário Teste', testUserEmail, passwordHash, 'user']);
        
        const userId = userResult.rows[0].id;
        
        // Criar balances
        await client.query(`
          INSERT INTO user_balances (user_id, prepaid_balance, total_profit, total_loss)
          VALUES ($1, 100.00, 0, 0)
        `, [userId]);
        
        // Criar configurações de trading
        await client.query(`
          INSERT INTO user_trading_settings (user_id, max_leverage, max_stop_loss, max_percent_per_trade)
          VALUES ($1, 10, 5.0, 2.0)
        `, [userId]);
        
        console.log('✅ Usuário de teste criado:', testUserEmail);
      } else {
        console.log('ℹ️ Usuário de teste já existe:', testUserEmail);
      }
      
      // Criar afiliado de teste se não existir
      const testAffiliateEmail = 'affiliate@coinbitclub.com';
      const existingAffiliate = await client.query('SELECT id FROM users WHERE email = $1', [testAffiliateEmail]);
      
      if (existingAffiliate.rows.length === 0) {
        const passwordHash = await bcrypt.hash('password123', 12);
        const affiliateResult = await client.query(`
          INSERT INTO users (name, email, password_hash, user_type, is_active, is_email_verified)
          VALUES ($1, $2, $3, $4, true, true)
          RETURNING id
        `, ['Afiliado Teste', testAffiliateEmail, passwordHash, 'affiliate']);
        
        const affiliateId = affiliateResult.rows[0].id;
        
        // Gerar código de afiliado
        const codeResult = await client.query('SELECT generate_affiliate_code() as code');
        const affiliateCode = codeResult.rows[0].code;
        
        // Criar registro de afiliado
        await client.query(`
          INSERT INTO affiliates (user_id, affiliate_code, commission_rate)
          VALUES ($1, $2, 10.00)
        `, [affiliateId, affiliateCode]);
        
        // Criar balances
        await client.query(`
          INSERT INTO user_balances (user_id, prepaid_balance, total_profit, total_loss)
          VALUES ($1, 0, 0, 0)
        `, [affiliateId]);
        
        console.log('✅ Afiliado de teste criado:', testAffiliateEmail, 'Código:', affiliateCode);
      } else {
        console.log('ℹ️ Afiliado de teste já existe:', testAffiliateEmail);
      }
      
      console.log('🎉 Migrações executadas com sucesso!');
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    throw error;
  }
}

async function testConnection() {
  console.log('🔍 Testando conexão com banco de dados...');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    console.log('✅ Conexão com banco de dados OK:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão com banco:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando teste de integração com banco de dados...\n');
  
  try {
    // Testar conexão
    const isConnected = await testConnection();
    if (!isConnected) {
      process.exit(1);
    }
    
    // Executar migrações
    await runMigrations();
    
    console.log('\n✅ Integração com banco de dados configurada com sucesso!');
    console.log('\n📝 Usuários de teste criados:');
    console.log('   - test@coinbitclub.com (usuário) - senha: password123');
    console.log('   - affiliate@coinbitclub.com (afiliado) - senha: password123');
    console.log('\n🔗 Você pode agora testar o registro e login real!');
    
  } catch (error) {
    console.error('\n❌ Erro na integração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
