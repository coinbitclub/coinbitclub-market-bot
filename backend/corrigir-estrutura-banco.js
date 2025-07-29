// ====================================
// SCRIPT: Corrigir Estrutura do Banco
// ====================================

const { Pool } = require('pg');

// Configuração do banco (Railway)
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function corrigirEstruturaBanco() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Iniciando correção da estrutura do banco...\n');

        // 1. Criar tabela users se não existir
        console.log('👥 Criando/Ajustando tabela users...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                otp_code VARCHAR(6),
                otp_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Adicionar coluna password se não existir
        try {
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS password VARCHAR(255);
            `);
            console.log('✅ Coluna password adicionada/verificada');
        } catch (error) {
            if (!error.message.includes('already exists')) {
                console.log('⚠️ Erro ao adicionar password:', error.message);
            }
        }

        // 3. Criar/Ajustar tabela trading_signals
        console.log('\n📊 Criando/Ajustando tabela trading_signals...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS trading_signals (
                signal_id SERIAL PRIMARY KEY,
                ticker VARCHAR(20) NOT NULL,
                side VARCHAR(10) NOT NULL,
                price DECIMAL(12,2),
                strategy VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed BOOLEAN DEFAULT false,
                webhook_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Verificar se a coluna signal_id existe
        const checkSignalId = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals' 
            AND column_name = 'signal_id';
        `);

        if (checkSignalId.rows.length === 0) {
            await client.query(`
                ALTER TABLE trading_signals 
                ADD COLUMN signal_id SERIAL PRIMARY KEY;
            `);
            console.log('✅ Coluna signal_id adicionada');
        } else {
            console.log('✅ Coluna signal_id já existe');
        }

        // 5. Criar outras tabelas necessárias
        console.log('\n💰 Criando tabelas auxiliares...');
        
        // Tabela de planos
        await client.query(`
            CREATE TABLE IF NOT EXISTS plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                description TEXT,
                features JSONB,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabela de operações
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_operations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                ticker VARCHAR(20),
                operation_type VARCHAR(10),
                amount DECIMAL(12,2),
                price DECIMAL(12,2),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabela de afiliados
        await client.query(`
            CREATE TABLE IF NOT EXISTS affiliates (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                commission_rate DECIMAL(5,2) DEFAULT 10.00,
                total_commissions DECIMAL(12,2) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Inserir dados de teste
        console.log('\n🔧 Inserindo dados de teste...');
        
        // Inserir usuário de teste se não existir
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            ['teste.homologacao@coinbitclub.com']
        );

        if (existingUser.rows.length === 0) {
            await client.query(`
                INSERT INTO users (email, name, role, password) 
                VALUES ($1, $2, $3, $4)
            `, [
                'teste.homologacao@coinbitclub.com',
                'Teste Homologação',
                'user',
                'hash_password_123'
            ]);
            console.log('✅ Usuário de teste criado');
        } else {
            console.log('✅ Usuário de teste já existe');
        }

        // Inserir plano de teste
        const existingPlan = await client.query('SELECT id FROM plans LIMIT 1');
        if (existingPlan.rows.length === 0) {
            await client.query(`
                INSERT INTO plans (name, price, description, features) 
                VALUES ($1, $2, $3, $4)
            `, [
                'Plano Básico',
                99.90,
                'Plano básico para iniciantes',
                JSON.stringify(['Sinais básicos', 'Suporte via chat', '30 operações/mês'])
            ]);
            console.log('✅ Plano de teste criado');
        }

        // 7. Verificar estrutura final
        console.log('\n📋 Verificando estrutura final...');
        
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('📊 Tabelas existentes:');
        tables.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });

        // Verificar colunas da tabela users
        const userColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);

        console.log('\n👥 Colunas da tabela users:');
        userColumns.rows.forEach(row => {
            console.log(`   ✅ ${row.column_name} (${row.data_type})`);
        });

        // Verificar colunas da tabela trading_signals
        const signalColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'trading_signals'
            ORDER BY ordinal_position;
        `);

        console.log('\n📊 Colunas da tabela trading_signals:');
        signalColumns.rows.forEach(row => {
            console.log(`   ✅ ${row.column_name} (${row.data_type})`);
        });

        console.log('\n🎉 ESTRUTURA DO BANCO CORRIGIDA COM SUCESSO!');
        console.log('✅ Todas as tabelas e colunas necessárias foram criadas/verificadas');
        console.log('✅ Sistema pronto para homologação final');

    } catch (error) {
        console.error('❌ Erro ao corrigir estrutura:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Executar
corrigirEstruturaBanco();
