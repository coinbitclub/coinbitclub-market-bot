/**
 * 🛠️ CRIAÇÃO MANUAL DA TABELA USERS
 * 
 * Este script cria apenas a estrutura básica necessária
 * para a FASE 5 funcionar
 */

const { Pool } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configuração do banco de dados
const dbConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: {
        rejectUnauthorized: false
    }
};

async function createEssentialTables() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🛠️ CRIANDO ESTRUTURAS ESSENCIAIS...');
        console.log('===================================\n');
        
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');
        
        // Criar extensões necessárias
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        console.log('✅ Extensões criadas');
        
        // Criar tipos enum necessários
        console.log('🔧 Criando tipos enum...');
        
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
                    CREATE TYPE user_type AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'AFFILIATE_VIP', 'AFFILIATE');
                END IF;
            END
            $$;
        `);
        
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
                    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
                END IF;
            END
            $$;
        `);
        
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
                    CREATE TYPE plan_type AS ENUM ('MONTHLY', 'PREPAID', 'NONE');
                END IF;
            END
            $$;
        `);
        
        console.log('✅ Tipos enum criados');
        
        // Criar tabela users
        console.log('👥 Criando tabela users...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                
                -- Configurações do usuário
                user_type user_type DEFAULT 'OPERADOR',
                user_status user_status DEFAULT 'PENDING_VERIFICATION',
                plan_type plan_type DEFAULT 'NONE',
                
                -- Configurações financeiras
                account_balance_usd DECIMAL(15,2) DEFAULT 0.00,
                commission_balance_brl DECIMAL(15,2) DEFAULT 0.00,
                prepaid_credits DECIMAL(15,2) DEFAULT 0.00,
                
                -- Configurações de trading
                enable_trading BOOLEAN DEFAULT false,
                enable_notifications BOOLEAN DEFAULT true,
                max_concurrent_positions INTEGER DEFAULT 3,
                
                -- Controle de acesso
                is_email_verified BOOLEAN DEFAULT false,
                is_phone_verified BOOLEAN DEFAULT false,
                is_2fa_enabled BOOLEAN DEFAULT false,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP WITH TIME ZONE,
                
                -- Timestamps
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT chk_users_balance CHECK (account_balance_usd >= 0),
                CONSTRAINT chk_users_commission CHECK (commission_balance_brl >= 0),
                CONSTRAINT chk_users_prepaid CHECK (prepaid_credits >= 0),
                CONSTRAINT chk_users_max_positions CHECK (max_concurrent_positions BETWEEN 1 AND 20),
                CONSTRAINT chk_users_failed_attempts CHECK (failed_login_attempts >= 0)
            );
        `);
        console.log('✅ Tabela users criada');
        
        // Criar índices essenciais
        console.log('📇 Criando índices...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(user_status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);`);
        console.log('✅ Índices criados');
        
        // Criar tabela de credenciais de exchange simplificada
        console.log('🔑 Criando tabela exchange_credentials...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS exchange_credentials (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                exchange_name VARCHAR(50) NOT NULL,
                api_key VARCHAR(255) NOT NULL,
                api_secret VARCHAR(500) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_exchange_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT uk_user_exchange UNIQUE (user_id, exchange_name)
            );
        `);
        console.log('✅ Tabela exchange_credentials criada');
        
        // Criar tabela user_subscriptions simplificada
        console.log('💳 Criando tabela user_subscriptions...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                plan_type plan_type NOT NULL,
                status VARCHAR(50) DEFAULT 'ACTIVE',
                start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP WITH TIME ZONE,
                amount_paid DECIMAL(10,2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                CONSTRAINT fk_user_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabela user_subscriptions criada');
        
        // Criar um usuário admin padrão
        console.log('👤 Criando usuário admin padrão...');
        await client.query(`
            INSERT INTO users (
                email, 
                password_hash, 
                first_name, 
                last_name, 
                user_type, 
                user_status,
                is_email_verified,
                enable_trading
            ) VALUES (
                'admin@marketbot.com',
                '$2b$12$LQv3c1yqBwEHxf5Ik8C0Que2vw8n8qP/w8fXKdV3xYrv5gI4HYvAG', -- 'admin123'
                'Admin',
                'MarketBot',
                'ADMIN',
                'ACTIVE',
                true,
                true
            ) ON CONFLICT (email) DO NOTHING;
        `);
        console.log('✅ Usuário admin criado');
        
        client.release();
        
        console.log('\n🎉 ESTRUTURAS ESSENCIAIS CRIADAS!');
        console.log('================================');
        console.log('📧 Admin: admin@marketbot.com');
        console.log('🔑 Senha: admin123');
        console.log('🚀 Pronto para executar migração FASE 5!');
        
    } catch (error) {
        console.error('❌ ERRO AO CRIAR ESTRUTURAS:', error.message);
        console.error('Detalhes:', error.detail);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createEssentialTables().catch(console.error);
}

module.exports = { createEssentialTables };
