// 🗄️ VERIFICAÇÃO E MIGRAÇÃO DO BANCO
// =================================
//
// Script para verificar estrutura atual e fazer migração segura

const { Pool } = require('pg');

class DatabaseMigration {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async checkCurrentStructure() {
        console.log('🔍 Verificando estrutura atual do banco...');
        
        const client = await this.pool.connect();
        
        try {
            // Verificar tabelas existentes
            const tables = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `);

            console.log('\n📋 Tabelas existentes:');
            tables.rows.forEach(row => {
                console.log(`   • ${row.table_name}`);
            });

            // Verificar estrutura da tabela users se existir
            const usersExists = tables.rows.some(row => row.table_name === 'users');
            
            if (usersExists) {
                console.log('\n👥 Estrutura da tabela users:');
                const columns = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND table_schema = 'public'
                    ORDER BY ordinal_position;
                `);

                columns.rows.forEach(col => {
                    console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
                });
            }

            return {
                tablesExist: tables.rows.map(r => r.table_name),
                usersExists: usersExists
            };

        } finally {
            client.release();
        }
    }

    async migrateDatabase() {
        console.log('\n🔧 Iniciando migração do banco...');
        
        const client = await this.pool.connect();
        
        try {
            await client.begin();

            // 1. Verificar e alterar tabela users
            await this.migrateUsersTable(client);

            // 2. Criar novas tabelas se não existirem
            await this.createNewTables(client);

            // 3. Criar índices
            await this.createIndexes(client);

            await client.query('COMMIT');
            console.log('✅ Migração concluída com sucesso!');

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Erro na migração:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async migrateUsersTable(client) {
        console.log('👥 Migrando tabela users...');

        // Verificar se a tabela users existe
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            );
        `);

        if (tableExists.rows[0].exists) {
            console.log('   📋 Tabela users existe, adicionando colunas...');

            // Adicionar colunas que podem não existir
            const columnsToAdd = [
                'affiliate_code VARCHAR(20) UNIQUE',
                'affiliate_id INTEGER',
                'affiliate_type VARCHAR(20) DEFAULT \'none\'',
                'balance_real_brl INTEGER DEFAULT 0',
                'balance_real_usd INTEGER DEFAULT 0',
                'balance_admin_brl INTEGER DEFAULT 0',
                'balance_admin_usd INTEGER DEFAULT 0',
                'balance_commission_brl INTEGER DEFAULT 0',
                'balance_commission_usd INTEGER DEFAULT 0',
                'subscription_active BOOLEAN DEFAULT FALSE',
                'subscription_plan VARCHAR(50)',
                'stripe_customer_id VARCHAR(255)',
                'stripe_subscription_id VARCHAR(255)',
                'is_admin BOOLEAN DEFAULT FALSE'
            ];

            for (const column of columnsToAdd) {
                try {
                    const [columnName] = column.split(' ');
                    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column}`);
                    console.log(`   ✅ Coluna adicionada: ${columnName}`);
                } catch (error) {
                    console.log(`   ⚠️ Coluna já existe ou erro: ${column}`);
                }
            }

            // Atualizar códigos de afiliados para usuarios existentes sem código
            await client.query(`
                UPDATE users 
                SET affiliate_code = 'CBC' || UPPER(SUBSTRING(username, 1, 3)) || (1000 + (id % 9000))::text
                WHERE affiliate_code IS NULL OR affiliate_code = '';
            `);

        } else {
            console.log('   📋 Criando tabela users...');
            await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL DEFAULT 'temp_hash',
                    
                    -- Código de afiliado único
                    affiliate_code VARCHAR(20) UNIQUE NOT NULL DEFAULT ('CBC' || (1000 + FLOOR(RANDOM() * 9000)::int)::text),
                    affiliate_id INTEGER,
                    affiliate_type VARCHAR(20) DEFAULT 'none',
                    
                    -- Saldos separados
                    balance_real_brl INTEGER DEFAULT 0,
                    balance_real_usd INTEGER DEFAULT 0,
                    balance_admin_brl INTEGER DEFAULT 0,
                    balance_admin_usd INTEGER DEFAULT 0,
                    balance_commission_brl INTEGER DEFAULT 0,
                    balance_commission_usd INTEGER DEFAULT 0,
                    
                    -- Assinatura
                    subscription_active BOOLEAN DEFAULT FALSE,
                    subscription_plan VARCHAR(50),
                    stripe_customer_id VARCHAR(255),
                    stripe_subscription_id VARCHAR(255),
                    
                    -- Controle
                    is_active BOOLEAN DEFAULT TRUE,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
        }

        // Adicionar constraint de foreign key se não existir
        try {
            await client.query(`
                ALTER TABLE users 
                ADD CONSTRAINT fk_users_affiliate 
                FOREIGN KEY (affiliate_id) REFERENCES users(id)
                ON DELETE SET NULL;
            `);
        } catch (error) {
            // Constraint já existe ou erro
        }
    }

    async createNewTables(client) {
        console.log('📊 Criando tabelas adicionais...');

        // Tabela de cupons administrativos
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_coupons (
                id SERIAL PRIMARY KEY,
                coupon_code VARCHAR(50) UNIQUE NOT NULL,
                credit_amount INTEGER NOT NULL,
                currency VARCHAR(3) NOT NULL,
                
                created_by_admin INTEGER,
                used_by_user INTEGER,
                
                is_used BOOLEAN DEFAULT FALSE,
                used_at TIMESTAMP,
                expiration_date TIMESTAMP NOT NULL,
                
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Tabela de transações (modificar se já existir)
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                
                type VARCHAR(50) NOT NULL,
                amount INTEGER NOT NULL,
                currency VARCHAR(3) NOT NULL,
                
                stripe_payment_id VARCHAR(255),
                stripe_session_id VARCHAR(255),
                
                description TEXT,
                status VARCHAR(20) DEFAULT 'PENDING',
                
                affiliate_id INTEGER,
                commission_amount INTEGER DEFAULT 0,
                
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Tabela de links de afiliados
        await client.query(`
            CREATE TABLE IF NOT EXISTS affiliate_links (
                id SERIAL PRIMARY KEY,
                affiliate_id INTEGER,
                link_code VARCHAR(50) UNIQUE NOT NULL,
                link_type VARCHAR(20) NOT NULL,
                
                clicks INTEGER DEFAULT 0,
                conversions INTEGER DEFAULT 0,
                total_commission INTEGER DEFAULT 0,
                
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('✅ Tabelas criadas/verificadas');
    }

    async createIndexes(client) {
        console.log('📇 Criando índices...');

        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code)',
            'CREATE INDEX IF NOT EXISTS idx_users_affiliate_id ON users(affiliate_id)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON transactions(stripe_session_id)',
            'CREATE INDEX IF NOT EXISTS idx_admin_coupons_code ON admin_coupons(coupon_code)',
            'CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(link_code)'
        ];

        for (const index of indexes) {
            try {
                await client.query(index);
                console.log(`   ✅ Índice criado: ${index.split(' ON ')[1]}`);
            } catch (error) {
                console.log(`   ⚠️ Erro no índice: ${error.message}`);
            }
        }
    }

    async run() {
        try {
            console.log('🚀 VERIFICAÇÃO E MIGRAÇÃO DO BANCO');
            console.log('==================================');

            const structure = await this.checkCurrentStructure();
            await this.migrateDatabase();

            console.log('\n✅ BANCO TOTALMENTE CONFIGURADO!');
            console.log('===============================');

        } catch (error) {
            console.error('💥 Erro:', error);
        } finally {
            await this.pool.end();
        }
    }
}

// Executar migração
if (require.main === module) {
    const migration = new DatabaseMigration();
    migration.run();
}

module.exports = DatabaseMigration;
